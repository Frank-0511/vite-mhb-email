/**
 * @fileoverview Handler inyectable para el endpoint de render /api/render.
 * Maneja validación de parámetros, lectura de JSON, validación ESP,
 * caché, compilación de templates Maizzle y respuesta de diagnóstico seguro 422.
 */

import fs from "fs-extra";
import type { IncomingMessage, ServerResponse } from "node:http";
import { collectTemplateSource } from "../../../esp/sources.ts";
import { validateEspVariables } from "../../../esp/validator.ts";
import {
  API_ROUTES,
  HEADER_X_ESP_VALIDATION,
} from "../../../shared/contracts/constants/api-routes.ts";
import { THEME } from "../../../shared/contracts/constants/theme.ts";
import { isTheme } from "../../../shared/contracts/guards/theme.ts";
import type { RenderErrorPayload } from "../../../shared/contracts/types/render-error.ts";
import type { Theme } from "../../../shared/contracts/types/theme.ts";
import { getProjectPaths, isPathInside, isValidTemplateName } from "../../../shared/index.ts";
import { getRequestUrl, readJsonBody, sendJson, sendText } from "../../api/http.ts";
import {
  createPreviewCacheManager,
  createPreviewDataHash,
  type PreviewCacheManager,
} from "../cache/index.ts";
import { compileTemplate as defaultCompileTemplate } from "./maizzle-compiler.ts";
import { normalizeRenderError as defaultNormalizeRenderError } from "./render-error.ts";

export interface RenderCacheAdapter {
  isCacheValid: (templateName: string, meta: { theme: Theme; dataHash: string }) => boolean;
  readFromCache: (templateName: string) => Promise<string | null> | string | null;
  saveToCache: (
    templateName: string,
    html: string,
    meta: { theme: Theme; dataHash: string },
  ) => Promise<void> | void;
}

export interface RenderRequestHandlerOptions {
  rootDir?: string;
  compileTemplate?: (
    filePath: string,
    data: Record<string, unknown>,
    rootDir: string,
  ) => Promise<string>;
  cacheManager?: RenderCacheAdapter | PreviewCacheManager;
  applyPreviewTheme?: (html: string, theme: Theme) => string;
  normalizeError?: (error: unknown, options: { templatesRoot: string }) => RenderErrorPayload;
}

/**
 * Crea un middleware inyectable para manejar peticiones de render.
 *
 * @param options Opciones de configuración e inyección de dependencias.
 * @returns Función middleware de Connect / Vite.
 */
export function createRenderRequestHandler(options: RenderRequestHandlerOptions = {}) {
  const rootDir = options.rootDir || process.cwd();
  const compile = options.compileTemplate || defaultCompileTemplate;
  const cache = options.cacheManager || createPreviewCacheManager(rootDir);
  const themeApplier = options.applyPreviewTheme || ((html: string) => html);
  const normalizer = options.normalizeError || defaultNormalizeRenderError;
  const paths = getProjectPaths(rootDir);

  return async function handleRenderRequest(
    req: IncomingMessage,
    res: ServerResponse,
    next: (err?: unknown) => void,
  ): Promise<void> {
    if (!req.url?.startsWith(API_ROUTES.RENDER)) {
      return next();
    }

    const url = getRequestUrl(req);
    const templateName = url.searchParams.get("template");
    const rawTheme = url.searchParams.get("theme");
    const theme: Theme = isTheme(rawTheme) ? rawTheme : THEME.LIGHT;

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

    let data: Record<string, unknown>;
    try {
      data = (await readJsonBody(req)) as Record<string, unknown>;
    } catch {
      return sendText(res, 400, "Invalid JSON body");
    }

    if (!fs.existsSync(filePath)) {
      return sendText(res, 404, "Template not found");
    }

    try {
      // Validar variables ESP antes de renderizar (MHB-06).
      // Solo log: no bloquea el preview, no cambia el HTML y no expone rutas.
      let espValidation: { missing: string[]; unused: string[] } = { missing: [], unused: [] };
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

      res.setHeader(HEADER_X_ESP_VALIDATION, JSON.stringify(espValidation));
      let finalHtml: string | null = null;

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
      res.end(finalHtml ?? "");
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
