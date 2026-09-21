// @ts-check
/**
 * @fileoverview Suite de integración extremo a extremo para MHB-20.
 *
 * Valida el flujo completo de EmailForge Toolkit:
 *   - Build & Flatten (compilación selectiva, output aplanado en dist/<template>.html).
 *   - Delimitadores (evaluación de [[ ]] por Maizzle y preservación estricta de {{ }} del ESP).
 *   - Gates de calidad (límite de tamaño Gmail 102 KB, reglas de compatibilidad de email, variables ESP).
 *   - Render de Preview & Tema (sustitución Handlebars para preview, transformación light y dark).
 *   - Caché de Preview (ciclo de vida theme + dataHash, hit, miss por tema/datos, detección de staleness).
 *   - Exportación HTML (build selectivo programático, endpoint /api/copy-html, descarga segura con Blob y compilador para screenshots).
 *
 * Cubre escenarios:
 *   1. Transaccional (orden, cliente, importe, exención de enlace de baja por emailType).
 *   2. Marketing (newsletter, artículos, enlace de desuscripción obligatorio).
 *
 * Garantías:
 *   - Aislamiento absoluto en directorios temporales (sin alterar dist/ ni .cache/ del proyecto).
 *   - Cero dependencias de binarios PNG / Chrome de Puppeteer.
 */

import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { simulateRequest } from "../vite/test-helpers.js";
import Handlebars from "handlebars";
import { compileHtmlWithData } from "../export/compilers.js";
import { validateEspVariables } from "../esp/esp-variables.js";
import { checkHtmlSize } from "../validators/check-html-size.js";
import { validateEmailHtml } from "../validators/validate-email-html.js";
import { setupCopyHtmlApi } from "../vite/api/copy-html.js";
import { applyPreviewTheme } from "../vite/api/render.js";
import {
  createPreviewCacheManager,
  createPreviewDataHash,
} from "../vite/services/preview-cache.js";
import { runSelectiveBuild } from "../vite/services/selective-build.js";
import { downloadHtml } from "../../src/web/features/preview/html-download.js";

const projectRoot = process.cwd();

/**
 * Configura un entorno temporal aislado para tests de integración.
 *
 * @param {string} tempDir
 */
function setupTempProjectEnvironment(tempDir) {
  writeFileSync(
    resolve(tempDir, "maizzle.config.js"),
    `export default {
  build: {
    content: ["src/emails/templates/**/*.html"],
    output: { path: "dist", from: ["src/emails/templates"] },
    summary: false
  },
  expressions: {
    delimiters: ["[[", "]]"],
    unescapedDelimiters: ["[[[", "]]]"],
    missingLocal: "{{ local }}"
  }
};\n`,
  );
}

/**
 * Crea fixture de template transaccional (Recibo de compra).
 *
 * @param {string} tempDir
 * @param {string} templateName
 */
