import { realpath } from "node:fs/promises";
import { isManagedCopy } from "./hashing.mjs";
import { inspectPath } from "./paths.mjs";

/**
 * @typedef {'absent' | 'broken-symlink' | 'managed-symlink' | 'unmanaged-symlink' | 'managed-copy' | 'invalid' | 'manual'} TargetClassificationKind
 */

/**
 * @typedef {Object} TargetClassification
 * @property {TargetClassificationKind} kind
 * @property {import("./paths.mjs").PathInspection} inspection
 * @property {any} [source]
 */

/**
 * Clasifica e inspecciona la fuente canónica de un target.
 *
 * @param {{ source: string, sourceRelative: string }} target
 * @returns {Promise<import("./paths.mjs").PathInspection>}
 */
export async function classifySource(target) {
  const inspection = await inspectPath(target.source);
  if (inspection.kind === "file" || inspection.kind === "directory") return inspection;
  if (inspection.kind === "absent") return inspection;
  if (inspection.kind === "broken-symlink") {
    throw new Error(`La fuente ${target.sourceRelative} es un enlace roto.`);
  }
  if (inspection.kind === "symlink") {
    throw new Error(`La fuente ${target.sourceRelative} no puede ser un enlace.`);
  }
  throw new Error(`La fuente ${target.sourceRelative} tiene un tipo no soportado.`);
}

/**
 * Clasifica el estado actual del target en el sistema de archivos frente a la fuente esperada.
 *
 * @param {{ target: string, targetRelative: string, mode: string, source: string }} target
 * @param {import("./paths.mjs").PathInspection} source
 * @returns {Promise<TargetClassification>}
 */
export async function classifyTarget(target, source) {
  const inspection = await inspectPath(target.target);
  if (inspection.kind === "absent") return { kind: "absent", inspection };
  if (inspection.kind === "broken-symlink") return { kind: "broken-symlink", inspection };
  if (inspection.kind === "symlink") {
    const expected = await realpath(target.source);
    return {
      kind: inspection.canonical === expected ? "managed-symlink" : "unmanaged-symlink",
      inspection,
    };
  }
  if (
    target.mode === "copy" &&
    inspection.kind === "file" &&
    (await isManagedCopy(target.target))
  ) {
    return { kind: "managed-copy", inspection };
  }
  return { kind: inspection.kind === "invalid" ? "invalid" : "manual", inspection, source };
}
