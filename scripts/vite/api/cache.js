import { createPreviewCacheManager } from "../services/preview-cache.js";

let cacheManager;

/**
 * Envia una respuesta JSON con status HTTP explícito.
 *
 * @param {import("node:http").ServerResponse} res
 * @param {number} statusCode
 * @param {Record<string, unknown>} payload
 * @returns {void}
 */
function sendJson(res, statusCode, payload) {
  res.setHeader("Content-Type", "application/json");
  res.statusCode = statusCode;
  res.end(JSON.stringify(payload));
}

/**
 * Maneja endpoints de cache:
 * - POST /api/cache/invalidate?template=name
 * - POST /api/cache/clean
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

    const url = new URL(req.url, `http://${req.headers.host}`);

    if (req.method === "POST") {
      if (req.url.startsWith("/api/cache/invalidate")) {
        const templateName = url.searchParams.get("template");

        if (!templateName) {
          sendJson(res, 400, { success: false, message: "template query param required" });
          return;
        }

        try {
          await cacheManager.invalidateTemplate(templateName);
          sendJson(res, 200, { success: true, message: `Invalidated cache for ${templateName}` });
        } catch (error) {
          const message = error instanceof Error ? error.message : "unknown error";
          sendJson(res, 500, {
            success: false,
            message: `failed to invalidate cache for ${templateName}: ${message}`,
          });
        }
        return;
      } else if (req.url.startsWith("/api/cache/clean")) {
        try {
          await cacheManager.invalidateAll();
          sendJson(res, 200, { success: true, message: "Cache cleaned" });
        } catch (error) {
          const message = error instanceof Error ? error.message : "unknown error";
          sendJson(res, 500, {
            success: false,
            message: `failed to clean cache: ${message}`,
          });
        }
        return;
      }
    }

    return next();
  });
}
