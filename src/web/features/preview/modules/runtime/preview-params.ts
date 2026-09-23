/**
 * @fileoverview Extracción y validación de parámetros de URL para el módulo de preview.
 */

/**
 * Extrae y valida el nombre del template desde la query string de la URL.
 *
 * @param {string} [search] - Cadena de búsqueda (por defecto window.location.search).
 * @returns {string | null} El nombre del template o null si no existe.
 */
export function getTemplateNameFromUrl(
  search = typeof window !== "undefined" ? window.location?.search : "",
) {
  const urlParams = new URLSearchParams(search || "");
  const templateName = urlParams.get("template");
  return templateName && templateName.trim().length > 0 ? templateName.trim() : null;
}

/**
 * Muestra en el documento el mensaje de error cuando no se especifica template en la URL.
 *
 * @param {{ innerHTML: string } | null} [targetBody] - Elemento destino (por defecto document.body).
 */
export function renderMissingTemplateError(
  targetBody: Pick<HTMLElement, "innerHTML"> | null = typeof document !== "undefined"
    ? document.body
    : null,
) {
  if (targetBody) {
    targetBody.innerHTML =
      '<div class="p-8 text-red-500 font-bold">Error: No se especificó un template en la URL. (?template=nombre)</div>';
  }
}
