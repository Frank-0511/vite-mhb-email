import fs from "fs-extra";
import { globSync } from "glob";
import { resolve } from "path";

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
        class="block bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm dark:shadow-slate-900/60 hover:border-sky-500 dark:hover:border-sky-500 hover:shadow-md dark:hover:shadow-sky-500/20 transition-all overflow-hidden group"
      >
        <div class="preview-wrapper border-b border-slate-200 dark:border-slate-700 group-hover:border-sky-500 transition-colors bg-white dark:bg-slate-900">
          <iframe src="${path}" title="Preview: ${title}" scrolling="no" tabindex="-1"></iframe>
        </div>
        <div class="p-5">
          <h2 class="text-lg font-semibold text-slate-800 dark:text-white">📧 ${title}</h2>
          <p class="text-slate-500 dark:text-slate-400 text-sm mt-1">/templates/${name}/</p>
        </div>
      </a>`,
        )
        .join("\n");

      return html.replace(/(<div[^>]*id="template-list"[^>]*>)\s*<\/div>/s, `$1${cards}</div>`);
    },
  },
});
