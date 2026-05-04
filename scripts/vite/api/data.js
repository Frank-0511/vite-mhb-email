import fs from "fs-extra";
import { relative, resolve, sep } from "node:path";

const TEMPLATE_NAME_PATTERN = /^[a-z0-9-]+$/;

/**
 * Valida nombres de template permitidos para evitar path traversal.
 *
 * @param {string} templateName
 * @returns {boolean}
 */
function isValidTemplateName(templateName) {
  return TEMPLATE_NAME_PATTERN.test(templateName);
}

/**
 * Verifica que una ruta permanezca dentro de una carpeta base.
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
 * Maneja las rutas /api/data para GET y POST
 */
export function setupDataApi(server, rootDir) {
  server.middlewares.use((req, res, next) => {
    if (!req.url?.startsWith("/api/data")) {
      return next();
    }

    const url = new URL(req.url, `http://${req.headers.host}`);
    const templateName = url.searchParams.get("template");
    if (!templateName) return next();

    if (!isValidTemplateName(templateName)) {
      res.statusCode = 400;
      return res.end("Invalid template name");
    }

    const templatesRoot = resolve(rootDir, "src/emails/templates");
    const dataPath = resolve(templatesRoot, templateName, "data.json");
    if (!isPathInside(templatesRoot, dataPath)) {
      res.statusCode = 400;
      return res.end("Invalid template path");
    }

    if (req.method === "GET") {
      const data = fs.existsSync(dataPath) ? fs.readJsonSync(dataPath) : {};
      res.setHeader("Content-Type", "application/json");
      return res.end(JSON.stringify(data));
    }

    if (req.method === "POST") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });
      req.on("end", () => {
        try {
          const newData = JSON.parse(body);
          fs.writeJsonSync(dataPath, newData, { spaces: 2 });
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ success: true }));
        } catch (err) {
          console.error("Error saving data.json", err);
          res.statusCode = 400;
          res.end("Invalid JSON / Error Saving");
        }
      });
      return;
    }
  });
}
