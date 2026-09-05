// @ts-check
/**
 * @fileoverview Handler inyectable para el endpoint de render /api/render.
 * Maneja validación de parámetros, lectura de JSON, validación ESP,
 * caché, compilación de templates Maizzle y respuesta de diagnóstico seguro 422.
 */

import fs from "fs-extra";
import { compileTemplate as defaultCompileTemplate } from "./maizzle-compiler.js";
import { createPreviewCacheManager, createPreviewDataHash } from "./preview-cache.js";
import { isPathInside, isValidTemplateName } from "../../shared/path-safety.js";
import { getProjectPaths } from "../../shared/paths.js";
import { getRequestUrl, readJsonBody, sendJson, sendText } from "../api/http.js";
import { validateEspVariables } from "../../email/esp-variables.js";
import { collectTemplateSource } from "../../email/esp-sources.js";
import { normalizeRenderError as defaultNormalizeRenderError } from "./render-error.js";

/**
 * @typedef {Object} RenderRequestHandlerOptions
 * @property {string} [rootDir] - Directorio raíz del proyecto.
 * @property {(filePath: string, data: Record<string, unknown>, rootDir: string) => Promise<string>} [compileTemplate] - Función compiladora de templates.
 * @property {{
 *   isCacheValid: (templateName: string, meta: { theme: string, dataHash: string }) => boolean,
 *   readFromCache: (templateName: string) => Promise<string>,
 *   saveToCache: (templateName: string, html: string, meta: { theme: string, dataHash: string }) => Promise<void>
 * }} [cacheManager] - Administrador de caché de preview.
 * @property {(html: string, theme: string) => string} [applyPreviewTheme] - Transformador de tema.
 * @property {(error: unknown, options: { templatesRoot: string }) => import("./render-error.js").NormalizedRenderError} [normalizeError] - Normalizador de errores.
 */

/**
 * Crea un middleware inyectable para manejar peticiones de render.
 *
 * @param {RenderRequestHandlerOptions} [options]
 * @returns {(req: import("http").IncomingMessage, res: import("http").ServerResponse, next: () => void) => Promise<void>}
 */
export function createRenderRequestHandler(options = {}) {
  const rootDir = options.rootDir || process.cwd();
  const compile = options.compileTemplate || defaultCompileTemplate;
  const cache = options.cacheManager || createPreviewCacheManager(rootDir);
  const themeApplier = options.applyPreviewTheme || ((html) => html);
  const normalizer = options.normalizeError || defaultNormalizeRenderError;
  const paths = getProjectPaths(rootDir);

  return async function handleRenderRequest(req, res, next) {
    if (!req.url?.startsWith("/api/render")) {
      return next();
    }

    const url = getRequestUrl(req);
    const templateName = url.searchParams.get("template");
    const theme = url.searchParams.get("theme") === "dark" ? "dark" : "light";

    if (req.method !== "POST" || !templateName) {
      return next();
    }

    if (!isValidTemplateName(templateName)) {
      return sendText(res, 400, "Invalid template name");
    }

    const filePath = paths.templateHtml(templateName);
    if (!isPathInside(paths.templatesRoot, filePath)) {
      return sendText(res, 400, "Invalid template path");
    }

    /** @type {Record<string, unknown>} */
    let data;
    try {
      data = /** @type {Record<string, unknown>} */ (await readJsonBody(req));
    } catch {
      return sendText(res, 400, "Invalid JSON body");
    }

    if (!fs.existsSync(filePath)) {
      return sendText(res, 404, "Template not found");
    }

    try {
      // Validar variables ESP antes de renderizar (MHB-06).
      // Solo log: no bloquea el preview, no cambia el HTML y no expone rutas.
      let espValidation = { missing: [], unused: [] };
      try {
        const source = collectTemplateSource(rootDir, templateName);
        espValidation = validateEspVariables({ source, data });
        const { missing, unused } = espValidation;
        if (missing.length > 0) {
          console.warn(
            `[maizzle] ESP variables faltantes en ${templateName}: ${missing.join(", ")}`,
          );
        }
        if (unused.length > 0) {
          console.info(
            `[maizzle] Claves de data.json sin uso en ${templateName}: ${unused.join(", ")}`,
          );
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn(`[maizzle] No se pudo validar variables ESP de ${templateName}: ${message}`);
      }

      res.setHeader("X-ESP-Validation", JSON.stringify(espValidation));
      let finalHtml;

      const dataHash = createPreviewDataHash(data);

      if (cache.isCacheValid(templateName, { theme, dataHash })) {
        finalHtml = await cache.readFromCache(templateName);
        console.log(`[maizzle] Using cached render for ${templateName} (${theme})`);
      } else {
        const compiledHtml = await compile(filePath, data, rootDir);
        finalHtml = themeApplier(compiledHtml, theme);
        await cache.saveToCache(templateName, finalHtml, { theme, dataHash });
        console.log(`[maizzle] Compiled and cached ${templateName} (${theme})`);
      }

      res.setHeader("Content-Type", "text/html");
      res.end(finalHtml);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[maizzle] API Render Error:", message);

      try {
        const normalized = normalizer(err, { templatesRoot: paths.templatesRoot });
        sendJson(res, 422, { success: false, error: normalized });
      } catch (fallbackErr) {
        const fallbackMsg =
          fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr);
        console.error("[maizzle] API Render Error fallback failed:", fallbackMsg);
        sendText(res, 500, "Internal server error");
      }
    }
  };
}
