// @ts-check
/**
 * @fileoverview Renderizador de preview para componentes de email.
 *
 * Centraliza las transformaciones previas a Maizzle (delimitadores, condicionales,
 * `<each>`) y la composición final con Handlebars. No lee fuera del directorio
 * de parcials validado por `component-catalog.js`.
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

/**
 * Patrón único para reemplazar `[[ variable ]]` por `{{ variable }}`.
 * Se aplica una sola vez por bloque HTML antes y después de Maizzle.
 */
const MAIZZLE_DELIMITER_PATTERN = /\[\[([^\]]+)\]\]/g;

/**
 * @typedef {Object} RenderComponentPreviewOptions
 * @property {string} rootDir Directorio raíz del proyecto.
 * @property {string} componentName Identificador del componente (ya validado).
 * @property {string} variant Variante solicitada (ya validada).
 * @property {unknown} [props] Props opcionales del componente.
 */

/**
 * Convierte delimitadores `[[ var ]]` de Maizzle a Handlebars `{{ var }}`.
 *
 * @param {string} html
 * @returns {string}
 */
function convertMaizzleDelimiters(html) {
  return html.replace(MAIZZLE_DELIMITER_PATTERN, "{{$1}}");
}

/**
 * Convierte condicionales y loops de Maizzle (`<if>`, `<elseif>`, `<else>`,
 * `<each>`) a sus equivalentes Handlebars. Se aplica antes del render Maizzle.
 *
 * @param {string} html
 * @returns {string}
 */
function convertMaizzleConditionals(html) {
  let output = html.replace(
    /<if\s+condition="([^"]+)">\s*([\s\S]*?)\s*<\/if>/gi,
    (_match, condition, body) => `{{#if ${condition}}}${body}{{/if}}`,
  );

  output = output.replace(/<elseif\s+condition="([^"]+)">/gi, (_match, condition) => {
    return `{{else if ${condition}}}`;
  });

  output = output.replace(/<else>\s*/gi, "{{else}}");

  output = output.replace(
    /<each\s+loop="([A-Za-z_$][\w$]*)\s+in\s+([^"]+)"\s*>/gi,
    (_match, itemVar, collectionExpr) => {
      const collection = String(collectionExpr || "").trim();
      if (!collection) return _match;
      return `{{#each ${collection} as |${itemVar}|}}`;
    },
  );

  output = output.replace(/<\/each>/gi, "{{/each}}");
  return output;
}

/**
 * Elimina el bloque `<script props>...</script>` del partial, si existe.
 *
 * @param {string} html
 * @returns {string}
 */
function stripPropsScript(html) {
  return html.replace(/<script\s+props[^>]*>[\s\S]*?<\/script>/i, "");
}

/**
 * Detecta si el componente comienza con un fragmento de tabla (`<tr>`, `<td>`,
 * `<tbody>`, `<thead>` o `<tfoot>`) y lo envuelve en una tabla mínima.
 *
 * @param {string} html
 * @returns {string}
 */
function wrapTableFragment(html) {
  const trimmed = html.trimStart();
  const isTableFragment = /^<(tr|td|tbody|thead|tfoot)\b/i.test(trimmed);
  if (!isTableFragment) return html;
  return `<table class="w-full" cellpadding="0" cellspacing="0" role="none"><tbody>${html}</tbody></table>`;
}

/**
 * Normaliza el input `rows` (array, JSON string u otro) a un array usable.
 *
 * @param {unknown} rowsInput
 * @returns {Array<Record<string, unknown>>}
 */
function normalizeRows(rowsInput) {
  const defaultRows = [
    { label: "Monto", value: "$10.000" },
    { label: "Fecha", value: "25/05/2026" },
  ];
  if (Array.isArray(rowsInput)) return rowsInput;
  if (typeof rowsInput === "string") {
    try {
      const parsed = JSON.parse(rowsInput);
      if (Array.isArray(parsed)) return /** @type {Array<Record<string, unknown>>} */ (parsed);
    } catch {
      // Ignorar JSON inválido; se usan los defaults.
    }
  }
  return defaultRows;
}

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
 * Compone los datos finales para Handlebars, mezclando props del usuario con
 * defaults consistentes con los parciales existentes.
 *
 * @param {Record<string, unknown>} normalizedProps
 * @returns {Record<string, unknown>}
 */
function buildHandlebarsData(normalizedProps) {
  return {
    ...normalizedProps,
    title: normalizedProps.title || "Bienvenido a Mi Empresa",
    subtitle: normalizedProps.subtitle || "Descubre todo lo que podemos hacer por ti",
    buttonText: normalizedProps.buttonText || normalizedProps["button-text"] || "Explorar ahora",
    buttonUrl: normalizedProps.buttonUrl || normalizedProps["button-url"] || "https://ejemplo.com",
    showButton: normalizedProps.showButton !== false && normalizedProps["show-button"] !== "false",

    callCenterNumber:
      normalizedProps.callCenterNumber ||
      normalizedProps["call-center-number"] ||
      "+56 2 1234 5678",
    noReplayEmail:
      normalizedProps.noReplayEmail ||
      normalizedProps.noReplyEmail ||
      normalizedProps["no-reply-email"] ||
      "no-reply@ejemplo.com",

    rows: normalizeRows(normalizedProps.rows),
  };
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
