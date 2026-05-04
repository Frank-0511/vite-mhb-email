import { createPreviewCacheManager } from "../services/preview-cache.js";

let cacheManager;

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

  server.middlewares.use((req, res, next) => {
    if (!req.url?.startsWith("/api/cache")) {
      return next();
    }

    const url = new URL(req.url, `http://${req.headers.host}`);

    if (req.method === "POST") {
      if (req.url.startsWith("/api/cache/invalidate")) {
        const templateName = url.searchParams.get("template");

        if (templateName) {
          cacheManager.invalidateTemplate(templateName);
          res.setHeader("Content-Type", "application/json");
          res.statusCode = 200;
          return res.end(
            JSON.stringify({ success: true, message: `Invalidated cache for ${templateName}` }),
          );
        } else {
          res.statusCode = 400;
          return res.end(
            JSON.stringify({ success: false, message: "template query param required" }),
          );
        }
      } else if (req.url.startsWith("/api/cache/clean")) {
        cacheManager.invalidateAll();
        res.setHeader("Content-Type", "application/json");
        res.statusCode = 200;
        return res.end(JSON.stringify({ success: true, message: "Cache cleaned" }));
      }
    }

    return next();
  });
}
