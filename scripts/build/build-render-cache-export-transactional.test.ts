/**
 * @fileoverview Test de integración e2e: Escenario Transaccional y API Security (MHB-20).
 */

import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import Handlebars from "handlebars";
import { simulateRequest } from "../vite/test-helpers.js";
import { compileHtmlWithData } from "../export/compilers.js";
import { validateEspVariables } from "../esp/esp-variables.ts";
import { checkHtmlSize } from "../validators/check-html-size.js";
import { validateEmailHtml } from "../validators/validate-email-html.js";
import { setupCopyHtmlApi } from "../vite/api/copy-html.js";
import { applyPreviewTheme } from "../vite/api/render.js";
import {
  createPreviewCacheManager,
  createPreviewDataHash,
} from "../vite/services/preview-cache.js";
import { runSelectiveBuild } from "../vite/services/selective-build.js";
import { downloadHtml } from "../../src/web/features/preview/modules/copy-html/html-download.js";
import {
  createFakeDownloadEnvironment,
  createTransactionalFixture,
} from "./build-render-cache-export.test-fixtures.ts";

const projectRoot = process.cwd();

describe("MHB-20 — Integración Build, Render, Caché y Exportación (Transaccional)", () => {
  let tempDir: string;
  let rootDistBefore: string[];
  let consoleLogSpy: ReturnType<typeof spyOn> | null = null;
  let consoleWarnSpy: ReturnType<typeof spyOn> | null = null;
  let consoleInfoSpy: ReturnType<typeof spyOn> | null = null;

  beforeEach(() => {
    const distPath = resolve(projectRoot, "dist");
    rootDistBefore = existsSync(distPath) ? readdirSync(distPath) : [];

    tempDir = mkdtempSync(resolve(tmpdir(), "mhb20-transactional-"));

    consoleLogSpy = spyOn(console, "log").mockImplementation(() => {});
    consoleWarnSpy = spyOn(console, "warn").mockImplementation(() => {});
    consoleInfoSpy = spyOn(console, "info").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy?.mockRestore();
    consoleWarnSpy?.mockRestore();
    consoleInfoSpy?.mockRestore();

    if (tempDir && existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }

    const distPath = resolve(projectRoot, "dist");
    const rootDistAfter = existsSync(distPath) ? readdirSync(distPath) : [];
    expect(rootDistAfter).toEqual(rootDistBefore);
  });

  describe("Escenario Transaccional (Recibo de compra)", () => {
    test("flujo completo: build flatten, preservación {{ }}, gates, render, tema, caché y exportación", async () => {
      const fixture = createTransactionalFixture(tempDir, "receipt");
      const tempDist = resolve(tempDir, "dist");

      // 1. Build y Flatten
      const buildResult = await runSelectiveBuild(tempDir, fixture.templateName);
      expect(buildResult.success).toBe(true);
      expect(buildResult.html).toBeDefined();

      const finalHtmlFile = resolve(tempDist, `${fixture.templateName}.html`);
      expect(existsSync(finalHtmlFile)).toBe(true);
      expect(existsSync(resolve(tempDist, fixture.templateName))).toBe(false);

      const builtHtml = readFileSync(finalHtmlFile, "utf-8");

      // 2. Delimitadores en Build
      expect(builtHtml).toContain("Recibo de compra");
      expect(builtHtml).not.toContain("[[");
      expect(builtHtml).not.toContain("]]");

      // Variables ESP {{ }} deben preservarse intactas en el HTML final compilado
      expect(builtHtml).toContain("{{ customer_name }}");
      expect(builtHtml).toContain("{{ order_number }}");
      expect(builtHtml).toContain("{{ total_amount }}");
      expect(builtHtml).toContain("{{ receipt_url }}");

      // 3. Gates de calidad
      const sizeWarning = checkHtmlSize(tempDist);
      expect(sizeWarning).toBe(false);

      const compatibility = validateEmailHtml(tempDist, tempDir);
      expect(compatibility.errors).toBe(0);

      const espValidation = validateEspVariables({
        source: fixture.htmlContent,
        data: fixture.dataContent,
      });
      expect(espValidation.missing).toHaveLength(0);

      // 4. Render de Preview y Temas
      const templateFn = Handlebars.compile(builtHtml);
      const previewHtmlRaw = templateFn(fixture.dataContent);

      expect(previewHtmlRaw).toContain("Carlos Gómez");
      expect(previewHtmlRaw).toContain("ORD-2026-987");
      expect(previewHtmlRaw).toContain("$129.99");
      expect(previewHtmlRaw).not.toContain("{{ customer_name }}");

      const lightHtml = applyPreviewTheme(previewHtmlRaw, "light");
      expect(lightHtml).not.toContain("@media (prefers-color-scheme: dark)");

      const darkHtml = applyPreviewTheme(previewHtmlRaw, "dark");
      expect(darkHtml).toContain("#0f172a !important");
      expect(darkHtml).toContain("#f1f5f9 !important");

      // 5. Caché de Preview
      const cacheManager = createPreviewCacheManager(tempDir);
      const dataHash = createPreviewDataHash(fixture.dataContent);

      expect(cacheManager.isCacheValid(fixture.templateName, { theme: "light", dataHash })).toBe(
        false,
      );

      await cacheManager.saveToCache(fixture.templateName, lightHtml, {
        theme: "light",
        dataHash,
      });

      expect(cacheManager.isCacheValid(fixture.templateName, { theme: "light", dataHash })).toBe(
        true,
      );
      expect(cacheManager.readFromCache(fixture.templateName)).toBe(lightHtml);

      expect(cacheManager.isCacheValid(fixture.templateName, { theme: "dark", dataHash })).toBe(
        false,
      );

      const modifiedDataHash = createPreviewDataHash({
        ...fixture.dataContent,
        customer_name: "Ana Martínez",
      });
      expect(
        cacheManager.isCacheValid(fixture.templateName, {
          theme: "light",
          dataHash: modifiedDataHash,
        }),
      ).toBe(false);

      // 6. Exportación HTML
      const screenshotHtml = compileHtmlWithData(finalHtmlFile, fixture.dataContent);
      expect(screenshotHtml).toContain("Carlos Gómez");
      expect(screenshotHtml).toContain("ORD-2026-987");

      let copyHtmlMiddleware: ((...args: unknown[]) => unknown) | undefined;
      const fakeServer = {
        middlewares: {
          use: (fn: (...args: unknown[]) => unknown) => {
            copyHtmlMiddleware = fn;
          },
        },
      };
      setupCopyHtmlApi(fakeServer, tempDir);
      expect(copyHtmlMiddleware).toBeDefined();

      const apiResponseRead = await simulateRequest(copyHtmlMiddleware!, {
        method: "POST",
        url: `/api/copy-html?template=${fixture.templateName}`,
        body: { build: false },
      });
      expect(apiResponseRead.status).toBe(200);
      expect(apiResponseRead.json.success).toBe(true);
      expect(apiResponseRead.json.built).toBe(false);
      expect(apiResponseRead.json.html).toContain("{{ customer_name }}");

      const apiResponseBuild = await simulateRequest(copyHtmlMiddleware!, {
        method: "POST",
        url: `/api/copy-html?template=${fixture.templateName}`,
        body: { build: true },
      });
      expect(apiResponseBuild.status).toBe(200);
      expect(apiResponseBuild.json.success).toBe(true);
      expect(apiResponseBuild.json.built).toBe(true);
      expect(apiResponseBuild.json.html).toContain("{{ customer_name }}");

      const { fakeDocument, fakeUrlApi, FakeBlob } = createFakeDownloadEnvironment();
      const downloadResult = downloadHtml({
        templateName: fixture.templateName,
        html: builtHtml,
        document: fakeDocument,
        urlApi: fakeUrlApi,
        Blob: FakeBlob,
      });
      expect(downloadResult.ok).toBe(true);
      if (!downloadResult.ok) throw new Error("download failed");
      expect(downloadResult.filename).toBe("receipt.html");
    });
  });

  describe("Casos borde y seguridad de API", () => {
    test("POST /api/copy-html rechaza template inexistente con 404 en build: false", async () => {
      let copyHtmlMiddleware: ((...args: unknown[]) => unknown) | undefined;
      const fakeServer = {
        middlewares: {
          use: (fn: (...args: unknown[]) => unknown) => {
            copyHtmlMiddleware = fn;
          },
        },
      };
      setupCopyHtmlApi(fakeServer, tempDir);

      const response = await simulateRequest(copyHtmlMiddleware!, {
        method: "POST",
        url: "/api/copy-html?template=non-existent",
        body: { build: false },
      });

      expect(response.status).toBe(404);
      expect(response.json.success).toBe(false);
      expect(response.json.error).toContain("not found");
    });

    test("POST /api/copy-html rechaza nombres inseguros con 400", async () => {
      let copyHtmlMiddleware: ((...args: unknown[]) => unknown) | undefined;
      const fakeServer = {
        middlewares: {
          use: (fn: (...args: unknown[]) => unknown) => {
            copyHtmlMiddleware = fn;
          },
        },
      };
      setupCopyHtmlApi(fakeServer, tempDir);

      const response = await simulateRequest(copyHtmlMiddleware!, {
        method: "POST",
        url: "/api/copy-html?template=../secret",
        body: { build: false },
      });

      expect(response.status).toBe(400);
      expect(response.json.success).toBe(false);
      expect(response.json.error).toContain("Invalid template name");
    });

    test("POST /api/copy-html rechaza método GET con 405", async () => {
      let copyHtmlMiddleware: ((...args: unknown[]) => unknown) | undefined;
      const fakeServer = {
        middlewares: {
          use: (fn: (...args: unknown[]) => unknown) => {
            copyHtmlMiddleware = fn;
          },
        },
      };
      setupCopyHtmlApi(fakeServer, tempDir);

      const response = await simulateRequest(copyHtmlMiddleware!, {
        method: "GET",
        url: "/api/copy-html?template=receipt",
      });

      expect(response.status).toBe(405);
      expect(response.json.success).toBe(false);
    });
  });
});
