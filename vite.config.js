import { render } from "@maizzle/framework";
import Handlebars from "handlebars";
import fs from "fs-extra";
import { globSync } from "glob";
import { resolve } from "path";
import { defineConfig } from "vite";

// Maizzle plugin: intercepts /templates/*.html requests
// 1. Maizzle renders [[ ]] expressions (layout, components, Maizzle logic)
// 2. Handlebars renders {{ }} expressions from data.json (dev preview data)
const maizzlePlugin = () => ({
  name: "vite-plugin-maizzle",
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      if (!req.url?.includes("/templates/") || !req.url?.endsWith(".html")) {
        return next();
      }

      const filePath = resolve(__dirname, "src", req.url.slice(1));
      if (!fs.existsSync(filePath)) return next();

      try {
        const html = fs.readFileSync(filePath, "utf8");

        // Step 1: Maizzle resolves [[ ]] — layout, components, conditionals
        const { html: maizzleHtml } = await render(html, {
          useTransformers: false,
          components: {
            folders: [
              resolve(__dirname, "src/layouts"),
              resolve(__dirname, "src/partials"),
            ],
            tagPrefix: "x-",
          },
          expressions: {
            delimiters: ["[[", "]]"],
            unescapedDelimiters: ["[[[", "]]]"],
          },
        });

        // Step 2: Handlebars resolves {{ }} from data.json (sample data for preview)
        const templateDir = filePath.replace("/index.html", "");
        const dataPath = resolve(templateDir, "data.json");
        const data = fs.existsSync(dataPath) ? fs.readJsonSync(dataPath) : {};
        const finalHtml = Handlebars.compile(maizzleHtml)(data);

        res.setHeader("Content-Type", "text/html");
        res.end(finalHtml);
      } catch (err) {
        console.error("[maizzle] Error rendering template:", err.message);
        next(err);
      }
    });
  },
});

// Build the template list for the dashboard
function getTemplates() {
  return globSync("src/templates/*/index.html").map((file) => {
    const name = file.split("/").slice(-2, -1)[0];
    const dataPath = resolve(__dirname, "src/templates", name, "data.json");
    const data = fs.existsSync(dataPath) ? fs.readJsonSync(dataPath) : {};
    return {
      name,
      title: data.titleTemplate || name,
      path: `/templates/${name}/index.html`,
    };
  });
}

export default defineConfig({
  root: "src",
  server: {
    open: true,
  },
  plugins: [
    maizzlePlugin(),
    // Inject template list into the dashboard index.html
    {
      name: "vite-dashboard-context",
      transformIndexHtml: {
        order: "pre",
        handler(html, ctx) {
          // Only for the dashboard index, not template files
          if (ctx.filename.includes("/templates/")) return html;

          const templates = getTemplates();
          const cards = templates
            .map(
              ({ name, title, path }) => `
          <a
            href="${path}"
            class="block bg-slate-800 border border-slate-700 rounded-xl hover:border-sky-500 transition-colors overflow-hidden group"
          >
            <div class="preview-wrapper border-b border-slate-700 group-hover:border-sky-500 transition-colors">
              <iframe src="${path}" title="Preview: ${title}" scrolling="no" tabindex="-1"></iframe>
            </div>
            <div class="p-5">
              <h2 class="text-lg font-semibold">📧 ${title}</h2>
              <p class="text-slate-500 text-sm mt-1">/templates/${name}/</p>
            </div>
          </a>`,
            )
            .join("\n");

          return html.replace(
            /(<div[^>]*id="template-list"[^>]*>)\s*<\/div>/s,
            `$1${cards}</div>`,
          );
        },
      },
    },
  ],
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "src/index.html"),
      },
    },
  },
});
