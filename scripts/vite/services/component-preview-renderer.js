// @ts-check
/**
 * @fileoverview Renderizador de preview para componentes de email.
 *
 * Centraliza la orquestación del render previo con Maizzle y la composición final
 * con Handlebars. Delega las transformaciones puras en `component-preview-transforms.js`
 * y los fixtures de props en `component-preview-fixtures.js`. No lee fuera del
 * directorio de parciales validado por `component-catalog.js`.
 */

import { render } from "@maizzle/framework";
import fs from "fs-extra";
import Handlebars from "handlebars";
import { resolve } from "node:path";
import { getEmailComponentFolders } from "../../shared/component-folders.js";
import {
  findComponentDir,
  isValidComponentIdentifier,
  listVariantsFromDir,
} from "./component-catalog.js";
import { buildHandlebarsData } from "./component-preview-fixtures.js";
import {
  convertMaizzleConditionals,
  convertMaizzleDelimiters,
  stripPropsScript,
  wrapTableFragment,
} from "./component-preview-transforms.js";

/**
 * @typedef {Object} RenderComponentPreviewOptions
 * @property {string} rootDir Directorio raíz del proyecto.
 * @property {string} componentName Identificador del componente (ya validado).
 * @property {string} variant Variante solicitada (ya validada).
 * @property {unknown} [props] Props opcionales del componente.
 */

/**
 * Compone el documento HTML completo que Maizzle procesará, incluyendo layout
 * de preview y estilos del componente.
 *
 * @param {string} componentHtmlForLayout HTML ya envuelto si es fragmento de tabla.
 * @returns {string}
 */
function buildPreviewDocument(componentHtmlForLayout) {
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no, url=no" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <style>
    :root {
      color-scheme: light dark;
    }
  </style>
  <style>
    @import "src/emails/styles/tailwind.email.css";
  </style>
</head>
<body class="bg-zinc-100 dark:bg-zinc-900 m-0 p-0">
  <div class="w-full bg-zinc-100 dark:bg-zinc-900">
    <table class="w-full max-w-2xl mx-auto" cellpadding="0" cellspacing="0" role="none">
      <!-- CONTENT (component) -->
      <tr>
        <td class="bg-white dark:bg-zinc-800 px-8 py-10 dark:text-zinc-100">
          ${componentHtmlForLayout}
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
}

/**
 * Busca el archivo de variante dentro del directorio validado, probando
 * primero `<variant>.html` y después `<componentName>-<variant>.html`.
 *
 * @param {string} componentDir
 * @param {string} componentName
 * @param {string} variant
 * @returns {string | null}
 */
function resolveVariantPath(componentDir, componentName, variant) {
  /** @type {string[]} */
  const candidates = [`${variant}.html`, `${componentName}-${variant}.html`];
  for (const name of candidates) {
    if (!isValidComponentIdentifier(name.replace(/\.html$/, ""))) continue;
    const candidate = resolve(componentDir, name);
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

/**
 * Renderiza la preview de un componente y devuelve el HTML final listo para
 * incrustar en un iframe. Lanza `Error` con mensaje estable si la variante no
 * existe o el componente no se encuentra.
 *
 * @param {RenderComponentPreviewOptions} options
 * @returns {Promise<string>}
 */
export async function renderComponentPreview(options) {
  const { rootDir, componentName, variant } = options;
  const props =
    options.props && typeof options.props === "object"
      ? /** @type {Record<string, unknown>} */ (options.props)
      : {};

  if (!isValidComponentIdentifier(componentName)) {
    throw new Error("Invalid component name");
  }
  if (!isValidComponentIdentifier(variant)) {
    throw new Error("Invalid variant");
  }

  const componentDir = findComponentDir(rootDir, componentName);
  if (!componentDir) {
    throw new Error(`Component '${componentName}' not found`);
  }

  const variantPath = resolveVariantPath(componentDir, componentName, variant);
  if (!variantPath) {
    const available = listVariantsFromDir(componentDir);
    throw new Error(`Variant '${variant}' not found. Available: ${available.join(", ") || "none"}`);
  }

  let componentHtml = fs.readFileSync(variantPath, "utf8");
  componentHtml = stripPropsScript(componentHtml);
  componentHtml = convertMaizzleDelimiters(componentHtml);
  componentHtml = convertMaizzleConditionals(componentHtml);
  const layoutHtml = wrapTableFragment(componentHtml);

  const { html: maizzleHtml } = await render(buildPreviewDocument(layoutHtml), {
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

  const cleanHtml = convertMaizzleDelimiters(maizzleHtml);
  const template = Handlebars.compile(cleanHtml);
  return template(buildHandlebarsData(props));
}
