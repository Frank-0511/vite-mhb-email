import { createPreviewCacheManager } from "../services/preview-cache.js";
import { sendJson, getRequestUrl } from "./http.js";

let cacheManager;

/**
 * Maneja endpoints de cache:
 * - POST /api/cache/invalidate?template=name
 * - POST /api/cache/clean
 * @param {import("vite").ViteDevServer} server
 * @param {string} rootDir
 */
export function setupCacheApi(server, rootDir) {
  // Inicializar cache manager solo una vez
  if (!cacheManager) {
    cacheManager = createPreviewCacheManager(rootDir);
  }

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
          await cacheManager.invalidateTemplate(templateName);
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
          await cacheManager.invalidateAll();
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
