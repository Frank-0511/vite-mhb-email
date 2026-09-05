import { createHash } from "node:crypto";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { generatedMarker, projectRoot } from "./constants.mjs";
import { pathState } from "./paths.mjs";

/**
 * Calcula el hash SHA-256 del contenido de un archivo.
 *
 * @param {string} filePath
 * @returns {Promise<string>} Hash en formato hexadecimal
 */
export async function hashFile(filePath) {
  const content = await readFile(filePath);
  return createHash("sha256").update(content).digest("hex");
}

/**
 * Calcula el hash SHA-256 determinista de una fuente (archivo individual o árbol de directorios).
 *
 * @param {string} source Ruta absoluta de la fuente
 * @returns {Promise<string>} Hash SHA-256 hexadecimal
 */
export async function hashSource(source) {
  const sourceStat = await stat(source);
  if (sourceStat.isFile()) return hashFile(source);
  if (!sourceStat.isDirectory()) {
    throw new Error(`Fuente no soportada: ${path.relative(projectRoot, source)}`);
  }

  const hash = createHash("sha256");
  /**
   * @param {string} directory
   * @param {string} [prefix]
   */
  async function visit(directory, prefix = "") {
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
 * @returns {string}
 */
export function copyMarker(sourceRelative, hash) {
  return `<!-- ${generatedMarker} source=${sourceRelative} sha256=${hash} -->`;
}

/**
 * Genera el contenido esperado para un target en modo `copy`, anteponiendo el marcador.
 *
 * @param {{ source: string, sourceRelative: string, target: string, targetRelative: string }} target
 * @returns {Promise<string>}
 */
export async function expectedCopy(target) {
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
  return `${copyMarker(target.sourceRelative, hash)}\n${sourceContent}`;
}

/**
 * Verifica si un archivo en disco corresponde a una copia administrada generada.
 *
 * @param {string} targetPath
 * @returns {Promise<boolean>}
 */
export async function isManagedCopy(targetPath) {
  const targetState = await pathState(targetPath);
  if (!targetState?.isFile()) return false;
  const firstLine = (await readFile(targetPath, "utf8")).split(/\r?\n/, 1)[0];
  return firstLine.startsWith(`<!-- ${generatedMarker} source=`) && firstLine.endsWith(" -->");
}
