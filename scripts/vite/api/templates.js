import fs from "fs-extra";
import { relative, resolve, sep } from "node:path";
import { compileTemplate } from "../services/maizzle-compiler.js";

const TEMPLATE_ROUTE_PATTERN = /^\/templates\/([a-z0-9-]+)\/index\.html$/;

/**
 * Verifica que una ruta candidata permanezca dentro de la ruta base.
 *
 * @param {string} basePath
 * @param {string} candidatePath
 * @returns {boolean}
 */
function isPathInside(basePath, candidatePath) {
  const relPath = relative(basePath, candidatePath);
  return relPath !== "" && !relPath.startsWith(`..${sep}`) && relPath !== "..";
}

/**
 * Maneja las rutas de templates normales (ej. /templates/welcome/index.html)
 */
export function setupTemplateApi(server, rootDir) {
  server.middlewares.use(async (req, res, next) => {
    const reqPath = req.url?.split("?")[0] || "";
    const routeMatch = reqPath.match(TEMPLATE_ROUTE_PATTERN);
    if (!routeMatch) {
      return next();
    }

    const templateName = routeMatch[1];
    const templatesRoot = resolve(rootDir, "src/emails/templates");
    const filePath = resolve(templatesRoot, templateName, "index.html");

    if (!isPathInside(templatesRoot, filePath)) {
      res.statusCode = 400;
      return res.end("Invalid template path");
    }

    if (!fs.existsSync(filePath)) return next();

    try {
      const templateDir = filePath.replace("/index.html", "");
      const dataPath = resolve(templateDir, "data.json");
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
