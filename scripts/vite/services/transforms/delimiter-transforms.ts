/**
 * @fileoverview Transformación de delimitadores de variables Maizzle a Handlebars.
 */

/**
 * Patrón único para reemplazar `[[ variable ]]` por `{{ variable }}`.
 * Se aplica una sola vez por bloque HTML antes y después de Maizzle.
 */
export const MAIZZLE_DELIMITER_PATTERN = /\[\[([^\]]+)\]\]/g;

/**
 * Convierte delimitadores `[[ var ]]` de Maizzle a Handlebars `{{ var }}`.
 *
 * @param html Código HTML con delimitadores Maizzle.
 * @returns HTML con delimitadores Handlebars.
 */
export function convertMaizzleDelimiters(html: string): string {
  return html.replace(MAIZZLE_DELIMITER_PATTERN, "{{$1}}");
}
