/**
 * @fileoverview Renderización PNG con el navegador gestionado por Puppeteer.
 */

import { pathToFileURL } from "node:url";
import puppeteer, { type Browser } from "puppeteer";
import { c, paint } from "../shared/index.ts";

/**
 * Describe la recuperación disponible cuando Puppeteer no puede iniciar.
 */
export function getPuppeteerLaunchError(templateName: string): string {
  return [
    "Puppeteer no pudo iniciar el navegador incluido. Ejecuta bun install y revisa sus errores.",
    `Alternativa: abre dist/${templateName}.html en el navegador y toma una captura manual.`,
  ].join(" ");
}

/**
 * Opciones para configurar el renderizador de Puppeteer.
 */
export interface PuppeteerRendererOptions {
  launch?: typeof puppeteer.launch;
}

/**
 * Firma de función para renderizar HTML a PNG con Puppeteer.
 */
export type PuppeteerRenderer = (htmlFile: string, pngOut: string) => Promise<boolean>;

/**
 * Crea un renderizador PNG usando el navegador descargado por Puppeteer.
 *
 * La inyección de `launch` permite caracterizar errores de arranque sin requerir
 * un navegador real en la suite.
 */
export function createPuppeteerRenderer(options: PuppeteerRendererOptions = {}): PuppeteerRenderer {
  const { launch = puppeteer.launch } = options;
  return async function tryPuppeteer(htmlFile: string, pngOut: string): Promise<boolean> {
    let browser: Browser | undefined;

    try {
      console.log(paint(c.dim, "  Renderizando con el navegador incluido de Puppeteer…"));

      browser = await launch({
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
      if (browser) await browser.close();
    }
  };
}

/** Exporta una captura PNG usando el navegador gestionado por Puppeteer. */
export const tryPuppeteer = createPuppeteerRenderer();
