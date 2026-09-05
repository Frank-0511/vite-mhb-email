// @ts-check
import { resolve } from "node:path";

/** @enum {string} */
export const Severity = {
  ERROR: "ERROR",
  WARNING: "WARNING",
  INFO: "INFO",
};

/**
 * @typedef {Object} Issue
 * @property {string} ruleId
 * @property {string} severity
 * @property {string} message
 * @property {string} [context]
 * @property {string} [hint]
 * @property {number} [line]
 */

/**
 * @typedef {Object} RuleContext
 * @property {string} filePath Ruta absoluta del HTML compilado.
 * @property {string} projectRoot Raíz del proyecto para fuentes asociadas.
 */

/**
 * @typedef {Object} Rule
 * @property {string} id
 * @property {string} severity
 * @property {string} description
 * @property {(html: string, context: RuleContext) => Issue[]} check
 */

/** @type {string} */
export const projectRoot = resolve(process.cwd());

/**
 * Obtiene el número de línea aproximado de un índice en el HTML.
 * @param {string} html
 * @param {number} index
 * @returns {number}
 */
export function getLineNumber(html, index) {
  return html.substring(0, index).split("\n").length;
}

/**
 * Extrae un fragmento de contexto limpio alrededor de un match.
 * @param {string} html
 * @param {number} index
 * @param {number} [length=100]
 * @returns {string}
 */
export function getContext(html, index, length = 100) {
  const start = Math.max(0, index);
  const end = Math.min(html.length, start + length);
  let snippet = html.substring(start, end).replace(/\s+/g, " ").trim();
  if (end < html.length) snippet += "…";
  return snippet;
}

/**
 * Extrae el contenido de las etiquetas <style> de un HTML.
 * @param {string} html
 * @returns {string}
 */
export function extractStyleContent(html) {
  const styleBlocks = [];
  const regex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) styleBlocks.push(match[1]);
  return styleBlocks.join("\n");
}
