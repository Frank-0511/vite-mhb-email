/**
 * @fileoverview Validaciones de seguridad para rutas y nombres.
 */

import { relative, sep } from "node:path";

export const TEMPLATE_NAME_PATTERN = /^[a-z0-9-]+$/;

/**
 * Valida nombres de template permitidos para evitar path traversal.
 *
 * @param {unknown} templateName
 * @returns {templateName is string}
 */
export function isValidTemplateName(templateName: unknown): templateName is string {
  return typeof templateName === "string" && TEMPLATE_NAME_PATTERN.test(templateName);
}

/**
 * Lanza un error si el nombre del template es inválido.
 *
 * @param {unknown} templateName
 * @returns {asserts templateName is string}
 * @throws {Error} Si el nombre no cumple el patrón.
 */
export function assertValidTemplateName(templateName: unknown): asserts templateName is string {
  if (!isValidTemplateName(templateName)) {
    throw new Error("invalid template name");
  }
}

/**
 * Verifica que una ruta candidata permanezca dentro de la ruta base.
 *
 * @param {string} basePath
 * @param {string} candidatePath
 * @returns {boolean}
 */
export function isPathInside(basePath: string, candidatePath: string): boolean {
  const relPath = relative(basePath, candidatePath);
  return relPath !== "" && !relPath.startsWith(`..${sep}`) && relPath !== "..";
}
