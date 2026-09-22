/**
 * @fileoverview Helpers para interactividad CLI: prompts y selección de opciones.
 */

import type { Interface as ReadlineInterface } from "node:readline";
import { c, paint } from "./console.ts";

export interface PromptInterface {
  question(query: string, callback: (answer: string) => void): void;
}

export type PromptSource =
  | ReadlineInterface
  | PromptInterface
  | { question: (...args: unknown[]) => unknown };

/**
 * Muestra una pregunta al usuario y devuelve su respuesta.
 * Si el usuario no escribe nada, devuelve `defaultValue`.
 *
 * @param {PromptSource} rl
 * @param {string} question
 * @param {string} [defaultValue=""]
 * @returns {Promise<string>}
 */
export function prompt(
  rl: PromptSource,
  question: string,
  defaultValue: string = "",
): Promise<string> {
  const hint = defaultValue ? paint(c.dim, ` (${defaultValue})`) : "";
  return new Promise((resolve) => {
    (rl as PromptInterface).question(`  ${question}${hint}: `, (answer: string) => {
      const val = typeof answer === "string" ? answer.trim() : "";
      resolve(val !== "" ? val : defaultValue);
    });
  });
}

/**
 * Muestra una lista numerada y espera que el usuario elija un ítem válido.
 *
 * @param {PromptSource} rl
 * @param {string[]} items
 * @returns {Promise<string>}
 */
export async function pickFromList(rl: PromptSource, items: string[]): Promise<string> {
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
