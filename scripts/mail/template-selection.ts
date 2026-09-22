/**
 * @fileoverview Lógica común para seleccionar templates buildeados y aplicarles datos de preview.
 */

import type { Interface } from "readline";
import { buildIfNeeded } from "../build/build-helper.ts";
import {
  applyHandlebars,
  applyLegacySendGridSubstitutions,
  c,
  getBuiltTemplates,
  getTemplateData,
  paint,
  pickFromList,
  readBuiltTemplate,
} from "../shared/index.ts";

/**
 * Resultado de la selección de template con sus datos aplicados.
 */
export interface SelectedTemplateWithData {
  chosen: string;
  html: string;
}

/**
 * Asegura que existan templates, permite elegir uno y le aplica Handlebars.
 *
 * @param rl - Interfaz readline para interacción con el usuario.
 * @returns Objeto con el template elegido y su HTML procesado, o null si se cancela.
 */
export async function selectBuiltTemplateWithData(
  rl: Interface,
): Promise<SelectedTemplateWithData | null> {
  let templates = getBuiltTemplates();
  if (templates.length === 0) {
    const built = await buildIfNeeded(rl);
    if (!built) return null;
    templates = getBuiltTemplates();
    if (templates.length === 0) {
      console.log(paint(c.red, "\n  ❌ El build no generó templates en dist/.\n"));
      return null;
    }
  }

  console.log(paint(c.bold, "\n  Templates disponibles:\n"));
  const chosen = await pickFromList(rl, templates);
  let html = readBuiltTemplate(chosen);

  // Aplicar datos de preview sobre ambos formatos:
  // - Handlebars local.
  // - Placeholders legacy SendGrid: -variable-
  const data = getTemplateData(chosen);
  html = applyHandlebars(html, data);
  html = applyLegacySendGridSubstitutions(html, data);

  return { chosen, html };
}
