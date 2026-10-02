/**
 * @fileoverview Utilidades para manipulación de bloques administrados en .gitignore.
 */

export const DEFAULT_GITIGNORE_START = "# BEGIN agents:sync managed";
export const DEFAULT_GITIGNORE_END = "# END agents:sync managed";

/**
 * Genera el bloque administrado de `.gitignore` con los delimitadores estándar.
 *
 * @param {readonly string[]} patterns
 * @param {string} [startMarker]
 * @param {string} [endMarker]
 * @returns {string}
 */
export function expectedGitignoreBlock(
  patterns: readonly string[],
  startMarker: string = DEFAULT_GITIGNORE_START,
  endMarker: string = DEFAULT_GITIGNORE_END,
): string {
  return [startMarker, ...patterns, endMarker].join("\n");
}

/**
 * Reemplaza o inserta el bloque administrado dentro del contenido de un archivo `.gitignore`.
 *
 * @param {string} content
 * @param {string} block
 * @param {string} [startMarker]
 * @param {string} [endMarker]
 * @returns {string}
 */
export function replaceGitignoreBlock(
  content: string,
  block: string,
  startMarker: string = DEFAULT_GITIGNORE_START,
  endMarker: string = DEFAULT_GITIGNORE_END,
): string {
  const start = content.indexOf(startMarker);
  const end = content.indexOf(endMarker);

  if ((start === -1) !== (end === -1) || (start !== -1 && end < start)) {
    throw new Error("El bloque administrado de .gitignore está incompleto o desordenado.");
  }
  if (
    start !== -1 &&
    (content.indexOf(startMarker, start + startMarker.length) !== -1 ||
      content.indexOf(endMarker, end + endMarker.length) !== -1)
  ) {
    throw new Error(".gitignore contiene más de un bloque administrado.");
  }
  if (start === -1) {
    const prefix = content.length === 0 ? "" : `${content.replace(/\s+$/, "")}\n\n`;
    return `${prefix}${block}\n`;
  }

  const after = end + endMarker.length;
  return `${content.slice(0, start)}${block}${content.slice(after)}`;
}
