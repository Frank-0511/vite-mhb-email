/**
 * @fileoverview Helpers Handlebars: carga de datos y aplicación de variables a templates.
 */

import Handlebars from "handlebars";
import fs from "node:fs";
import { getProjectPaths } from "../io/paths.ts";

/**
 * Carga el data.json correspondiente a un template.
 * @param {string} templateName - Nombre del template (ej: "welcome.html")
 * @returns {Record<string, unknown>} Datos del template o objeto vacío si no existe
 */
export function getTemplateData(templateName: string): Record<string, unknown> {
  try {
    const baseName = templateName.replace(".html", "");
    const paths = getProjectPaths(process.cwd());
    const dataPath = paths.templateData(baseName);
    const content = fs.readFileSync(dataPath, "utf-8");
    return JSON.parse(content) as Record<string, unknown>;
  } catch {
    // Silenciosamente ignorar si no existe el archivo
    return {};
  }
}

/**
 * Procesa variables Handlebars en el HTML usando un objeto de datos.
 * Requiere la librería `handlebars`.
 * @param {string} html - HTML con variables Handlebars
 * @param {Record<string, unknown>} data - Datos para reemplazar
 * @returns {string} HTML procesado
 */
export function applyHandlebars(html: string, data: Record<string, unknown>): string {
  try {
    const template = Handlebars.compile(html);
    return template(data);
  } catch {
    // Si hay error, devolver el HTML sin procesar
    return html;
  }
}

/**
 * Reemplaza placeholders legacy de SendGrid (`-variable-`) usando datos de preview.
 *
 * Esta transformación es para previews locales y flujos que aplican datos de prueba;
 * el build final debe preservar estos placeholders para SendGrid Legacy.
 *
 * @param {string} html - HTML renderizado que puede contener placeholders legacy.
 * @param {unknown} [data] - Datos de preview disponibles para reemplazo.
 * @returns {string} HTML con placeholders legacy reemplazados cuando exista la llave.
 */
export function applyLegacySendGridSubstitutions(html: string, data?: unknown): string {
  if (!data || typeof data !== "object") return html;
  const dataObj = data as Record<string, unknown>;

  return html.replace(/-([A-Za-z0-9_]+)-/g, (match, key) => {
    if (!Object.hasOwn(dataObj, key)) return match;

    const value = dataObj[key];
    if (value === null || value === undefined || typeof value === "object") return match;

    return Handlebars.escapeExpression(String(value));
  });
}
