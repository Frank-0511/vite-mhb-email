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
 * Legacy redirects (301):
 *   /index.html                -> /
 *   /preview.html?...          -> /preview?...
 *   /components-library.html   -> /library
 *
 * Assets, API endpoints, email templates and feature-internal paths are never
 * rewritten.
 *
 * @returns {import('vite').Plugin} Vite plugin
 */
export function createPageResolverPlugin() {
  /**
   * Clean-route -> internal file map.
   * Keys are exact pathnames (no query string, no trailing slash except root).
   * Values are paths relative to the Vite root (`src/web`).
   *
   * @type {Map<string, string>}
   */
  const pageMap = new Map([
    ["/", "/features/home/index.html"],
    ["/preview", "/features/preview/preview.html"],
    ["/library", "/features/library/components-library.html"],
  ]);

  /**
   * Legacy URL -> clean URL redirect map.
   * The redirect preserves the original query string.
   *
   * @type {Map<string, string>}
   */
  const legacyRedirects = new Map([
    ["/index.html", "/"],
    ["/preview.html", "/preview"],
    ["/components-library.html", "/library"],
  ]);

  return {
    name: "page-resolver",
    apply: "serve",

    /**
     * Register route-rewriting middleware directly so it executes before
     * Vite's internal handlers. Using `return () => server.middlewares.use`
     * would push the handler to the end of the middleware chain, after Vite's
     * HTML middleware, which prevents clean-route rewriting from working.
     *
     * @param {import('vite').ViteDevServer} server
     */
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const [pathname, qs] = req.url.split("?");
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

        // 301-redirect legacy .html URLs to their clean equivalents.
        if (legacyRedirects.has(pathname)) {
          const cleanPath = legacyRedirects.get(pathname);
          res.writeHead(301, { Location: cleanPath + query });
          return res.end();
        }

        // Rewrite clean route to its internal feature HTML so Vite resolves it.
        if (pageMap.has(pathname)) {
          req.url = pageMap.get(pathname) + query;
        }

        next();
      });
    },
  };
}
