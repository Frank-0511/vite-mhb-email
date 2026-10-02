/**
 * @fileoverview Funciones deterministas de hashing SHA-256 para archivos y árboles,
 * y validación de marcas de copias administradas.
 */

import { createHash } from "node:crypto";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

export const DEFAULT_GENERATED_MARKER = "portfolio-agents:generated";

export interface ExpectedCopyOptions {
  source: string;
  sourceRelative: string;
  target: string;
  targetRelative: string;
  marker?: string;
}

/**
 * Calcula el hash SHA-256 del contenido de un archivo.
 *
 * @param {string} filePath
 * @returns {Promise<string>} Hash en formato hexadecimal
 */
export async function hashFile(filePath: string): Promise<string> {
  const content = await readFile(filePath);
  return createHash("sha256").update(content).digest("hex");
}

/**
 * Calcula el hash SHA-256 determinista de una fuente (archivo individual o árbol de directorios).
 *
 * @param {string} source Ruta absoluta de la fuente
 * @returns {Promise<string>} Hash SHA-256 hexadecimal
 */
export async function hashSource(source: string): Promise<string> {
  const sourceStat = await stat(source);
  if (sourceStat.isFile()) return hashFile(source);
  if (!sourceStat.isDirectory()) {
    throw new Error(`Fuente no soportada: ${source}`);
  }

  const hash = createHash("sha256");

  async function visit(directory: string, prefix = ""): Promise<void> {
    const entries = await readdir(directory, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      const relative = path.posix.join(prefix, entry.name);
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        hash.update(`directory:${relative}\0`);
        await visit(absolute, relative);
      } else if (entry.isFile()) {
        hash.update(`file:${relative}\0`);
        hash.update(await readFile(absolute));
        hash.update("\0");
      } else {
        throw new Error(`La fuente contiene una entrada no soportada: ${relative}`);
      }
    }
  }
  await visit(source);
  return hash.digest("hex");
}

/**
 * Construye la etiqueta de comentario HTML que identifica una copia administrada.
 *
 * @param {string} sourceRelative
 * @param {string} hash
 * @param {string} [marker]
 * @returns {string}
 */
export function copyMarker(
  sourceRelative: string,
  hash: string,
  marker: string = DEFAULT_GENERATED_MARKER,
): string {
  return `<!-- ${marker} source=${sourceRelative} sha256=${hash} -->`;
}

/**
 * Genera el contenido esperado para un target en modo `copy`, anteponiendo el marcador.
 *
 * @param {ExpectedCopyOptions} target
 * @returns {Promise<string>}
 */
export async function expectedCopy(target: ExpectedCopyOptions): Promise<string> {
  const sourceStat = await stat(target.source);
  if (!sourceStat.isFile()) {
    throw new Error(
      `El modo copy solo admite archivos; use symlink para ${target.sourceRelative}.`,
    );
  }
  if (path.extname(target.target).toLowerCase() !== ".md") {
    throw new Error(
      `El modo copy requiere un target Markdown para conservar una marca válida: ${target.targetRelative}.`,
    );
  }

  const sourceContent = await readFile(target.source, "utf8");
  const hash = await hashSource(target.source);
  return `${copyMarker(target.sourceRelative, hash, target.marker ?? DEFAULT_GENERATED_MARKER)}\n${sourceContent}`;
}

/**
 * Verifica si un archivo en disco corresponde a una copia administrada generada.
 *
 * @param {string} targetPath
 * @param {string} [marker]
 * @returns {Promise<boolean>}
 */
export async function isManagedCopy(
  targetPath: string,
  marker: string = DEFAULT_GENERATED_MARKER,
): Promise<boolean> {
  let fileStat;
  try {
    fileStat = await stat(targetPath);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return false;
    }
    throw error;
  }
  if (!fileStat.isFile()) return false;
  const firstLine = (await readFile(targetPath, "utf8")).split(/\r?\n/, 1)[0];
  return firstLine.startsWith(`<!-- ${marker} source=`) && firstLine.endsWith(" -->");
}