function createTransactionalFixture(tempDir, templateName = "receipt") {
  const templateDir = resolve(tempDir, "src/emails/templates", templateName);
  writeFileSync(
    resolve(tempDir, "maizzle.config.js"),
    `export default {
  build: {
    content: ["src/emails/templates/**/*.html"],
    output: { path: "dist", from: ["src/emails/templates"] },
    summary: false
  },
  expressions: {
    delimiters: ["[[", "]]"],
    unescapedDelimiters: ["[[[", "]]]"],
    missingLocal: "{{ local }}"
  }
};\n`,
  );

  const htmlContent = `---
title: "Recibo de compra"
emailType: "transactional"
---
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>[[ page.title ]]</title>
  <style>
    .order-summary { padding: 16px; background-color: #f8fafc; }
    .order-id { font-weight: bold; color: #1e293b; }
    @media (prefers-color-scheme: dark) {
      .order-summary { background-color: #0f172a !important; }
      .order-id { color: #f1f5f9 !important; }
    }
  </style>
</head>
<body>
  <table width="600" border="0" cellpadding="0" cellspacing="0" class="order-summary">
    <tr>
      <td>
        <h1>Confirmación de orden</h1>
        <p>Hola {{ customer_name }}, recibimos tu orden [[ page.title ]].</p>
        <p class="order-id">Orden: {{ order_number }}</p>
        <p>Total pagado: {{ total_amount }}</p>
        <a href="{{ receipt_url }}">Ver recibo online</a>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const dataContent = {
    customer_name: "Carlos Gómez",
    order_number: "ORD-2026-987",
    total_amount: "$129.99",
    receipt_url: "https://example.com/orders/987",
  };

  const fs = require("fs-extra");
  fs.ensureDirSync(templateDir);
  writeFileSync(resolve(templateDir, "index.html"), htmlContent, "utf-8");
  writeFileSync(resolve(templateDir, "data.json"), JSON.stringify(dataContent, null, 2), "utf-8");

  return { templateName, htmlContent, dataContent };
}

/**
 * Crea fixture de template de marketing (Newsletter mensual).
 *
 * @param {string} tempDir
 * @param {string} templateName
 */
function createMarketingFixture(tempDir, templateName = "newsletter") {
  const templateDir = resolve(tempDir, "src/emails/templates", templateName);
  const htmlContent = `---
title: "Boletín Informativo"
emailType: "marketing"
---
<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>[[ page.title ]]</title>
  <style>
    .news-card { padding: 20px; background-color: #ffffff; }
    @media (prefers-color-scheme: dark) {
      .news-card { background-color: #18181b !important; }
    }
  </style>
</head>
<body>
  <table width="600" border="0" cellpadding="0" cellspacing="0" class="news-card">
    <tr>
      <td>
        <h1>Novedades exclusivas</h1>
        <p>Hola {{ subscriber_name }}, te presentamos la edición mensual de [[ page.title ]].</p>
        <a href="{{ article_url }}">Leer novedades</a>
        <hr>
        <p>
          <a href="{{ preferences_url }}">Modificar preferencias</a> |
          <a href="{{ unsubscribe_url }}">Darse de baja</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const dataContent = {
    subscriber_name: "María Rodríguez",
    article_url: "https://example.com/articles/spring-2026",
    preferences_url: "https://example.com/preferences",
    unsubscribe_url: "https://example.com/unsubscribe?id=123",
  };

  const fs = require("fs-extra");
  fs.ensureDirSync(templateDir);
  writeFileSync(resolve(templateDir, "index.html"), htmlContent, "utf-8");
  writeFileSync(resolve(templateDir, "data.json"), JSON.stringify(dataContent, null, 2), "utf-8");

  return { templateName, htmlContent, dataContent };
}

describe("MHB-20 — Integración Build, Render, Caché y Exportación", () => {
  /** @type {string} */
  let tempDir;
  /** @type {string[]} */
  let rootDistBefore;
  /** @type {any} */
  let consoleLogSpy;
  /** @type {any} */
  let consoleWarnSpy;
  /** @type {any} */
  let consoleInfoSpy;

  beforeEach(() => {
    // Capturar estado de dist/ antes de los tests para certificar aislamiento
    const distPath = resolve(projectRoot, "dist");
    rootDistBefore = existsSync(distPath) ? readdirSync(distPath) : [];

    tempDir = mkdtempSync(resolve(tmpdir(), "mhb20-integration-"));
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

    // Aserción estricta de no-contaminación del workspace del usuario
    const distPath = resolve(projectRoot, "dist");
    const rootDistAfter = existsSync(distPath) ? readdirSync(distPath) : [];
    expect(rootDistAfter).toEqual(rootDistBefore);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // ESCENARIO 1: TRANSACCIONAL
  // ───────────────────────────────────────────────────────────────────────────
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
      // Flatten: no debe quedar directorio anidado en dist/
      expect(existsSync(resolve(tempDist, fixture.templateName))).toBe(false);

      const builtHtml = readFileSync(finalHtmlFile, "utf-8");

      // 2. Delimitadores en Build
      // [[ page.title ]] debe ser evaluado por Maizzle
      expect(builtHtml).toContain("Recibo de compra");
      expect(builtHtml).not.toContain("[[");
      expect(builtHtml).not.toContain("]]");

      // Variables ESP {{ }} deben preservarse intactas en el HTML final compilado
      expect(builtHtml).toContain("{{ customer_name }}");
      expect(builtHtml).toContain("{{ order_number }}");
      expect(builtHtml).toContain("{{ total_amount }}");
      expect(builtHtml).toContain("{{ receipt_url }}");

      // 3. Gates de calidad
      // Gate de tamaño Gmail (< 102 KB)
      const sizeWarning = checkHtmlSize(tempDist);
      expect(sizeWarning).toBe(false);

      // Gate de compatibilidad de email (0 errores)
      const compatibility = validateEmailHtml(tempDist, tempDir);
      expect(compatibility.errors).toBe(0);

      // Gate de variables ESP
      const espValidation = validateEspVariables({
        source: fixture.htmlContent,
        data: fixture.dataContent,
      });
      expect(espValidation.missing).toHaveLength(0);

      // 4. Render de Preview y Temas (Handlebars + Theme Applier)
      const templateFn = Handlebars.compile(builtHtml);
      const previewHtmlRaw = templateFn(fixture.dataContent);

      // En preview las variables ESP se sustituyen con los datos de prueba
      expect(previewHtmlRaw).toContain("Carlos Gómez");
      expect(previewHtmlRaw).toContain("ORD-2026-987");
      expect(previewHtmlRaw).toContain("$129.99");
      expect(previewHtmlRaw).not.toContain("{{ customer_name }}");

      // Tema Light: remueve media queries prefers-color-scheme: dark
      const lightHtml = applyPreviewTheme(previewHtmlRaw, "light");
      expect(lightHtml).not.toContain("@media (prefers-color-scheme: dark)");

      // Tema Dark: desenvuelve las reglas oscuras para visualización
      const darkHtml = applyPreviewTheme(previewHtmlRaw, "dark");
      expect(darkHtml).toContain("#0f172a !important");
      expect(darkHtml).toContain("#f1f5f9 !important");

      // 5. Caché de Preview (theme + dataHash)
      const cacheManager = createPreviewCacheManager(tempDir);
      const dataHash = createPreviewDataHash(fixture.dataContent);

      // Cache miss inicial
      expect(cacheManager.isCacheValid(fixture.templateName, { theme: "light", dataHash })).toBe(
        false,
      );

      // Guardar en caché
      await cacheManager.saveToCache(fixture.templateName, lightHtml, {
        theme: "light",
        dataHash,
      });

      // Cache hit con idéntico tema y hash de datos
      expect(cacheManager.isCacheValid(fixture.templateName, { theme: "light", dataHash })).toBe(
        true,
      );
      expect(cacheManager.readFromCache(fixture.templateName)).toBe(lightHtml);

      // Cache miss si cambia el tema
      expect(cacheManager.isCacheValid(fixture.templateName, { theme: "dark", dataHash })).toBe(
        false,
      );

      // Cache miss si cambian los datos (nuevo dataHash)
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
      // Exportación programática para screenshots sin binarios de Chrome
      const screenshotHtml = compileHtmlWithData(finalHtmlFile, fixture.dataContent);
      expect(screenshotHtml).toContain("Carlos Gómez");
      expect(screenshotHtml).toContain("ORD-2026-987");

      // Exportación vía API (/api/copy-html)
      /** @type {any} */
      let copyHtmlMiddleware;
      const fakeServer = {
        middlewares: {
          use: (fn) => {
            copyHtmlMiddleware = fn;
          },
        },
      };
      setupCopyHtmlApi(fakeServer, tempDir);
      expect(copyHtmlMiddleware).toBeDefined();

      // Petición a /api/copy-html con build: false (lee HTML ya buildeado de dist/)
      const apiResponseRead = await simulateRequest(copyHtmlMiddleware, {
        method: "POST",
        url: `/api/copy-html?template=${fixture.templateName}`,
        body: { build: false },
      });
      expect(apiResponseRead.status).toBe(200);
      expect(apiResponseRead.json.success).toBe(true);
      expect(apiResponseRead.json.built).toBe(false);
      expect(apiResponseRead.json.html).toContain("{{ customer_name }}");

      // Petición a /api/copy-html con build: true (ejecuta build selectivo)
      const apiResponseBuild = await simulateRequest(copyHtmlMiddleware, {
        method: "POST",
        url: `/api/copy-html?template=${fixture.templateName}`,
        body: { build: true },
      });
      expect(apiResponseBuild.status).toBe(200);
      expect(apiResponseBuild.json.success).toBe(true);
      expect(apiResponseBuild.json.built).toBe(true);
      expect(apiResponseBuild.json.html).toContain("{{ customer_name }}");

      // Descarga de HTML en navegador (empaquetado seguro en Blob)
      const fakeDocument = {
        createElement: () => ({ click: () => {} }),
      };
      const fakeUrlApi = {
        createObjectURL: () => "blob:http://localhost/fake-id",
        revokeObjectURL: () => {},
      };
      const downloadResult = downloadHtml({
        templateName: fixture.templateName,
        html: builtHtml,
        document: fakeDocument,
        urlApi: fakeUrlApi,
        Blob: class FakeBlob {
          constructor(parts) {
            this.content = parts.join("");
          }
        },
      });
      expect(downloadResult.ok).toBe(true);
      if (!downloadResult.ok) throw new Error("download failed");
      expect(downloadResult.filename).toBe("receipt.html");
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // ESCENARIO 2: MARKETING
  // ───────────────────────────────────────────────────────────────────────────
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

      const fakeDocument = { createElement: () => ({ click: () => {} }) };
      const fakeUrlApi = {
        createObjectURL: () => "blob:http://localhost/fake-id",
        revokeObjectURL: () => {},
      };
      const downloadResult = downloadHtml({
        templateName: fixture.templateName,
        html: builtHtml,
        document: fakeDocument,
        urlApi: fakeUrlApi,
        Blob: class FakeBlob {
          constructor(parts) {
            this.content = parts.join("");
          }
        },
      });
      expect(downloadResult.ok).toBe(true);
      if (!downloadResult.ok) throw new Error("download failed");
      expect(downloadResult.filename).toBe("newsletter.html");
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // VALIDACIONES DE ERRORES Y CASOS BORDE
  // ───────────────────────────────────────────────────────────────────────────
  describe("Casos borde y seguridad de API", () => {
    test("POST /api/copy-html rechaza template inexistente con 404 en build: false", async () => {
      /** @type {any} */
      let copyHtmlMiddleware;
      const fakeServer = {
        middlewares: {
          use: (fn) => {
            copyHtmlMiddleware = fn;
          },
        },
      };
      setupCopyHtmlApi(fakeServer, tempDir);

      const response = await simulateRequest(copyHtmlMiddleware, {
        method: "POST",
        url: "/api/copy-html?template=non-existent",
        body: { build: false },
      });

      expect(response.status).toBe(404);
      expect(response.json.success).toBe(false);
      expect(response.json.error).toContain("not found");
    });

    test("POST /api/copy-html rechaza nombres inseguros con 400", async () => {
      /** @type {any} */
      let copyHtmlMiddleware;
      const fakeServer = {
        middlewares: {
          use: (fn) => {
            copyHtmlMiddleware = fn;
          },
        },
      };
      setupCopyHtmlApi(fakeServer, tempDir);

      const response = await simulateRequest(copyHtmlMiddleware, {
        method: "POST",
        url: "/api/copy-html?template=../secret",
        body: { build: false },
      });

      expect(response.status).toBe(400);
      expect(response.json.success).toBe(false);
      expect(response.json.error).toContain("Invalid template name");
    });

    test("POST /api/copy-html rechaza método GET con 405", async () => {
      /** @type {any} */
      let copyHtmlMiddleware;
      const fakeServer = {
        middlewares: {
          use: (fn) => {
            copyHtmlMiddleware = fn;
          },
        },
      };
      setupCopyHtmlApi(fakeServer, tempDir);

      const response = await simulateRequest(copyHtmlMiddleware, {
        method: "GET",
        url: "/api/copy-html?template=receipt",
      });

      expect(response.status).toBe(405);
      expect(response.json.success).toBe(false);
    });
  });
});
