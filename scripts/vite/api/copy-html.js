// @ts-check
/**
 * @fileoverview API handler para POST /api/copy-html.
 *
 * Endpoint: POST /api/copy-html?template=<name>
 * Body: { "build": true | false }
 *
 * - build: true  → ejecuta build productivo selectivo (sin mutar maizzle.config.js ni
 *                   escribir en dist/ durante la compilación), devuelve el HTML
 *                   resultante directamente desde memoria.
 * - build: false → lee dist/<template>.html directamente; si no existe, responde 404.
 *
 * Respuesta de éxito:
 *   { success: true, template: string, html: string, built: boolean }
 *
 * Respuesta de error:
 *   { success: false, error: string }
 */

import fs from "fs-extra";
import { resolve } from "node:path";
import { runSelectiveBuild } from "../services/selective-build.js";
import { isValidTemplateName, isPathInside } from "../../shared/path-safety.js";
import { getProjectPaths } from "../../shared/paths.js";
import { sendJson, readJsonBody, getRequestUrl } from "./http.js";

/**
 * Registra el middleware para POST /api/copy-html en el servidor de Vite.
 *
 * @param {import("vite").ViteDevServer} server Instancia del servidor Vite.
 * @param {string} rootDir Directorio raíz del proyecto.
 */
export function setupCopyHtmlApi(server, rootDir) {
  const paths = getProjectPaths(rootDir);

  server.middlewares.use(async (req, res, next) => {
    if (!req.url?.startsWith("/api/copy-html")) {
      return next();
    }

    if (req.method !== "POST") {
      return sendJson(res, 405, { success: false, error: "Method not allowed. Use POST." });
    }

    const url = getRequestUrl(req);
    const templateName = url.searchParams.get("template");

    if (!templateName) {
      return sendJson(res, 400, { success: false, error: "Missing query param: template" });
    }

    if (!isValidTemplateName(templateName)) {
      return sendJson(res, 400, { success: false, error: "Invalid template name" });
    }

    const distPath = resolve(paths.distDir, `${templateName}.html`);
    if (!isPathInside(paths.distDir, distPath)) {
      return sendJson(res, 400, { success: false, error: "Invalid template path" });
    }

    // Parsear el body
    let body;
    try {
      body = await readJsonBody(req);
    } catch {
      return sendJson(res, 400, { success: false, error: "Invalid JSON body" });
    }

    const shouldBuild =
      body !== null &&
      typeof body === "object" &&
      /** @type {Record<string, unknown>} */ (body).build === true;

    // Si se solicita build, ejecutar el pipeline selectivo.
    // runSelectiveBuild devuelve el HTML compilado directamente desde memoria,
    // sin necesidad de leerlo de dist/ nuevamente.
    if (shouldBuild) {
      const result = await runSelectiveBuild(rootDir, templateName);
      if (!result.success) {
        return sendJson(res, 500, {
          success: false,
          error: result.error ?? "Build failed with no details",
        });
      }
      return sendJson(res, 200, {
        success: true,
        template: templateName,
        html: result.html,
        built: true,
      });
    }

    // build: false → leer desde dist/<template>.html
    if (!fs.existsSync(distPath)) {
      return sendJson(res, 404, {
        success: false,
        error: `dist/${templateName}.html not found. Run a build first.`,
      });
    }

    let html;
    try {
      html = await fs.readFile(distPath, "utf-8");
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[copy-html] Error reading dist file:", message);
      return sendJson(res, 500, { success: false, error: "Failed to read built HTML" });
    }

    return sendJson(res, 200, {
      success: true,
      template: templateName,
      html,
      built: false,
    });
  });
}
