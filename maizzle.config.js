import { globSync } from "glob";
import { rm } from "node:fs/promises";
import { getEmailComponentFolders } from "./scripts/shared/component-folders.js";

export default {
  build: {
    content: ["src/emails/templates/**/*.html"],
    output: {
      path: "dist",
      from: ["src/emails/templates"],
    },
    summary: true,
  },

  // Tell Maizzle where to find layout components (x-main, etc.)
  components: {
    folders: getEmailComponentFolders(process.cwd()),
    tagPrefix: "x-",
  },

  css: {
    // Inline hibrido: estilos base en `style=""`, media queries preservadas en <style>.
    inline: {
      removeInlinedSelectors: false,
    },
    purge: true,
  },

  // Minify HTML y CSS en el build
  minify: {
    removeComments: true,
    collapseWhitespace: true,
    removeEmptyAttributes: true,
    minifyCSS: true,
  },

  // Variables no definidas en front matter se dejan como {{ variable }}
  // Así {{ first_name }}, etc. de SendGrid quedan intactos en el build
  expressions: {
    delimiters: ["[[", "]]"],
    unescapedDelimiters: ["[[[", "]]]"],
    missingLocal: "{{ local }}",
  },

  // Flatten: dist/welcome/index.html → dist/welcome.html
  afterRender: ({ html, config }) => {
    const currentPath = config.build.current.path;
    const folderName = currentPath.dir.split("/").pop();
    config.permalink = `dist/${folderName}.html`;
    return html;
  },

  // Clean up: remove non-html files (data.json) and empty folders
  afterBuild: async ({ files }) => {
    const nonHtml = files.filter((f) => !f.endsWith(".html"));
    await Promise.all(nonHtml.map((f) => rm(f, { force: true })));

    const dirs = globSync("dist/*/");
    await Promise.all(dirs.map((d) => rm(d, { recursive: true, force: true })));
  },
};
