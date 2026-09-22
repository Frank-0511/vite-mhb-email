/**
 * @fileoverview Servidor de rutas de templates estáticas (/templates/<template>/index.html).
 */

import fs from "fs-extra";
import type { ViteDevServer } from "vite";
import { getProjectPaths, isPathInside } from "../../shared/index.ts";
import { compileTemplate } from "../services/render/index.ts";
import { sendText } from "./http.ts";

const TEMPLATE_ROUTE_PATTERN = /^\/templates\/([a-z0-9-]+)\/index\.html$/;

/**
 * Maneja las rutas de templates normales (ej. /templates/welcome/index.html).
 *
 * @param server Servidor de desarrollo Vite.
 * @param rootDir Directorio raíz del proyecto.
 */
export function setupTemplateApi(server: ViteDevServer, rootDir: string): void {
  const paths = getProjectPaths(rootDir);

  server.middlewares.use(async (req, res, next) => {
    const reqPath = req.url?.split("?")[0] || "";
    const routeMatch = reqPath.match(TEMPLATE_ROUTE_PATTERN);
    if (!routeMatch) {
      return next();
    }

    const templateName = routeMatch[1];
    const filePath = paths.templateHtml(templateName);

    if (!isPathInside(paths.templatesRoot, filePath)) {
      return sendText(res, 400, "Invalid template path");
    }

    if (!fs.existsSync(filePath)) return next();

    try {
      const dataPath = paths.templateData(templateName);
      const data = fs.existsSync(dataPath) ? fs.readJsonSync(dataPath) : {};

      const finalHtml = await compileTemplate(filePath, data, rootDir);
      res.setHeader("Content-Type", "text/html");
      res.end(finalHtml);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[maizzle] Error rendering template:", message);
      next(err);
    }
  });
}
