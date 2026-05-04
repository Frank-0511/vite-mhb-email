// @ts-check
/**
 * @fileoverview Validaciones de seguridad para rutas y nombres.
 */

import { relative, sep } from "node:path";

export const TEMPLATE_NAME_PATTERN = /^[a-z0-9-]+$/;

/**
 * Valida nombres de template permitidos para evitar path traversal.
 *
 * @param {string} templateName
 * @returns {boolean}
 */
export function isValidTemplateName(templateName) {
  return TEMPLATE_NAME_PATTERN.test(templateName);
}

/**
 * Lanza un error si el nombre del template es inválido.
 *
 * @param {string} templateName
 * @throws {Error} Si el nombre no cumple el patrón.
 */
export function assertValidTemplateName(templateName) {
  if (!isValidTemplateName(templateName)) {
    throw new Error(`invalid template name for cache path: ${templateName}`);
  }
}

/**
 * Verifica que una ruta candidata permanezca dentro de la ruta base.
 *
 * @param {string} basePath
 * @param {string} candidatePath
 * @returns {boolean}
 */
export function isPathInside(basePath, candidatePath) {
  const relPath = relative(basePath, candidatePath);
  return relPath !== "" && !relPath.startsWith(`..${sep}`) && relPath !== "..";
}
