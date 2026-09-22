/**
 * @fileoverview Plugin de resolución de rutas amigables y redirecciones en Vite.
 */

import type { Plugin, ViteDevServer } from "vite";

/**
 * Create page resolver plugin for Vite.
 *
 * Maps clean public URLs to internal feature HTML paths so Vite can serve and
 * process them correctly. The middleware is registered directly inside
 * `configureServer` (no `return () =>` wrapper) so it runs before Vite's own
 * internal middleware stack and can rewrite HTML requests reliably.
 *
 * Clean routes:
 *   /         -> features/home/index.html
 *   /preview  -> features/preview/preview.html
 *   /library  -> features/library/components-library.html
 *
 * Legacy redirects (302 en desarrollo):
 *   /index.html                -> /
 *   /preview.html?...          -> /preview?...
 *   /components-library.html   -> /library
 *
 * @returns Vite plugin
 */
export function createPageResolverPlugin(): Plugin {
  /**
   * Clean-route -> internal file map.
   * Keys are exact pathnames (no query string, no trailing slash except root).
   * Values are paths relative to the Vite root (`src/web`).
   */
  const pageMap = new Map<string, string>([
    ["/", "/features/home/index.html"],
    ["/preview", "/features/preview/preview.html"],
    ["/library", "/features/library/components-library.html"],
  ]);

  /**
   * Legacy URL -> clean URL redirect map.
   * The redirect preserves the original query string.
   */
  const legacyRedirects = new Map<string, string>([
    ["/index.html", "/"],
    ["/preview.html", "/preview"],
    ["/components-library.html", "/library"],
  ]);

  return {
    name: "page-resolver",
    apply: "serve",

    configureServer(server: ViteDevServer) {
      server.middlewares.use((req, res, next) => {
        const [pathname, qs] = (req.url || "").split("?");
        const query = qs ? `?${qs}` : "";

        // Skip assets, API endpoints, template HTML and already-resolved paths.
        if (
          pathname.startsWith("/features/") ||
          pathname.startsWith("/api/") ||
          pathname.startsWith("/templates/") ||
          pathname.startsWith("/shared/") ||
          pathname.startsWith("/@") ||
          pathname.startsWith("/node_modules/")
        ) {
          return next();
        }

        // 302-redirect legacy .html URLs to their clean equivalents in dev.
        if (legacyRedirects.has(pathname)) {
          const cleanPath = legacyRedirects.get(pathname)!;
          res.writeHead(302, { Location: cleanPath + query });
          return res.end();
        }

        // Rewrite clean route to its internal feature HTML so Vite resolves it.
        if (pageMap.has(pathname)) {
          req.url = pageMap.get(pathname)! + query;
        }

        next();
      });
    },
  };
}
