// @ts-check
/**
 * @fileoverview Lectura y gestión de templates HTML buildeados en dist/
 */

import fs from "node:fs";
import path from "node:path";
import { getProjectPaths } from "./paths.js";

/**
 * Devuelve los archivos `.html` disponibles en `dist/`, ordenados.
 * @returns {string[]}
 */
export function getBuiltTemplates() {
  const paths = getProjectPaths(process.cwd());
  const distDir = paths.distDir;
  if (!fs.existsSync(distDir)) return [];
  return fs
    .readdirSync(distDir)
    .filter((f) => f.endsWith(".html"))
    .sort();
}

/**
 * Lee el HTML de un template buildeado.
 * @param {string} filename - Nombre de archivo (ej. "welcome.html")
 * @returns {string}
 */
export function readBuiltTemplate(filename) {
  const paths = getProjectPaths(process.cwd());
  return fs.readFileSync(path.resolve(paths.distDir, filename), "utf-8");
}
