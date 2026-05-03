import fs from "fs-extra";
import { resolve } from "node:path";

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

    const dataPath = resolve(rootDir, "src/emails/templates", templateName, "data.json");

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
