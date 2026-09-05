// @ts-check
/**
 * @fileoverview Transformaciones sintácticas de HTML y markup para preview de componentes.
 *
 * Funciones puras para convertir sintaxis Maizzle a Handlebars, remover scripts
 * de props y envolver fragmentos de tablas antes del render.
 */

/**
 * Patrón único para reemplazar `[[ variable ]]` por `{{ variable }}`.
 * Se aplica una sola vez por bloque HTML antes y después de Maizzle.
 */
export const MAIZZLE_DELIMITER_PATTERN = /\[\[([^\]]+)\]\]/g;

/**
 * Convierte delimitadores `[[ var ]]` de Maizzle a Handlebars `{{ var }}`.
 *
 * @param {string} html
 * @returns {string}
 */
export function convertMaizzleDelimiters(html) {
  return html.replace(MAIZZLE_DELIMITER_PATTERN, "{{$1}}");
}

/**
 * Convierte condicionales y loops de Maizzle (`<if>`, `<elseif>`, `<else>`,
 * `<each>`) a sus equivalentes Handlebars. Se aplica antes del render Maizzle.
 *
 * @param {string} html
 * @returns {string}
 */
export function convertMaizzleConditionals(html) {
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
export function stripPropsScript(html) {
  return html.replace(/<script\s+props[^>]*>[\s\S]*?<\/script>/i, "");
}

/**
 * Detecta si el componente comienza con un fragmento de tabla (`<tr>`, `<td>`,
 * `<tbody>`, `<thead>` o `<tfoot>`) y lo envuelve en una tabla mínima.
 *
 * @param {string} html
 * @returns {string}
 */
export function wrapTableFragment(html) {
  const trimmed = html.trimStart();
  const isTableFragment = /^<(tr|td|tbody|thead|tfoot)\b/i.test(trimmed);
  if (!isTableFragment) return html;
  return `<table class="w-full" cellpadding="0" cellspacing="0" role="none"><tbody>${html}</tbody></table>`;
}
