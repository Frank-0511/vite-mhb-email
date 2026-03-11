import { render } from "@maizzle/framework";
import fs from "fs-extra";
import Handlebars from "handlebars";
import { resolve } from "path";

// Exportamos el helper por si otro script lo necesita, aunque principalmente se usa aquí
export async function compileTemplate(filePath, data, rootDir) {
  const html = fs.readFileSync(filePath, "utf8");
  const { html: maizzleHtml } = await render(html, {
    useTransformers: false,
    components: {
      folders: [resolve(rootDir, "src/layouts"), resolve(rootDir, "src/partials")],
      tagPrefix: "x-",
    },
    expressions: {
      delimiters: ["[[", "]]"],
      unescapedDelimiters: ["[[[", "]]]"],
    },
  });
  return Handlebars.compile(maizzleHtml)(data);
}

export const maizzlePlugin = (rootDir) => ({
  name: "vite-plugin-maizzle",
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      // 1. JSON Data API (GET / POST)
      if (req.url?.startsWith("/api/data")) {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const templateName = url.searchParams.get("template");
        if (!templateName) return next();

        const dataPath = resolve(rootDir, "src/templates", templateName, "data.json");

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
      }

      // 2. Render API (POST) - Renders with provided ephemeral data
      if (req.url?.startsWith("/api/render")) {
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
      }

      // 3. Normal template request (from browser / iframe)
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
  },
});
