import { readdirSync } from "node:fs";
import { rm } from "node:fs/promises";
import { join } from "node:path";
import { getEmailComponentFolders } from "./scripts/shared/index.ts";

interface MaizzleConfig {
  build: {
    current: {
      path: {
        dir: string;
      };
    };
  };
  permalink?: string;
}

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
    // Inline híbrido: estilos base en `style=""`; el `<style>` de salida
    // conserva solo lo que no puede inlinearse (media queries, dark mode,
    // pseudo-clases). `removeInlinedSelectors: true` es lo que produce ese
    // resultado: si se deja en `false`, Juice conserva además todos los
    // selectores ya aplicados inline, duplicando el CSS y pudiendo superar
    // el límite de 8192 bytes por bloque `<style>` que aplica Gmail.
    inline: {
      removeInlinedSelectors: true,
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
  afterRender: ({ html, config }: { html: string; config: MaizzleConfig }): string => {
    const currentPath = config.build.current.path;
    const folderName = currentPath.dir.split("/").pop();
    config.permalink = `dist/${folderName}.html`;
    return html;
  },

  // Clean up: remove non-html files (data.json) and empty folders
  afterBuild: async ({ files }: { files: string[] }): Promise<void> => {
    const nonHtml = files.filter((f) => !f.endsWith(".html"));
    await Promise.all(nonHtml.map((f) => rm(f, { force: true })));

    const dirs = readdirSync("dist", { withFileTypes: true }).filter((e) => e.isDirectory());
    await Promise.all(dirs.map((d) => rm(join("dist", d.name), { recursive: true, force: true })));
  },
};
