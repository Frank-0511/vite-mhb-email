// @ts-check
/**
 * @fileoverview Extracción y análisis de frontmatter YAML-lite para templates de email.
 */

import { FRONTMATTER_METADATA_KEYS, FRONTMATTER_RE } from "./esp-constants.js";

/**
 * Quita comillas simples o dobles envolventes de un token.
 *
 * @param {string} value
 * @returns {string}
 */
export function unquote(value) {
  if (!value) return value;
  const first = value[0];
  const last = value[value.length - 1];
  if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
    return value.slice(1, -1);
  }
  return value;
}

/**
 * Devuelve el cuerpo del template sin el bloque frontmatter inicial.
 *
 * @param {string} source
 * @returns {string}
 */
export function stripFrontmatter(source) {
  const match = source.match(FRONTMATTER_RE);
  if (!match) return source;
  const after = source.slice(match[0].length);
  return after.startsWith("\r\n") || after.startsWith("\n") ? after.slice(1) : after;
}

/**
 * Parsea un frontmatter YAML-lite del template y devuelve sus claves declaradas.
 * Implementación mínima para MHB-06: solo entiende claves planas y
 * `espVariables` en formato lista YAML o inline JSON-like.
 *
 * Devuelve `{}` si el frontmatter falta o es ilegible; no lanza.
 *
 * @param {string} source
 * @returns {{ espVariables?: string[] }}
 */
export function parseEspFrontmatter(source) {
  if (typeof source !== "string") return {};
  const match = source.match(FRONTMATTER_RE);
  if (!match) return {};

  const block = match[1];
  // 1) Formato lista YAML:
  //    espVariables:
  //      - foo
  //      - bar
  const listMatch = block.match(/^espVariables\s*:\s*(?:\r?\n)((?:\s*-\s*[^\r\n]+\r?\n?)+)/im);
  if (listMatch) {
    const items = listMatch[1]
      .split(/\r?\n/)
      .map((line) => line.replace(/^\s*-\s*/, "").trim())
      .filter((line) => line.length > 0)
      .map((line) => unquote(line));
    return { espVariables: items };
  }

  // 2) Formato inline JSON-like: `espVariables: ["a", "b"]`
  const inlineMatch = block.match(/^espVariables\s*:\s*\[(.*?)\]/im);
  if (inlineMatch) {
    const items = inlineMatch[1]
      .split(",")
      .map((item) => unquote(item.trim()))
      .filter((item) => item.length > 0);
    return { espVariables: items };
  }

  return {};
}

/**
 * Extrae nombres de claves planas del frontmatter para no tratar metadatos
 * como variables ESP del data.json.
 *
 * @param {string} source
 * @returns {Set<string>}
 */
export function frontmatterKeys(source) {
  const match = typeof source === "string" ? source.match(FRONTMATTER_RE) : null;
  if (!match) return new Set();

  const keys = new Set(FRONTMATTER_METADATA_KEYS);
  for (const line of match[1].split(/\r?\n/)) {
    const keyMatch = line.match(/^([A-Za-z_][A-Za-z0-9_-]*)\s*:/);
    if (keyMatch) keys.add(keyMatch[1]);
  }
  return keys;
}
