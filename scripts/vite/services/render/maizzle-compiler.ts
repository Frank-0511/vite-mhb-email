/**
 * @fileoverview Compilador de plantillas HTML con Maizzle y Handlebars para el preview.
 */

import { render } from "@maizzle/framework";
import fs from "fs-extra";
import Handlebars from "handlebars";
import {
  applyLegacySendGridSubstitutions,
  getEmailComponentFolders,
} from "../../../shared/index.ts";

/**
 * Compila una plantilla HTML con Maizzle y Handlebars.
 *
 * Usado en preview (Vite): renderiza el template con datos de preview.
 * El CSS de email lo gestiona cada template vía
 * `@import "src/emails/styles/tailwind.email.css"` y
 * `@config "tailwind.email.config.js"` — no se necesita intercambio de configs.
 *
 * @param filePath Ruta al archivo HTML del template.
 * @param data Datos para la plantilla (Handlebars y SendGrid Legacy).
 * @param rootDir Directorio raíz del proyecto.
 * @returns HTML compilado.
 */
export async function compileTemplate(
  filePath: string,
  data: Record<string, unknown>,
  rootDir: string,
): Promise<string> {
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
  } as Parameters<typeof render>[1]);

  const handlebarsHtml = Handlebars.compile(maizzleHtml)(data);
  return applyLegacySendGridSubstitutions(handlebarsHtml, data);
}
