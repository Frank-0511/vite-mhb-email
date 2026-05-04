// @ts-check
/**
 * @fileoverview Helpers para interactividad CLI: prompts y selección de opciones.
 */

import { c, paint } from "./console.js";

/**
 * Muestra una pregunta al usuario y devuelve su respuesta.
 * Si el usuario no escribe nada, devuelve `defaultValue`.
 *
 * @param {import('readline').Interface} rl
 * @param {string} question
 * @param {string} [defaultValue=""]
 * @returns {Promise<string>}
 */
export function prompt(rl, question, defaultValue = "") {
  const hint = defaultValue ? paint(c.dim, ` (${defaultValue})`) : "";
  return new Promise((resolve) => {
    rl.question(`  ${question}${hint}: `, (answer) => {
      const val = answer.trim();
      resolve(val !== "" ? val : defaultValue);
    });
  });
}

/**
 * Muestra una lista numerada y espera que el usuario elija un ítem válido.
 *
 * @param {import('readline').Interface} rl
 * @param {string[]} items
 * @returns {Promise<string>}
 */
export async function pickFromList(rl, items) {
  items.forEach((item, i) => {
    console.log(`  ${paint(c.cyan + c.bold, `[${i + 1}]`)} ${paint(c.cyan, item)}`);
  });
  console.log();

  while (true) {
    const raw = await prompt(rl, paint(c.cyan + c.bold, "→ Elegí un número"));
    const idx = parseInt(raw, 10) - 1;
    if (!isNaN(idx) && idx >= 0 && idx < items.length) return items[idx];
    console.log(paint(c.red, `  ❌ Opción inválida. Ingresá un número entre 1 y ${items.length}.`));
  }
}
