/**
 * @fileoverview API de caché de preview para Vite (/api/cache/*).
 */

import type { ViteDevServer } from "vite";
import { createPreviewCacheManager, type PreviewCacheManager } from "../services/cache/index.ts";
import { getRequestUrl, sendJson } from "./http.ts";

let cacheManager: PreviewCacheManager | undefined;

/**
 * Maneja endpoints de cache:
 * - POST /api/cache/invalidate?template=name
 * - POST /api/cache/clean
 *
 * @param server Servidor de desarrollo Vite.
 * @param rootDir Directorio raíz del proyecto.
 */
export function setupCacheApi(server: ViteDevServer, rootDir: string): void {
  // Inicializar cache manager solo una vez
  const manager = cacheManager ?? (cacheManager = createPreviewCacheManager(rootDir));

  server.middlewares.use(async (req, res, next) => {
    if (!req.url?.startsWith("/api/cache")) {
      return next();
    }

    const url = getRequestUrl(req);

    if (req.method === "POST") {
      if (req.url.startsWith("/api/cache/invalidate")) {
        const templateName = url.searchParams.get("template");

        if (!templateName) {
          return sendJson(res, 400, { success: false, message: "template query param required" });
        }

        try {
          await manager.invalidateTemplate(templateName);
          return sendJson(res, 200, {
            success: true,
            message: `Invalidated cache for ${templateName}`,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : "unknown error";
          return sendJson(res, 500, {
            success: false,
            message: `failed to invalidate cache for ${templateName}: ${message}`,
          });
        }
      } else if (req.url.startsWith("/api/cache/clean")) {
        try {
          await manager.invalidateAll();
          return sendJson(res, 200, { success: true, message: "Cache cleaned" });
        } catch (error) {
          const message = error instanceof Error ? error.message : "unknown error";
          return sendJson(res, 500, {
            success: false,
            message: `failed to clean cache: ${message}`,
          });
        }
      }
    }

    return next();
  });
}
