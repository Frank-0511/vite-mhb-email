/**
 * @fileoverview Módulo de gestión de archivos temporales y directorios.
 */

import fs from "fs-extra";
import path from "node:path";

/**
 * Crea un archivo temporal con el HTML compilado.
 */
export async function createTempHtmlFile(
  compiledHtml: string,
  templateName: string,
): Promise<string> {
  const tempDir = path.join(process.cwd(), ".temp-screenshots");
  await fs.ensureDir(tempDir);

  const tempFile = path.join(tempDir, `${templateName}-compiled.html`);
  await fs.writeFile(tempFile, compiledHtml);

  return tempFile;
}

/**
 * Limpia un archivo temporal.
 */
export async function cleanupTempFile(tempFile: string): Promise<void> {
  try {
    await fs.remove(tempFile);
  } catch {
    // Ignorar errores de limpieza
  }
}

/**
 * Asegura que existe el directorio de screenshots.
 */
export async function ensureScreenshotDir(): Promise<string> {
  const screenshotDir = path.join(process.cwd(), "screenshots");
  await fs.ensureDir(screenshotDir);
  return screenshotDir;
}

/**
 * Rutas de archivos de salida para screenshots y PDFs.
 */
export interface OutputPaths {
  png: string;
  pdf: string;
}

/**
 * Obtiene la ruta del archivo PNG de salida.
 */
export function getOutputPaths(templateName: string): OutputPaths {
  const screenshotDir = path.join(process.cwd(), "screenshots");
  return {
    png: path.join(screenshotDir, `${templateName}.png`),
    pdf: path.join(screenshotDir, `${templateName}.pdf`),
  };
}
