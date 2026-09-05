// @ts-check
/**
 * @fileoverview Fachada pública del validador de variables ESP `{{ var }}` para EmailForge Toolkit.
 * Re-exporta utilidades modularizadas bajo submódulos especializados en scripts/email/.
 */

export { ESP_SEVERITY, FRONTMATTER_METADATA_KEYS } from "./esp-constants.js";
export {
  frontmatterKeys,
  parseEspFrontmatter,
  stripFrontmatter,
  unquote,
} from "./esp-frontmatter.js";
export {
  collectEspVariablesInBody,
  extractEspVariables,
  stripEachBlocks,
} from "./esp-extractor.js";
export { filterDataKeys } from "./esp-data-filter.js";
export { validateEspVariables } from "./esp-validator.js";
