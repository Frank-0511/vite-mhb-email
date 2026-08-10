/**
 * @fileoverview Orquestador principal para exportación de screenshots.
 * Coordina el flujo: compilación → renderización → limpieza
 */

import fs from "fs-extra";
import { c, paint } from "../shared/console.js";
import { compileHtmlWithData } from "./compilers.js";
import {
  cleanupTempFile,
  createTempHtmlFile,
  ensureScreenshotDir,
  getOutputPaths,
} from "./file-manager.js";
import { tryPuppeteer } from "./renderers.js";

/**
 * Imprime mensaje de éxito.
 * @param {string} outPath - Ruta del archivo generado
 */
function printSuccess(outPath) {
  const fileSize = fs.statSync(outPath).size;
  const sizeKB = (fileSize / 1024).toFixed(2);

  console.log(paint(c.green + c.bold, `  ✅ Exportado exitosamente`));
  console.log(paint(c.cyan, `  📁 ${outPath}`));
  console.log(paint(c.dim, `  📊 Tamaño: ${sizeKB} KB\n`));
}

/**
 * Exporta un screenshot PNG de un template de email.
 * @param {string} htmlFile - Ruta del HTML compilado en dist/
 * @param {string} templateName - Nombre del template
 * @param {object} templateData - Datos para compilar con Handlebars
 * @returns {Promise<void>}
 */
export async function exportScreenshot(htmlFile, templateName, templateData) {
  let tempHtmlFile;
  try {
    console.log(paint(c.cyan + c.bold, `\n  📸 Exportando ${templateName} como PNG\n`));

    // Preparar directorios y rutas
    await ensureScreenshotDir();
    const { png: outputPath } = getOutputPaths(templateName);

    // Compilar HTML con Handlebars usando datos locales
    console.log(paint(c.dim, "  Compilando template con datos…"));
    const compiledHtml = compileHtmlWithData(htmlFile, templateData);
    tempHtmlFile = await createTempHtmlFile(compiledHtml, templateName);

    // Puppeteer incluye una versión compatible de Chrome al instalar el proyecto.
    if (await tryPuppeteer(tempHtmlFile, outputPath)) {
      await cleanupTempFile(tempHtmlFile);
      printSuccess(outputPath);
      return;
    }

    throw new Error(
      "Puppeteer no pudo iniciar el navegador incluido. Ejecuta bun install y revisa sus errores.",
    );
  } catch (error) {
    if (tempHtmlFile) await cleanupTempFile(tempHtmlFile);
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(paint(c.red + c.bold, "❌ Error:") + " " + paint(c.dim, errorMsg));
    console.log(
      paint(c.yellow, "\n  💡 Alternativa:"),
      paint(c.dim, `Abre dist/${templateName}.html en el navegador`),
    );
    console.log(paint(c.dim, "     y usa Ctrl+Shift+S para captura de pantalla.\n"));
    process.exit(1);
  }
}
