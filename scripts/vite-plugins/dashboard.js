import fs from "fs-extra";
import { globSync } from "glob";
import { resolve } from "node:path";

// Build the template list for the dashboard
export function getTemplates(rootDir) {
  return globSync("src/templates/*/index.html").map((file) => {
    const name = file.split("/").slice(-2, -1)[0];
    const dataPath = resolve(rootDir, "src/templates", name, "data.json");
    const data = fs.existsSync(dataPath) ? fs.readJsonSync(dataPath) : {};
    return {
      name,
      title: data.titleTemplate || name,
      path: `/templates/${name}/index.html`,
    };
  });
}

export const dashboardPlugin = (rootDir) => ({
  name: "vite-dashboard-context",
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      // API endpoint: GET /api/template-sizes
      if (req.url?.startsWith("/api/template-sizes")) {
        const templates = getTemplates(rootDir);
        const sizes = {};

        for (const { name } of templates) {
          const distPath = resolve(rootDir, "dist", `${name}.html`);
          if (fs.existsSync(distPath)) {
            const stats = fs.statSync(distPath);
            sizes[name] = {
              bytes: stats.size,
              kb: (stats.size / 1024).toFixed(2),
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
      const cards = templates
        .map(
          ({ name, title, path }) => `
      <a
        href="/preview.html?template=${name}"
        class="block bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm dark:shadow-slate-900/50 hover:border-sky-400 dark:hover:border-sky-500 hover:shadow-lg dark:hover:shadow-sky-500/30 transition-all duration-300 overflow-hidden group"
      >
        <!-- Preview Section -->
        <div class="preview-wrapper border-b border-slate-200 dark:border-slate-700 group-hover:border-sky-300 dark:group-hover:border-sky-500 transition-colors bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900">
          <iframe src="${path}" title="Preview: ${title}" scrolling="no" tabindex="-1"></iframe>
        </div>

        <!-- Content Section -->
        <div class="p-6 space-y-4">
          <!-- Title -->
          <div>
            <h2 class="text-lg font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
              📧 ${title}
            </h2>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">/templates/${name}/</p>
          </div>

          <!-- Divider -->
          <div class="border-t border-slate-200 dark:border-slate-700"></div>

          <!-- Size Badge & Status -->
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-2">
              <span class="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">Size</span>
            </div>
            <div class="template-size-badge-${name} flex items-center gap-2">
              <span class="text-sm font-semibold text-slate-600 dark:text-slate-300">
                <span class="template-size-${name}">—</span>
              </span>
              <span class="template-status-${name} w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 transition-colors"></span>
            </div>
          </div>

          <!-- Gmail Limit Indicator -->
          <div class="text-xs text-slate-500 dark:text-slate-400 mt-2">
            <span>Gmail limit: 102KB</span>
          </div>
        </div>
      </a>`,
        )
        .join("\n");

      // Add script to load and display template sizes
      const sizeScript = `
      <script>
        async function loadTemplateSizes() {
          try {
            const response = await fetch('/api/template-sizes');
            const sizes = await response.json();
            for (const [name, size] of Object.entries(sizes)) {
              const sizeEl = document.querySelector('.template-size-' + name);
              const statusEl = document.querySelector('.template-status-' + name);
              if (sizeEl) {
                if (size === null) {
                  sizeEl.textContent = 'Not built';
                  if (statusEl) statusEl.className = 'template-status-' + name + ' w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-600';
                } else {
                  const kb = parseFloat(size.kb);
                  let statusColor = 'bg-green-500 dark:bg-green-600';
                  let textColor = 'text-green-700 dark:text-green-400';

                  if (kb > 102) {
                    statusColor = 'bg-red-500 dark:bg-red-600';
                    textColor = 'text-red-700 dark:text-red-400';
                  } else if (kb > 100) {
                    statusColor = 'bg-yellow-500 dark:bg-yellow-600';
                    textColor = 'text-yellow-700 dark:text-yellow-400';
                  }

                  sizeEl.textContent = kb + ' KB';
                  sizeEl.className = 'template-size-' + name + ' ' + textColor + ' font-semibold';
                  if (statusEl) statusEl.className = 'template-status-' + name + ' w-2 h-2 rounded-full ' + statusColor;
                }
              }
            }
          } catch (err) {
            console.error('Error loading template sizes:', err);
          }
        }
        loadTemplateSizes();
      <\/script>`;

      return html
        .replace(/(<div[^>]*id="template-list"[^>]*>)\s*<\/div>/s, `$1${cards}</div>`)
        .replace(/<\/body>/, sizeScript + "</body>");
    },
  },
});
