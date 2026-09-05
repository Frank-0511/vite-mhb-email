// @ts-check
/**
 * @fileoverview Constantes y expresiones regulares compartidas para la validación de variables ESP.
 */

export const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;
export const ESP_VAR_RE = /\{\{\s*([A-Za-z_][A-Za-z0-9_]*)\s*\}\}/g;
export const TRIPLE_STASH_RE = /\{\{\{[\s\S]*?\}\}\}/g;
export const MAIZZE_DOUBLE_RE = /\[\[[\s\S]*?\]\]/g;
export const MAIZZE_TRIPLE_RE = /\[\[\[[\s\S]*?\]\]\]/g;

/**
 * Severidades asociadas por contrato a los hallazgos de variables ESP:
 * - missing: WARNING (variable faltante no bloquea build pero advierte riesgo de render vacío).
 * - unused: INFO (clave en data.json que no se utiliza en el template).
 *
 * @readonly
 * @enum {string}
 */
export const ESP_SEVERITY = Object.freeze({
  missing: "WARNING",
  unused: "INFO",
});

/**
 * Claves reservadas del frontmatter del template que no deben tratarse como variables ESP del data.json.
 * @type {Set<string>}
 */
export const FRONTMATTER_METADATA_KEYS = new Set([
  "title",
  "previewText",
  "titleTemplate",
  "emailType",
  "espVariables",
]);
