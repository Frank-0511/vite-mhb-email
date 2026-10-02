/**
 * Fachada pública del subsistema de sincronización y validación de agentes.
 * Re-exporta utilidades especializadas modularizadas bajo ./common/.
 */

export {
  configPath,
  formatError,
  generatedMarker,
  gitignoreEnd,
  gitignoreStart,
  projectRoot,
  scriptDirectory,
} from "./common/constants.mjs";

export {
  assertInside,
  canonicalPath,
  inspectPath,
  isInside,
  pathState,
  validateRelativePath,
  validateTargetParent,
} from "./common/paths.mjs";

export { expectedGitignoreBlock, replaceGitignoreBlock } from "../shared/io/gitignore.ts";

export {
  copyMarker,
  expectedCopy,
  hashFile,
  hashSource,
  isManagedCopy,
} from "../shared/io/hashing.ts";

export { classifySource, classifyTarget } from "./common/classifier.mjs";

export { assertNoTargetOverlaps, loadConfig } from "./common/config.mjs";
