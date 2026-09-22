/**
 * @fileoverview Barril exportador del catálogo y fixtures de componentes.
 */

export {
  isValidComponentIdentifier,
  getPartialsRoot,
  listVariantsFromDir,
  listComponents,
  findComponentDir,
  readComponentSchema,
  type ComponentVariant,
  type ComponentSummary,
  type ComponentSchema,
} from "./component-catalog.ts";

export { normalizeRows, buildHandlebarsData } from "./component-preview-fixtures.ts";
