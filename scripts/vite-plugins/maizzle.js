import { render } from "@maizzle/framework";
import fs from "fs-extra";
import Handlebars from "handlebars";
import { resolve } from "path";

// Exportamos el helper por si otro script lo necesita, aunque principalmente se usa aquí
export async function compileTemplate(filePath, data, rootDir, isPreview = true) {
  let html = fs.readFileSync(filePath, "utf8");

  // En preview (Vite): asegurar que se usa tailwind.config.js (darkMode: "class")
  // En build (Maizzle): reemplazar con tailwind.email.config.js (darkMode: "media")
  if (!isPreview) {
    // Reemplazar src/css/tailwind.css con src/css/tailwind.email.css para el build
    html = html.replace(
      /@import "src\/css\/tailwind\.css"/g,
      '@import "src/css/tailwind.email.css"',
    );
  }
  // En preview, mantenemos src/css/tailwind.css que usa tailwind.config.js

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

      // 3. Component Library API
      if (req.url?.startsWith("/api/components")) {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const componentName = url.pathname.split("/")[3];

        // GET /api/components - List all available components
        if (req.method === "GET" && !componentName) {
          try {
            const componentsDir = resolve(rootDir, "src/components");
            if (!fs.existsSync(componentsDir)) {
              res.setHeader("Content-Type", "application/json");
              return res.end(JSON.stringify([]));
            }

            const dirs = fs.readdirSync(componentsDir);
            const components = [];

            for (const dir of dirs) {
              const schemaPath = resolve(componentsDir, dir, "schema.json");
              if (fs.existsSync(schemaPath)) {
                const schema = fs.readJsonSync(schemaPath);
                components.push({
                  id: dir, // Directory name as unique ID
                  ...schema,
                  // Keep schema's name as display name, but ensure we have id
                  name: schema.name || dir,
                });
              }
            }

            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(components));
          } catch (err) {
            console.error("[components] List Error:", err);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        // GET /api/components/:name - Get component schema
        if (req.method === "GET" && componentName) {
          try {
            const componentDir = resolve(rootDir, "src/components", componentName);
            const schemaPath = resolve(componentDir, "schema.json");
            if (!fs.existsSync(schemaPath)) {
              res.statusCode = 404;
              res.setHeader("Content-Type", "application/json");
              return res.end(JSON.stringify({ error: "Component not found" }));
            }

            const schema = fs.readJsonSync(schemaPath);

            // Add available variants from directory
            const availableVariants = [];
            if (fs.existsSync(componentDir)) {
              const files = fs.readdirSync(componentDir);
              for (const file of files) {
                if (file.endsWith(".html")) {
                  const variantId = file.replace(".html", "");
                  availableVariants.push(variantId);
                }
              }
            }

            res.setHeader("Content-Type", "application/json");
            res.end(
              JSON.stringify({
                id: componentName,
                ...schema,
                _availableVariants: availableVariants,
              }),
            );
          } catch (err) {
            console.error("[components] Get Error:", err);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        // POST /api/components/:name/render - Render component with variant and props
        if (req.method === "POST" && componentName && url.pathname.endsWith("/render")) {
          let body = "";
          req.on("data", (chunk) => {
            body += chunk.toString();
          });
          req.on("end", async () => {
            try {
              const { variant, props } = JSON.parse(body);
              if (!variant) throw new Error("Variant is required");

              const componentDir = resolve(rootDir, "src/components", componentName);
              const variantPath = resolve(componentDir, `${variant}.html`);

              if (!fs.existsSync(variantPath)) {
                // List available variants for debugging
                const availableVariants = [];
                if (fs.existsSync(componentDir)) {
                  const files = fs.readdirSync(componentDir);
                  for (const file of files) {
                    if (file.endsWith(".html")) {
                      availableVariants.push(file.replace(".html", ""));
                    }
                  }
                }
                const msg = `Variant '${variant}' not found. Available: ${availableVariants.join(", ") || "none"}`;
                res.statusCode = 404;
                return res.end(
                  `<pre style="color: #d32f2f; padding: 1rem; font-family: monospace;">${msg}</pre>`,
                );
              }

              // Render with Handlebars
              const html = fs.readFileSync(variantPath, "utf8");
              const template = Handlebars.compile(html);
              const rendered = template(props || {});

              // Wrap in simple HTML structure for iframe
              const fullHtml = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="/index.css">
</head>
<body style="margin: 0; padding: 0;">
  ${rendered}
</body>
</html>`;

              res.setHeader("Content-Type", "text/html");
              res.end(fullHtml);
            } catch (err) {
              console.error("[components] Render Error:", err);
              res.statusCode = 500;
              res.end(
                `<pre style="color: #d32f2f; padding: 1rem; font-family: monospace;">${err.message}</pre>`,
              );
            }
          });
          return;
        }
      }

      // 4. Normal template request (from browser / iframe)
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
