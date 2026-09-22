/**
 * @fileoverview Fachada pública del validador de variables ESP `{{ var }}` para EmailForge Toolkit.
 * Re-exporta utilidades modularizadas bajo submódulos especializados en scripts/esp/.
 */

export { ESP_SEVERITY, FRONTMATTER_METADATA_KEYS } from "./esp-constants.ts";
export type { EspSeverityKey, EspSeverityValue } from "./esp-constants.ts";
export {
  frontmatterKeys,
  parseEspFrontmatter,
  stripFrontmatter,
  unquote,
} from "./esp-frontmatter.ts";
export type { EspFrontmatterResult } from "./esp-frontmatter.ts";
export {
  collectEspVariablesInBody,
  extractEspVariables,
  stripEachBlocks,
} from "./esp-extractor.ts";
export { filterDataKeys } from "./esp-data-filter.ts";
export { validateEspVariables } from "./esp-validator.ts";
export type { EspValidationResult, ValidateEspVariablesParams } from "./esp-validator.ts";
