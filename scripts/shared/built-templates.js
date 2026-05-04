// @ts-check
/**
 * @fileoverview Lectura y gestión de templates HTML buildeados en dist/
 */

import fs from "node:fs";
import path from "node:path";

/**
 * Devuelve los archivos `.html` disponibles en `dist/`, ordenados.
 * @returns {string[]}
 */
export function getBuiltTemplates() {
  const distDir = path.resolve(process.cwd(), "dist");
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
  return fs.readFileSync(path.resolve(process.cwd(), "dist", filename), "utf-8");
}
