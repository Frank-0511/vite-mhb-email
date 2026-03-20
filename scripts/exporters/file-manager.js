/**
 * @fileoverview Módulo de gestión de archivos temporales y directorios.
 */

import fs from "fs-extra";
import path from "node:path";

/**
 * Crea un archivo temporal con el HTML compilado.
 * @param {string} compiledHtml - Contenido HTML compilado
 * @param {string} templateName - Nombre del template
 * @returns {Promise<string>} Ruta del archivo temporal
 */
export async function createTempHtmlFile(compiledHtml, templateName) {
  const tempDir = path.join(process.cwd(), ".temp-screenshots");
  await fs.ensureDir(tempDir);

  const tempFile = path.join(tempDir, `${templateName}-compiled.html`);
  await fs.writeFile(tempFile, compiledHtml);

  return tempFile;
}

/**
 * Limpia un archivo temporal.
 * @param {string} tempFile - Ruta del archivo temporal
 * @returns {Promise<void>}
 */
export async function cleanupTempFile(tempFile) {
  try {
    await fs.remove(tempFile);
  } catch {
    // Ignorar errores de limpieza
  }
}

/**
 * Asegura que existe el directorio de screenshots.
 * @returns {Promise<string>} Ruta del directorio de screenshots
 */
export async function ensureScreenshotDir() {
  const screenshotDir = path.join(process.cwd(), "screenshots");
  await fs.ensureDir(screenshotDir);
  return screenshotDir;
}

/**
 * Obtiene la ruta del archivo PNG de salida.
 * @param {string} templateName - Nombre del template
 * @returns {string} Ruta del PNG de salida
 */
export function getOutputPaths(templateName) {
  const screenshotDir = path.join(process.cwd(), "screenshots");
  return {
    png: path.join(screenshotDir, `${templateName}.png`),
    pdf: path.join(screenshotDir, `${templateName}.pdf`),
  };
}
