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

/**
 * Identificador de marcador para copias administradas generadas.
 * @type {string}
 */
export const generatedMarker = "portfolio-agents:generated";

/**
 * Delimitador inicial del bloque administrado en `.gitignore`.
 * @type {string}
 */
export const gitignoreStart = "# BEGIN agents:sync managed";

/**
 * Delimitador final del bloque administrado en `.gitignore`.
 * @type {string}
 */
export const gitignoreEnd = "# END agents:sync managed";

/**
 * Formatea un error extrayendo su mensaje o representación textual.
 *
 * @param {unknown} error
 * @returns {string}
 */
export function formatError(error) {
  return error instanceof Error ? error.message : String(error);
}
