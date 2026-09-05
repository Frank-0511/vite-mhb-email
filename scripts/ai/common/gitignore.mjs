import { gitignoreEnd, gitignoreStart } from "./constants.mjs";

/**
 * Genera el bloque administrado de `.gitignore` con los delimitadores estándar.
 *
 * @param {string[]} patterns
 * @returns {string}
 */
export function expectedGitignoreBlock(patterns) {
  return [gitignoreStart, ...patterns, gitignoreEnd].join("\n");
}

/**
 * Reemplaza o inserta el bloque administrado dentro del contenido de un archivo `.gitignore`.
 *
 * @param {string} content
 * @param {string} block
 * @returns {string}
 */
export function replaceGitignoreBlock(content, block) {
  const start = content.indexOf(gitignoreStart);
  const end = content.indexOf(gitignoreEnd);

  if ((start === -1) !== (end === -1) || (start !== -1 && end < start)) {
    throw new Error("El bloque administrado de .gitignore está incompleto o desordenado.");
  }
  if (
    start !== -1 &&
    (content.indexOf(gitignoreStart, start + gitignoreStart.length) !== -1 ||
      content.indexOf(gitignoreEnd, end + gitignoreEnd.length) !== -1)
  ) {
    throw new Error(".gitignore contiene más de un bloque administrado.");
  }
  if (start === -1) {
    const prefix = content.length === 0 ? "" : `${content.replace(/\s+$/, "")}\n\n`;
    return `${prefix}${block}\n`;
  }

  const after = end + gitignoreEnd.length;
  return `${content.slice(0, start)}${block}${content.slice(after)}`;
}
