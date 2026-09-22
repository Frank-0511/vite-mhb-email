/**
 * @fileoverview Test de integración e2e: Escenario Marketing (MHB-20).
 */

import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import Handlebars from "handlebars";
import { compileHtmlWithData } from "../export/compilers.js";
import { validateEspVariables } from "../esp/esp-variables.ts";
import { checkHtmlSize } from "../validators/check-html-size.ts";
import { validateEmailHtml } from "../validators/validate-email-html.ts";
import { applyPreviewTheme } from "../vite/api/render.js";
import {
  createPreviewCacheManager,
  createPreviewDataHash,
} from "../vite/services/preview-cache.js";
import { runSelectiveBuild } from "../vite/services/selective-build.js";
import { downloadHtml } from "../../src/web/features/preview/modules/copy-html/html-download.js";
import {
  createFakeDownloadEnvironment,
  createMarketingFixture,
  setupTempProjectEnvironment,
} from "./build-render-cache-export.test-fixtures.ts";

const projectRoot = process.cwd();

describe("MHB-20 — Integración Build, Render, Caché y Exportación (Marketing)", () => {
  let tempDir: string;
  let rootDistBefore: string[];
  let consoleLogSpy: ReturnType<typeof spyOn> | null = null;
  let consoleWarnSpy: ReturnType<typeof spyOn> | null = null;
  let consoleInfoSpy: ReturnType<typeof spyOn> | null = null;

  beforeEach(() => {
    const distPath = resolve(projectRoot, "dist");
    rootDistBefore = existsSync(distPath) ? readdirSync(distPath) : [];

    tempDir = mkdtempSync(resolve(tmpdir(), "mhb20-marketing-"));
    setupTempProjectEnvironment(tempDir);

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

  describe("Escenario Marketing (Newsletter)", () => {
    test("flujo completo: build flatten, enlace unsubscribe, gates, preview y exportación", async () => {
      const fixture = createMarketingFixture(tempDir, "newsletter");
      const tempDist = resolve(tempDir, "dist");

      // 1. Build y Flatten
      const buildResult = await runSelectiveBuild(tempDir, fixture.templateName);
      expect(buildResult.success).toBe(true);

      const finalHtmlFile = resolve(tempDist, `${fixture.templateName}.html`);
      expect(existsSync(finalHtmlFile)).toBe(true);
      expect(existsSync(resolve(tempDist, fixture.templateName))).toBe(false);

      const builtHtml = readFileSync(finalHtmlFile, "utf-8");

      // 2. Delimitadores
      expect(builtHtml).toContain("Boletín Informativo");
      expect(builtHtml).not.toContain("[[");
      expect(builtHtml).not.toContain("]]");

      // Variables ESP preservadas
      expect(builtHtml).toContain("{{ subscriber_name }}");
      expect(builtHtml).toContain("{{ article_url }}");
      expect(builtHtml).toContain("{{ preferences_url }}");
      expect(builtHtml).toContain("{{ unsubscribe_url }}");

      // 3. Gates
      expect(checkHtmlSize(tempDist)).toBe(false);

      // Compatibilidad: la regla de unsubscribe-link debe pasar con éxito
      const compatibility = validateEmailHtml(tempDist, tempDir);
      expect(compatibility.errors).toBe(0);

      const espValidation = validateEspVariables({
        source: fixture.htmlContent,
        data: fixture.dataContent,
      });
      expect(espValidation.missing).toHaveLength(0);

      // 4. Render Preview & Tema
      const templateFn = Handlebars.compile(builtHtml);
      const previewHtmlRaw = templateFn(fixture.dataContent);
      expect(previewHtmlRaw).toContain("María Rodríguez");
      expect(previewHtmlRaw).not.toContain("{{ subscriber_name }}");

      const lightHtml = applyPreviewTheme(previewHtmlRaw, "light");
      expect(lightHtml).not.toContain("@media (prefers-color-scheme: dark)");

      const darkHtml = applyPreviewTheme(previewHtmlRaw, "dark");
      expect(darkHtml).toContain("#18181b !important");

      // 5. Caché
      const cacheManager = createPreviewCacheManager(tempDir);
      const dataHash = createPreviewDataHash(fixture.dataContent);
      await cacheManager.saveToCache(fixture.templateName, lightHtml, {
        theme: "light",
        dataHash,
      });
      expect(cacheManager.isCacheValid(fixture.templateName, { theme: "light", dataHash })).toBe(
        true,
      );

      // 6. Exportación
      const screenshotHtml = compileHtmlWithData(finalHtmlFile, fixture.dataContent);
      expect(screenshotHtml).toContain("María Rodríguez");

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
      expect(downloadResult.filename).toBe("newsletter.html");
    });
  });
});
