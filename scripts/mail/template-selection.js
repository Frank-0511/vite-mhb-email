// @ts-check
/**
 * @fileoverview Lógica común para seleccionar templates buildeados y aplicarles datos de preview.
 */

import { buildIfNeeded } from "../build/build-helper.js";
import { getBuiltTemplates, readBuiltTemplate } from "../shared/built-templates.js";
import { c, paint } from "../shared/console.js";
import { applyHandlebars, getTemplateData } from "../shared/handlebars.js";
import { pickFromList } from "../shared/prompts.js";

/**
 * Asegura que existan templates, permite elegir uno y le aplica Handlebars.
 *
 * @param {import('readline').Interface} rl
 * @returns {Promise<{ chosen: string, html: string } | null>} Objeto con el template elegido y su HTML procesado, o null si se cancela.
 */
export async function selectBuiltTemplateWithData(rl) {
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

  // Aplicar datos Handlebars desde data.json
  const data = getTemplateData(chosen);
  html = applyHandlebars(html, data);

  return { chosen, html };
}
