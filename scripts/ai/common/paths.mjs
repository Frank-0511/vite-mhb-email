import { lstat, readlink, realpath, stat } from "node:fs/promises";
import path from "node:path";
import { projectRoot } from "./constants.mjs";

/**
 * @typedef {Object} PathInspectionAbsent
 * @property {'absent'} kind
 * @property {string} path
 */

/**
 * @typedef {Object} PathInspectionFile
 * @property {'file'} kind
 * @property {string} path
 * @property {import("node:fs").Stats} current
 */

/**
 * @typedef {Object} PathInspectionDirectory
 * @property {'directory'} kind
 * @property {string} path
 * @property {import("node:fs").Stats} current
 */

/**
 * @typedef {Object} PathInspectionInvalid
 * @property {'invalid'} kind
 * @property {string} path
 * @property {import("node:fs").Stats} current
 */

/**
 * @typedef {Object} PathInspectionSymlink
 * @property {'symlink'} kind
 * @property {string} path
 * @property {import("node:fs").Stats} current
 * @property {string} link
 * @property {string} resolved
 * @property {string} canonical
 * @property {import("node:fs").Stats} canonicalState
 */

/**
 * @typedef {Object} PathInspectionBrokenSymlink
 * @property {'broken-symlink'} kind
 * @property {string} path
 * @property {import("node:fs").Stats} current
 * @property {string} link
 * @property {string} resolved
 */

/**
 * @typedef {PathInspectionAbsent | PathInspectionFile | PathInspectionDirectory | PathInspectionInvalid | PathInspectionSymlink | PathInspectionBrokenSymlink} PathInspection
 */

/**
 * Obtiene el estado (`Stats`) de un archivo o enlace mediante `lstat`.
 * Devuelve `null` si el archivo no existe.
 *
 * @param {string} targetPath
 * @returns {Promise<import("node:fs").Stats | null>}
 */
export async function pathState(targetPath) {
  try {
    return await lstat(targetPath);
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

/**
 * Valida que una ruta sea relativa, no vacía y no intente escapar mediante `..`.
 *
 * @param {unknown} value
 * @param {string} field
 * @returns {string} Ruta normalizada
 */
export function validateRelativePath(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${field} debe ser una ruta relativa no vacía.`);
  }

  const normalized = path.normalize(value);
  if (path.isAbsolute(value) || normalized === ".." || normalized.startsWith(`..${path.sep}`)) {
    throw new Error(`${field} debe permanecer dentro del repositorio: ${value}`);
  }

  return normalized;
}

/**
 * Afirma que la ruta hijo se encuentra contenida estrictamente dentro de la ruta padre.
 *
 * @param {string} parent
 * @param {string} child
 * @param {string} field
 * @returns {void}
 */
export function assertInside(parent, child, field) {
  const relative = path.relative(parent, child);
  if (relative === "" || relative === ".." || relative.startsWith(`..${path.sep}`)) {
    throw new Error(`${field} debe permanecer dentro de ${parent}: ${child}`);
  }
}

/**
 * Determina si la ruta hijo se encuentra contenida estrictamente dentro de la ruta padre.
 *
 * @param {string} parent
 * @param {string} child
 * @returns {boolean}
 */
export function isInside(parent, child) {
  const relative = path.relative(parent, child);
  return relative !== "" && relative !== ".." && !relative.startsWith(`..${path.sep}`);
}

/**
 * Inspecciona exhaustivamente el tipo de entrada en la ruta dada.
 *
 * @param {string} targetPath
 * @returns {Promise<PathInspection>}
 */
export async function inspectPath(targetPath) {
  const current = await pathState(targetPath);
  if (!current) return { kind: "absent", path: targetPath };
  if (current.isFile()) return { kind: "file", path: targetPath, current };
  if (current.isDirectory()) return { kind: "directory", path: targetPath, current };
  if (!current.isSymbolicLink()) return { kind: "invalid", path: targetPath, current };

  const link = await readlink(targetPath);
  const resolved = path.resolve(path.dirname(targetPath), link);
  try {
    const canonical = await realpath(resolved);
    const canonicalState = await stat(canonical);
    return {
      kind: "symlink",
      path: targetPath,
      current,
      link,
      resolved,
      canonical,
      canonicalState,
    };
  } catch (error) {
    if (error?.code === "ENOENT") {
      return { kind: "broken-symlink", path: targetPath, current, link, resolved };
    }
    throw error;
  }
}

/**
 * Verifica que todos los ancestros existentes de un target sean directorios.
 *
 * @param {{ target: string, targetRelative: string }} target
 * @returns {Promise<void>}
 */
export async function validateTargetParent(target) {
  let parent = path.dirname(target.target);
  while (parent !== projectRoot) {
    const parentState = await pathState(parent);
    if (parentState) {
      if (!parentState.isDirectory()) {
        throw new Error(
          `No se puede crear ${target.targetRelative}: su ruta padre no es un directorio.`,
        );
      }
      return;
    }
    parent = path.dirname(parent);
  }
}

/**
 * Obtiene la ruta canónica real si existe, o la ruta resuelta absoluta si no existe.
 *
 * @param {string} targetPath
 * @returns {Promise<string>}
 */
export async function canonicalPath(targetPath) {
  try {
    return await realpath(targetPath);
  } catch (error) {
    if (error?.code === "ENOENT") return path.resolve(targetPath);
    throw error;
  }
}
