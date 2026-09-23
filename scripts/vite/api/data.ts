/**
 * @fileoverview API para lectura y escritura de data.json de plantillas (/api/data).
 */

import fs from "fs-extra";
import type { ViteDevServer } from "vite";
import { API_ROUTES } from "../../shared/contracts/constants/api-routes.ts";
import { getProjectPaths, isPathInside, isValidTemplateName } from "../../shared/index.ts";
import { asyncHandler, getRequestUrl, readJsonBody, sendJson, sendText } from "./http.ts";

/**
 * Maneja las rutas /api/data para GET y POST.
 *
 * @param server Servidor de desarrollo Vite.
 * @param rootDir Directorio raíz del proyecto.
 */
export function setupDataApi(server: ViteDevServer, rootDir: string): void {
  const paths = getProjectPaths(rootDir);

  server.middlewares.use(
    asyncHandler(async (req, res, next) => {
      if (!req.url?.startsWith(API_ROUTES.DATA)) {
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

      return next();
    }),
  );
}
