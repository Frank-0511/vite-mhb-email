import { render } from "@maizzle/framework";
import fs from "fs-extra";
import Handlebars from "handlebars";
import { resolve } from "node:path";

/**
 * Compila una plantilla HTML con Maizzle y Handlebars.
 *
 * Usado en preview (Vite): renderiza el template con datos de preview.
 * El CSS de email lo gestiona cada template vía
 * `@import "src/emails/styles/tailwind.email.css"` y
 * `@config "tailwind.email.config.js"` — no se necesita intercambio de configs.
 *
 * @param {string} filePath - Ruta al archivo HTML del template.
 * @param {object} data - Datos para la plantilla (Handlebars).
 * @param {string} rootDir - Directorio raíz del proyecto.
 * @returns {Promise<string>} HTML compilado.
 */
export async function compileTemplate(filePath, data, rootDir) {
  const html = fs.readFileSync(filePath, "utf8");

  const { html: maizzleHtml } = await render(html, {
    useTransformers: false,
    components: {
      folders: [resolve(rootDir, "src/emails/layouts"), resolve(rootDir, "src/emails/partials")],
      tagPrefix: "x-",
    },
    expressions: {
      delimiters: ["[[", "]]"],
      unescapedDelimiters: ["[[[", "]]]"],
    },
  });
  return Handlebars.compile(maizzleHtml)(data);
}
