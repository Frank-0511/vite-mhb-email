/**
 * @fileoverview Funciones auxiliares para formateo y comprobación de errores en scripts/ai.
 */

/**
 * Formatea un error extrayendo su mensaje o representación textual.
 *
 * @param {unknown} error
 * @returns {string} Mensaje de error formateado
 */
export function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Type guard que comprueba si un error desconocido es un ENOENT de Node.js.
 *
 * @param {unknown} error
 * @returns {boolean} True si el error tiene código ENOENT
 */
export function isEnoent(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}
