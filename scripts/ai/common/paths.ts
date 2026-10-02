import type { Stats } from "node:fs";
import { lstat, readlink, realpath, stat } from "node:fs/promises";
import path from "node:path";
import { projectRoot } from "./constants.ts";
import { isEnoent } from "./errors.ts";
import type { PathInspection } from "./types.ts";

/**
 * Obtiene el estado (`Stats`) de un archivo o enlace mediante `lstat`.
 * Devuelve `null` si el archivo no existe.
 *
 * @param {string} targetPath
 * @returns {Promise<Stats | null>}
 */
export async function pathState(targetPath: string): Promise<Stats | null> {
  try {
    return await lstat(targetPath);
  } catch (error) {
    if (isEnoent(error)) return null;
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
export function validateRelativePath(value: unknown, field: string): string {
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
export function assertInside(parent: string, child: string, field: string): void {
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
export function isInside(parent: string, child: string): boolean {
  const relative = path.relative(parent, child);
  return relative !== "" && relative !== ".." && !relative.startsWith(`..${path.sep}`);
}

/**
 * Inspecciona exhaustivamente el tipo de entrada en la ruta dada.
 *
 * @param {string} targetPath
 * @returns {Promise<PathInspection>}
 */
export async function inspectPath(targetPath: string): Promise<PathInspection> {
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
    if (isEnoent(error)) {
      return { kind: "broken-symlink", path: targetPath, current, link, resolved };
    }
    throw error;
  }
}

/**
 * Verifica que todos los ancestros existentes de un target sean directorios.
 *
 * @param {{ target: string; targetRelative: string }} target
 * @returns {Promise<void>}
 */
export async function validateTargetParent(target: {
  target: string;
  targetRelative: string;
}): Promise<void> {
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
export async function canonicalPath(targetPath: string): Promise<string> {
  try {
    return await realpath(targetPath);
  } catch (error) {
    if (isEnoent(error)) return path.resolve(targetPath);
    throw error;
  }
}
