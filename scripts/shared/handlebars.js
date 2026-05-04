// @ts-check
/**
 * @fileoverview Helpers Handlebars: carga de datos y aplicación de variables a templates.
 */

import Handlebars from "handlebars";
import fs from "node:fs";
import { getProjectPaths } from "./paths.js";

/**
 * Carga el data.json correspondiente a un template.
 * @param {string} templateName - Nombre del template (ej: "welcome.html")
 * @returns {Object} Datos del template o objeto vacío si no existe
 */
export function getTemplateData(templateName) {
  try {
    const baseName = templateName.replace(".html", "");
    const paths = getProjectPaths(process.cwd());
    const dataPath = paths.templateData(baseName);
    const content = fs.readFileSync(dataPath, "utf-8");
    return JSON.parse(content);
  } catch {
    // Silenciosamente ignorar si no existe el archivo
    return {};
  }
}

/**
 * Procesa variables Handlebars en el HTML usando un objeto de datos.
 * Requiere la librería `handlebars`.
 * @param {string} html - HTML con variables Handlebars
 * @param {Object} data - Datos para reemplazar
 * @returns {string} HTML procesado
 */
export function applyHandlebars(html, data) {
  try {
    const template = Handlebars.compile(html);
    return template(data);
  } catch {
    // Si hay error, devolver el HTML sin procesar
    return html;
  }
}
