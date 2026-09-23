/**
 * @fileoverview Constantes y expresiones regulares compartidas para la validación de variables ESP.
 */

export const FRONTMATTER_RE: RegExp = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;
export const ESP_VAR_RE: RegExp = /\{\{\s*([A-Za-z_][A-Za-z0-9_]*)\s*\}\}/g;
export const TRIPLE_STASH_RE: RegExp = /\{\{\{[\s\S]*?\}\}\}/g;
export const MAIZZE_DOUBLE_RE: RegExp = /\[\[[\s\S]*?\]\]/g;
export const MAIZZE_TRIPLE_RE: RegExp = /\[\[\[[\s\S]*?\]\]\]/g;

/**
 * Severidades asociadas por contrato a los hallazgos de variables ESP:
 * - missing: WARNING (variable faltante no bloquea build pero advierte riesgo de render vacío).
 * - unused: INFO (clave en data.json que no se utiliza en el template).
 */
export const ESP_SEVERITY = Object.freeze({
  missing: "WARNING",
  unused: "INFO",
} as const);

/**
 * Claves reservadas del frontmatter del template que no deben tratarse como variables ESP del data.json.
 */
export const FRONTMATTER_METADATA_KEYS: Set<string> = new Set([
  "title",
  "previewText",
  "titleTemplate",
  "emailType",
  "espVariables",
]);
