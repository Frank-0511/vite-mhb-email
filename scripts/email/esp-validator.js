// @ts-check
/**
 * @fileoverview Comparador y orquestador central de variables ESP faltantes y sobrantes.
 */

import { filterDataKeys } from "./esp-data-filter.js";
import { extractEspVariables } from "./esp-extractor.js";
import { parseEspFrontmatter } from "./esp-frontmatter.js";

/**
 * @typedef {Object} EspValidationResult
 * @property {string[]} missing Variables referenciadas en el template que no
 *   existen en `data` (descontando `espVariables` intencionales).
 * @property {string[]} unused Claves de primer nivel de `data` que el
 *   template no referencia.
 */

/**
 * Compara un template fuente con su `data.json` y devuelve el conjunto de
 * variables faltantes y sobrantes. Las variables listadas en
 * `espVariables` (frontmatter) se excluyen del grupo "missing".
 *
 * @param {Object} params
 * @param {string} params.source Contenido del `index.html` del template.
 * @param {unknown} params.data Objeto JSON con los datos disponibles.
 * @returns {EspValidationResult}
 */
export function validateEspVariables({ source, data }) {
  const referenced = extractEspVariables(source);
  const { espVariables = [] } = parseEspFrontmatter(source);
  const intentional = new Set(espVariables);

  const dataKeys = filterDataKeys(data, source);
  const referencedForCompare = new Set([...referenced].filter((name) => !intentional.has(name)));

  const dataKeySet = new Set(dataKeys);

  const missing = [];
  for (const name of referencedForCompare) {
    if (!dataKeySet.has(name)) missing.push(name);
  }

  const unused = [];
  for (const key of dataKeys) {
    if (!referenced.has(key)) unused.push(key);
  }

  // Orden estable para facilitar diffs y snapshots en tests.
  missing.sort();
  unused.sort();

  return { missing, unused };
}
