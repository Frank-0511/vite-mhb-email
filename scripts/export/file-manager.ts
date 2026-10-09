/**
 * @fileoverview Módulo de gestión de archivos temporales y directorios.
 */

import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Crea un archivo temporal con el HTML compilado.
 */
export async function createTempHtmlFile(
  compiledHtml: string,
  templateName: string,
): Promise<string> {
  const tempDir = path.join(process.cwd(), ".temp-screenshots");
  await mkdir(tempDir, { recursive: true });

  const tempFile = path.join(tempDir, `${templateName}-compiled.html`);
  await writeFile(tempFile, compiledHtml);

  return tempFile;
}

/**
 * Limpia un archivo temporal.
 */
export async function cleanupTempFile(tempFile: string): Promise<void> {
  try {
    await rm(tempFile, { recursive: true, force: true });
  } catch {
    // Ignorar errores de limpieza
  }
}

/**
 * Asegura que existe el directorio de screenshots.
 */
export async function ensureScreenshotDir(): Promise<string> {
  const screenshotDir = path.join(process.cwd(), "screenshots");
  await mkdir(screenshotDir, { recursive: true });
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
