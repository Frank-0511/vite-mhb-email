/**
 * @fileoverview Módulo de compilación de templates con Handlebars.
 */

import fs from "fs-extra";
import Handlebars from "handlebars";
import { c, paint } from "../shared/index.ts";

/**
 * Compila el HTML con Handlebars usando datos locales.
 */
export function compileHtmlWithData(htmlFile: string, data: Record<string, unknown>): string {
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
