/**
 * @fileoverview Módulo de renderización a imagen usando diferentes métodos.
 */

import fs from "fs-extra";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import { c, paint } from "../utils.js";

const execAsync = promisify(exec);

/**
 * Intenta exportar usando wkhtmltoimage.
 * @param {string} htmlFile - Ruta del archivo HTML
 * @param {string} outPath - Ruta de salida del PNG
 * @returns {Promise<boolean>} true si tuvo éxito
 */
export async function tryWkhtmltoimage(htmlFile, outPath) {
  try {
    console.log(paint(c.dim, "  Intentando con wkhtmltoimage…"));

    const cmd = `wkhtmltoimage --width 620 file://${htmlFile} ${outPath}`;
    await execAsync(cmd);
    return true;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message.split("\n")[0] : String(error);
    console.log(paint(c.dim, `    (wkhtmltoimage falló: ${errorMsg})`));
    return false;
  }
}

/**
 * Exporta usando puppeteer-core.
 * @param {string} htmlFile - Ruta del archivo HTML
 * @param {string} pdfOut - Ruta de salida del PDF
 * @returns {Promise<boolean>} true si tuvo éxito
 */
export async function tryPuppeteer(htmlFile, pdfOut) {
  try {
    console.log(paint(c.dim, "  Intentando con puppeteer-core…"));

    const puppeteer = await import("puppeteer-core");

    const executablePath = await findChrome();
    if (!executablePath) {
      return false;
    }

    const browser = await puppeteer.default.launch({
      executablePath,
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.goto(`file://${htmlFile}`, { waitUntil: "networkidle0" });
    await page.pdf({ path: pdfOut, format: "A4" });
    await browser.close();

    return true;
  } catch {
    return false;
  }
}

/**
 * Convierte PDF a PNG usando ImageMagick.
 * @param {string} pdfFile - Ruta del archivo PDF
 * @param {string} pngOut - Ruta de salida del PNG
 * @returns {Promise<boolean>} true si tuvo éxito
 */
export async function convertPdfToPng(pdfFile, pngOut) {
  try {
    console.log(paint(c.dim, "  Convirtiendo PDF → PNG…"));
    const cmd = `convert -density 150 -quality 85 "${pdfFile}" "${pngOut}"`;
    await execAsync(cmd);
    return true;
  } catch {
    return false;
  }
}

/**
 * Busca el ejecutable de Chrome/Chromium en el sistema.
 * @returns {Promise<string | null>} Ruta del ejecutable o null
 */
function findChrome() {
  const possiblePaths = [
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/snap/bin/chromium",
  ];

  for (const path of possiblePaths) {
    if (fs.existsSync(path)) {
      return path;
    }
  }
  return null;
}
