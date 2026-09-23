/**
 * @fileoverview Comparador y orquestador central de variables ESP faltantes y sobrantes.
 */

import { filterDataKeys } from "./data-filter.ts";
import { extractEspVariables } from "./extractor.ts";
import { parseEspFrontmatter } from "./frontmatter.ts";

export interface EspValidationResult {
  missing: string[];
  unused: string[];
}

export interface ValidateEspVariablesParams {
  source: string;
  data: unknown;
}

/**
 * Compara un template fuente con su `data.json` y devuelve el conjunto de
 * variables faltantes y sobrantes. Las variables listadas en
 * `espVariables` (frontmatter) se excluyen del grupo "missing".
 *
 * @param {ValidateEspVariablesParams} params
 * @returns {EspValidationResult}
 */
export function validateEspVariables({
  source,
  data,
}: ValidateEspVariablesParams): EspValidationResult {
  const referenced = extractEspVariables(source);
  const { espVariables = [] } = parseEspFrontmatter(source);
  const intentional = new Set<string>(espVariables);

  const dataKeys = filterDataKeys(data, source);
  const referencedForCompare = new Set<string>(
    [...referenced].filter((name) => !intentional.has(name)),
  );

  const dataKeySet = new Set<string>(dataKeys);

  const missing: string[] = [];
  for (const name of referencedForCompare) {
    if (!dataKeySet.has(name)) missing.push(name);
  }

  const unused: string[] = [];
  for (const key of dataKeys) {
    if (!referenced.has(key)) unused.push(key);
  }

  // Orden estable para facilitar diffs y snapshots en tests.
  missing.sort();
  unused.sort();

  return { missing, unused };
}
