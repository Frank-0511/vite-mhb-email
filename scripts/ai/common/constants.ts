/**
 * @fileoverview Constantes del subsistema de sincronización y validación de agentes.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";

const commonDirectory: string = path.dirname(fileURLToPath(import.meta.url));

/** Directorio raíz del script de sincronización (`scripts/ai`). */
export const scriptDirectory: string = path.resolve(commonDirectory, "..");

/** Raíz del proyecto. */
export const projectRoot: string = path.resolve(scriptDirectory, "../..");

/** Ruta al manifiesto de configuración de agentes. */
export const configPath: string = path.join(scriptDirectory, "agents.config.json");

export { DEFAULT_GENERATED_MARKER as generatedMarker } from "../../shared/io/hashing.ts";
export {
  DEFAULT_GITIGNORE_START as gitignoreStart,
  DEFAULT_GITIGNORE_END as gitignoreEnd,
} from "../../shared/io/gitignore.ts";
