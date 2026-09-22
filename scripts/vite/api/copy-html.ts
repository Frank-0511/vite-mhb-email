/**
 * @fileoverview API handler para POST /api/copy-html.
 *
 * Endpoint: POST /api/copy-html?template=<name>
 * Body: { "build": true | false }
 */

import fs from "fs-extra";
import { resolve } from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { Connect, ViteDevServer } from "vite";
import { getProjectPaths, isPathInside, isValidTemplateName } from "../../shared/index.ts";
import { runSelectiveBuild } from "../services/render/index.ts";
import { getRequestUrl, readJsonBody, sendJson } from "./http.ts";

/**
 * Registra el middleware para POST /api/copy-html en el servidor de Vite.
 *
 * @param server Instancia del servidor Vite.
 * @param rootDir Directorio raíz del proyecto.
 */
export function setupCopyHtmlApi(
  server: ViteDevServer | { middlewares: { use: (fn: Connect.NextHandleFunction) => void } },
  rootDir: string,
): void {
  const paths = getProjectPaths(rootDir);

  server.middlewares.use(
    async (req: IncomingMessage, res: ServerResponse, next: (err?: unknown) => void) => {
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
      let body: unknown;
      try {
        body = await readJsonBody(req);
      } catch {
        return sendJson(res, 400, { success: false, error: "Invalid JSON body" });
      }

      const shouldBuild =
        body !== null &&
        typeof body === "object" &&
        (body as Record<string, unknown>).build === true;

      // Si se solicita build, ejecutar el pipeline selectivo.
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
          validation: result.validation,
        });
      }

      // build: false → leer desde dist/<template>.html
      if (!fs.existsSync(distPath)) {
        return sendJson(res, 404, {
          success: false,
          error: `dist/${templateName}.html not found. Run a build first.`,
        });
      }

      let html: string;
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
    },
  );
}
