import { render } from "@maizzle/framework";
import fs from "fs-extra";
import Handlebars from "handlebars";
import { getEmailComponentFolders } from "../../shared/component-folders.js";
import { applyLegacySendGridSubstitutions } from "../../shared/handlebars.js";

/**
 * Compila una plantilla HTML con Maizzle y Handlebars.
 *
 * Usado en preview (Vite): renderiza el template con datos de preview.
 * El CSS de email lo gestiona cada template vía
 * `@import "src/emails/styles/tailwind.email.css"` y
 * `@config "tailwind.email.config.js"` — no se necesita intercambio de configs.
 *
 * @param {string} filePath - Ruta al archivo HTML del template.
 * @param {Record<string, unknown>} data - Datos para la plantilla (Handlebars y SendGrid Legacy).
 * @param {string} rootDir - Directorio raíz del proyecto.
 * @returns {Promise<string>} HTML compilado.
 */
export async function compileTemplate(filePath, data, rootDir) {
  const html = fs.readFileSync(filePath, "utf8");

  const { html: maizzleHtml } = await render(html, {
    // Preview debe reflejar el output real de email, incluyendo Tailwind/Maizzle transformers.
    useTransformers: true,
    components: {
      folders: getEmailComponentFolders(rootDir),
      tagPrefix: "x-",
    },
    expressions: {
      delimiters: ["[[", "]]"],
      unescapedDelimiters: ["[[[", "]]]"],
    },
  });
  const handlebarsHtml = Handlebars.compile(maizzleHtml)(data);
  return applyLegacySendGridSubstitutions(handlebarsHtml, data);
}
