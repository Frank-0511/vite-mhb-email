import { globSync } from "glob";
import { rm } from "node:fs/promises";

export default {
  build: {
    content: ["src/templates/**/*.html"],
    output: {
      path: "dist",
      from: ["src/templates"],
    },
    summary: true,
  },

  // Tell Maizzle where to find layout components (x-main, etc.)
  components: {
    folders: ["src/layouts", "src/partials"],
    tagPrefix: "x-",
  },

  css: {
    inline: true,
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
  afterRender: async ({ html, config }) => {
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
