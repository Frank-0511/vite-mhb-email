/**
 * @fileoverview Renderización PNG con el navegador gestionado por Puppeteer.
 */

import { pathToFileURL } from "node:url";
import puppeteer from "puppeteer";
import { c, paint } from "../shared/console.js";

/**
 * Exporta una captura PNG usando el navegador descargado por Puppeteer.
 *
 * @param {string} htmlFile - Ruta del archivo HTML
 * @param {string} pngOut - Ruta de salida del PNG
 * @returns {Promise<boolean>} true si tuvo éxito
 */
export async function tryPuppeteer(htmlFile, pngOut) {
  let browser;

  try {
    console.log(paint(c.dim, "  Renderizando con el navegador incluido de Puppeteer…"));

    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 620, height: 800, deviceScaleFactor: 1 });
    await page.goto(pathToFileURL(htmlFile).href, { waitUntil: "networkidle0" });
    await page.screenshot({ path: pngOut, fullPage: true, type: "png" });

    return true;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.log(paint(c.dim, `    (Puppeteer falló: ${errorMsg})`));
    return false;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
