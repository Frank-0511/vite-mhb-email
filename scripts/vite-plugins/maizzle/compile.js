import { render } from "@maizzle/framework";
import fs from "fs-extra";
import Handlebars from "handlebars";
import { resolve } from "node:path";

/**
 * Compila una plantilla HTML con Maizzle y Handlebars
 * @param {string} filePath - Ruta al archivo HTML
 * @param {object} data - Datos para la plantilla
 * @param {string} rootDir - Directorio raíz del proyecto
 * @param {boolean} isPreview - Si es preview (usa tailwind.css) o build (usa tailwind.email.css)
 * @returns {Promise<string>} HTML compilado
 */
export async function compileTemplate(filePath, data, rootDir, isPreview = true) {
  let html = fs.readFileSync(filePath, "utf8");

  // En preview (Vite): asegurar que se usa tailwind.config.js (darkMode: "class")
  // En build (Maizzle): reemplazar con tailwind.email.config.js (darkMode: "media")
  if (!isPreview) {
    html = html.replace(
      /@import "src\/css\/tailwind\.css"/g,
      '@import "src/css/tailwind.email.css"',
    );
  }

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
