import fs from "fs-extra";
import { compileTemplate } from "../services/maizzle-compiler.js";
import { isPathInside } from "../../shared/path-safety.js";
import { getProjectPaths } from "../../shared/paths.js";
import { sendText } from "./http.js";

const TEMPLATE_ROUTE_PATTERN = /^\/templates\/([a-z0-9-]+)\/index\.html$/;

/**
 * Maneja las rutas de templates normales (ej. /templates/welcome/index.html)
 * @param {import("vite").ViteDevServer} server
 * @param {string} rootDir
 */
export function setupTemplateApi(server, rootDir) {
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
    } catch (err) {
      console.error("[maizzle] Error rendering template:", err.message);
      next(err);
    }
  });
}
