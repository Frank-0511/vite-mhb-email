// @ts-check
/**
 * @fileoverview Extracción de variables ESP `{{ var }}` a partir del código fuente HTML de emails.
 */

import {
  ESP_VAR_RE,
  MAIZZE_DOUBLE_RE,
  MAIZZE_TRIPLE_RE,
  TRIPLE_STASH_RE,
} from "./esp-constants.js";
import { stripFrontmatter } from "./esp-frontmatter.js";

/**
 * Elimina todos los bloques `{{#each …}}…{{/each}}` (no anidados) del cuerpo
 * del template. La apertura y el cierre se eliminan junto con el contenido,
 * evitando reportar `{{ this }}` interno como variable ESP referenciada.
 *
 * @param {string} body
 * @returns {string}
 */
export function stripEachBlocks(body) {
  let output = "";
  let index = 0;
  while (index < body.length) {
    const openAt = body.indexOf("{{#each", index);
    if (openAt === -1) {
      output += body.slice(index);
      break;
    }
    const closeOfOpen = body.indexOf("}}", openAt);
    if (closeOfOpen === -1) {
      output += body.slice(index);
      break;
    }
    const closeBlock = body.indexOf("{{/each}}", closeOfOpen);
    if (closeBlock === -1) {
      output += body.slice(index);
      break;
    }
    // Conservar todo antes del bloque y avanzar después de {{/each}}.
    output += body.slice(index, openAt);
    index = closeBlock + "{{/each}}".length;
  }
  return output;
}

/**
 * Recolecta variables ESP dentro de un cuerpo de template ya sin frontmatter.
 *
 * @param {string} body
 * @returns {Set<string>}
 */
export function collectEspVariablesInBody(body) {
  // Eliminar zonas que NO son ESP: triple-stash, maizzle [[ ]] y [[[ ]]].
  // El orden importa: primero lo más específico (triple) para no destruir
  // accidentalmente pares `{{ }}` legítimos dentro de un bloque Maizzle.
  const sanitized = body
    .replace(TRIPLE_STASH_RE, "")
    .replace(MAIZZE_TRIPLE_RE, "")
    .replace(MAIZZE_DOUBLE_RE, "");

  // Eliminar bloques `{{#each …}}…{{/each}}` para ignorar `{{ this }}` interno.
  const eachStripped = stripEachBlocks(sanitized);

  const found = new Set();
  for (const match of eachStripped.matchAll(ESP_VAR_RE)) {
    found.add(match[1]);
  }
  return found;
}

/**
 * Extrae los identificadores ESP `{{ var }}` presentes en un template fuente.
 *
 * @param {string} source Contenido del `index.html` del template.
 * @returns {Set<string>} Conjunto de nombres únicos (primer uso gana orden).
 */
export function extractEspVariables(source) {
  if (typeof source !== "string" || source.length === 0) {
    return new Set();
  }

  const body = stripFrontmatter(source);
  return collectEspVariablesInBody(body);
}
