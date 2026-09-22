import fs from "fs-extra";
import { globSync } from "glob";
import { resolve } from "node:path";
import { bytesToKB } from "../../shared/index.ts";
import { getProjectPaths } from "../../shared/index.ts";
import {
  getTemplateSizesClientScript,
  renderEmptyDashboardPlaceholder,
  renderTemplateCard,
} from "./dashboard-templates.js";

/**
 * Retorna los templates activos creados en `src/emails/templates/` para el dashboard.
 *
 * @param {string} rootDir
 * @returns {Array<{ id: string, name: string, title: string, path: string, status: string, category: string, description: string, hasSource: boolean, isBuilt: boolean }>}
 */
export function getTemplates(rootDir) {
  const paths = getProjectPaths(rootDir);
  const templateFiles = globSync("src/emails/templates/*/index.html", { cwd: rootDir });

  const templates = [];
  for (const file of templateFiles) {
    const name = file.split("/").slice(-2, -1)[0];

    const dataPath = paths.templateData(name);
    /** @type {Record<string, unknown>} */
    let data = {};
    if (fs.existsSync(dataPath)) {
      try {
        data = fs.readJsonSync(dataPath);
      } catch {
        // Fallback a objeto vacío
      }
    }

    const distPath = resolve(paths.distDir, `${name}.html`);
    const title = (typeof data.titleTemplate === "string" && data.titleTemplate) || name;
    const description =
      (typeof data.previewText === "string" && data.previewText) || `Template ${name}`;

    templates.push({
      id: name,
      name,
      title,
      path: `/templates/${name}/index.html`,
      status: "available",
      category: "Email",
      description,
      hasSource: true,
      isBuilt: fs.existsSync(distPath),
    });
  }

  templates.sort((a, b) => a.name.localeCompare(b.name));
  return templates;
}

export { renderTemplateCard };

export const dashboardPlugin = (rootDir) => ({
  name: "vite-dashboard-context",
  configureServer(server) {
    const paths = getProjectPaths(rootDir);
    server.middlewares.use((req, res, next) => {
      // API endpoint: GET /api/template-sizes
      if (req.url?.startsWith("/api/template-sizes")) {
        const templates = getTemplates(rootDir);
        const sizes = {};

        for (const { name } of templates) {
          const distPath = resolve(paths.distDir, `${name}.html`);
          if (fs.existsSync(distPath)) {
            const stats = fs.statSync(distPath);
            sizes[name] = {
              bytes: stats.size,
              kb: bytesToKB(stats.size),
            };
          } else {
            sizes[name] = null; // Not built yet
          }
        }

        res.setHeader("Content-Type", "application/json");
        return res.end(JSON.stringify(sizes));
      }

      next();
    });
  },

  transformIndexHtml: {
    order: "pre",
    handler(html, ctx) {
      // Only for the dashboard index, not template files
      if (ctx.filename.includes("/templates/")) return html;

      const templates = getTemplates(rootDir);
      const cards =
        templates.length > 0
          ? templates.map((template) => renderTemplateCard(template)).join("\n")
          : renderEmptyDashboardPlaceholder();

      const sizeScript = getTemplateSizesClientScript();

      return html
        .replace(/(<div[^>]*id="template-list"[^>]*>)\s*<\/div>/s, `$1${cards}</div>`)
        .replace(/<\/body>/, sizeScript + "</body>");
    },
  },
});
