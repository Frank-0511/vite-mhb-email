import fs from "fs-extra";
import { resolve } from "node:path";
import { compileTemplate } from "./compile.js";

/**
 * Maneja la ruta /api/render para POST
 */
export function setupRenderApi(server, rootDir) {
  server.middlewares.use(async (req, res, next) => {
    if (!req.url?.startsWith("/api/render")) {
      return next();
    }

    const url = new URL(req.url, `http://${req.headers.host}`);
    const templateName = url.searchParams.get("template");

    if (req.method === "POST" && templateName) {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });
      req.on("end", async () => {
        try {
          const data = JSON.parse(body);
          const filePath = resolve(rootDir, "src/templates", templateName, "index.html");
          if (!fs.existsSync(filePath)) {
            res.statusCode = 404;
            return res.end("Template not found");
          }
          const finalHtml = await compileTemplate(filePath, data, rootDir);
          res.setHeader("Content-Type", "text/html");
          res.end(finalHtml);
        } catch (err) {
          console.error("[maizzle] API Render Error:", err.message);
          res.statusCode = 500;
          res.end(err.message);
        }
      });
      return;
    }

    return next();
  });
}
