/**
 * @fileoverview Plugin de contexto de dashboard de templates para Vite.
 */

import fs from "fs-extra";
import { globSync } from "glob";
import { resolve } from "node:path";
import type { IndexHtmlTransformContext, Plugin, ViteDevServer } from "vite";
import { API_ROUTES } from "../../shared/contracts/constants/api-routes.ts";
import { bytesToKB, getProjectPaths } from "../../shared/index.ts";
import {
  getTemplateSizesClientScript,
  renderEmptyDashboardPlaceholder,
  renderTemplateCard,
} from "./dashboard-templates.ts";

export interface DashboardTemplate {
  id: string;
  name: string;
  title: string;
  path: string;
  status: string;
  category: string;
  description: string;
  hasSource: boolean;
  isBuilt: boolean;
}

/**
 * Retorna los templates activos creados en `src/emails/templates/` para el dashboard.
 *
 * @param rootDir Directorio raíz del proyecto.
 * @returns Lista de metadata de templates.
 */
export function getTemplates(rootDir: string): DashboardTemplate[] {
  const paths = getProjectPaths(rootDir);
  const templateFiles = globSync("src/emails/templates/*/index.html", { cwd: rootDir });

  const templates: DashboardTemplate[] = [];
  for (const file of templateFiles) {
    const name = file.split("/").slice(-2, -1)[0];

    const dataPath = paths.templateData(name);
    let data: Record<string, unknown> = {};
    if (fs.existsSync(dataPath)) {
      try {
        data = fs.readJsonSync(dataPath) as Record<string, unknown>;
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

export const dashboardPlugin = (rootDir: string): Plugin => ({
  name: "vite-dashboard-context",
  configureServer(server: ViteDevServer) {
    const paths = getProjectPaths(rootDir);
    server.middlewares.use((req, res, next) => {
      // API endpoint: GET /api/template-sizes
      if (req.url?.startsWith(API_ROUTES.TEMPLATE_SIZES)) {
        const templates = getTemplates(rootDir);
        const sizes: Record<string, { bytes: number; kb: string } | null> = {};

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
    handler(html: string, ctx: IndexHtmlTransformContext) {
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
