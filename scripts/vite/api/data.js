import fs from "fs-extra";
import { isValidTemplateName, isPathInside } from "../../shared/path-safety.js";
import { getProjectPaths } from "../../shared/paths.js";
import { sendJson, sendText, readJsonBody, getRequestUrl } from "./http.js";

/**
 * Maneja las rutas /api/data para GET y POST
 * @param {import("vite").ViteDevServer} server
 * @param {string} rootDir
 */
export function setupDataApi(server, rootDir) {
  const paths = getProjectPaths(rootDir);

  server.middlewares.use(async (req, res, next) => {
    if (!req.url?.startsWith("/api/data")) {
      return next();
    }

    const url = getRequestUrl(req);
    const templateName = url.searchParams.get("template");
    if (!templateName) return next();

    if (!isValidTemplateName(templateName)) {
      return sendText(res, 400, "Invalid template name");
    }

    const dataPath = paths.templateData(templateName);
    if (!isPathInside(paths.templatesRoot, dataPath)) {
      return sendText(res, 400, "Invalid template path");
    }

    if (req.method === "GET") {
      const data = fs.existsSync(dataPath) ? fs.readJsonSync(dataPath) : {};
      return sendJson(res, 200, data);
    }

    if (req.method === "POST") {
      try {
        const newData = await readJsonBody(req);
        fs.writeJsonSync(dataPath, newData, { spaces: 2 });
        return sendJson(res, 200, { success: true });
      } catch (err) {
        console.error("Error saving data.json", err);
        return sendText(res, 400, "Invalid JSON / Error Saving");
      }
    }
  });
}
