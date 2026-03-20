/**
 * @fileoverview Módulo de compilación de templates con Handlebars.
 */

import fs from "fs-extra";
import Handlebars from "handlebars";
import { c, paint } from "../utils.js";

/**
 * Compila el HTML con Handlebars usando datos locales.
 * @param {string} htmlFile - Ruta del archivo HTML a compilar
 * @param {object} data - Datos para pasar a Handlebars
 * @returns {string} HTML compilado
 */
export function compileHtmlWithData(htmlFile, data) {
  try {
    const htmlContent = fs.readFileSync(htmlFile, "utf-8");
    const template = Handlebars.compile(htmlContent);
    const compiledHtml = template(data);
    return compiledHtml;
  } catch {
    console.log(paint(c.dim, `    (Advertencia: No se pudo compilar con Handlebars)`));
    return fs.readFileSync(htmlFile, "utf-8");
  }
}
