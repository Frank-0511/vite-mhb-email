import path from "node:path";
import { fileURLToPath } from "node:url";

const commonDirectory = path.dirname(fileURLToPath(import.meta.url));

/**
 * Directorio raíz del script de sincronización (`scripts/ai`).
 * @type {string}
 */
export const scriptDirectory = path.resolve(commonDirectory, "..");

/**
 * Raíz del proyecto.
 * @type {string}
 */
export const projectRoot = path.resolve(scriptDirectory, "../..");

/**
 * Ruta al manifiesto de configuración de agentes.
 * @type {string}
 */
export const configPath = path.join(scriptDirectory, "agents.config.json");

export { DEFAULT_GENERATED_MARKER as generatedMarker } from "../../shared/io/hashing.ts";
export {
  DEFAULT_GITIGNORE_START as gitignoreStart,
  DEFAULT_GITIGNORE_END as gitignoreEnd,
} from "../../shared/io/gitignore.ts";

/**
 * Formatea un error extrayendo su mensaje o representación textual.
 *
 * @param {unknown} error
 * @returns {string}
 */
export function formatError(error) {
  return error instanceof Error ? error.message : String(error);
}
