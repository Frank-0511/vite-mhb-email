import fs from "fs-extra";
import { resolve } from "node:path";
import { compileTemplate } from "./compile.js";

/**
 * Maneja las rutas de templates normales (ej. /templates/welcome/index.html)
 */
export function setupTemplateApi(server, rootDir) {
  server.middlewares.use(async (req, res, next) => {
    const reqPath = req.url?.split("?")[0] || "";
    if (!reqPath.includes("/templates/") || !reqPath.endsWith(".html")) {
      return next();
    }

    const filePath = resolve(rootDir, "src", reqPath.slice(1));
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
