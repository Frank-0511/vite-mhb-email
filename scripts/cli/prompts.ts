/**
 * @fileoverview Prompts interactivos para la CLI con readline.
 */

import type { Interface } from "readline";
import { c, paint } from "../shared/index.ts";

export interface ArchetypePromptItem {
  id: string;
  name?: string;
  description?: string;
  category?: string;
}

/**
 * Solicita al usuario que ingrese el nombre de un nuevo template.
 */
export function askTemplateName(rl: Interface): Promise<string> {
  return new Promise((resolve) => {
    rl.question(paint(c.magenta, "  ✨ Nombre del nuevo template: "), (answer) =>
      resolve(answer.trim()),
    );
  });
}

/**
 * Pregunta al usuario si desea crear el template desde cero o basarse en un template existente.
 */
export function askCreationMode(rl: Interface): Promise<"zero" | "template"> {
  return new Promise((resolve) => {
    console.log(paint(c.cyan + c.bold, "  ¿Cómo deseas crear el template?"));
    console.log(paint(c.white, "    [1] Desde cero (plantilla en blanco)"));
    console.log(paint(c.white, "    [2] Basado en un template/arquetipo existente"));
    rl.question(
      paint(c.cyan + c.bold, "\n  → Selecciona una opción [1/2] (default 1): "),
      (answer) => {
        const trimmed = answer.trim();
        if (trimmed === "2") {
          resolve("template");
        } else {
          resolve("zero");
        }
      },
    );
  });
}

/**
 * Muestra la lista dinámica de templates disponibles y solicita al usuario seleccionar uno.
 */
export function askSelectArchetype(
  rl: Interface,
  availableArchetypes: readonly ArchetypePromptItem[] = [],
): Promise<string | null> {
  if (!availableArchetypes || availableArchetypes.length === 0) {
    console.log(
      paint(c.yellow, "  ⚠️ No hay templates disponibles en src/emails/partials/templates.\n"),
    );
    return Promise.resolve(null);
  }

  console.log(paint(c.green + c.bold, "\n  📐 Templates disponibles:\n"));
  for (let i = 0; i < availableArchetypes.length; i++) {
    const num = paint(c.green + c.bold, `  [${i + 1}]`);
    const a = availableArchetypes[i];
    const category = a.category ? ` (${a.category})` : "";
    console.log(
      `  ${num} ${paint(c.white + c.bold, a.id)} — ${a.name || a.id}${paint(c.dim, category)}`,
    );
    if (a.description) {
      console.log(`       ${paint(c.dim, a.description)}`);
    }
  }

  return new Promise((resolve) => {
    rl.question(
      paint(c.cyan + c.bold, "\n  → Selecciona el número o nombre del template: "),
      (answer) => {
        const trimmed = answer.trim();
        if (!trimmed) {
          resolve(null);
          return;
        }

        const idx = parseInt(trimmed, 10) - 1;
        if (idx >= 0 && idx < availableArchetypes.length) {
          resolve(availableArchetypes[idx].id);
          return;
        }

        const byName = availableArchetypes.find(
          (a) =>
            a.id.toLowerCase() === trimmed.toLowerCase() ||
            (a.name && a.name.toLowerCase() === trimmed.toLowerCase()),
        );
        if (byName) {
          resolve(byName.id);
          return;
        }

        console.log(paint(c.red, "  ❌ Selección inválida.\n"));
        resolve(null);
      },
    );
  });
}

/**
 * Solicita al usuario un arquetipo opcional de Atomic Design (compatibilidad).
 */
export function askArchetype(
  rl: Interface,
  availableArchetypes: readonly string[] = [],
): Promise<string> {
  return new Promise((resolve) => {
    const hint =
      availableArchetypes.length > 0
        ? ` (disponibles: ${availableArchetypes.join(", ")}; o Enter para default)`
        : " (o Enter para default)";
    rl.question(paint(c.dim, `  📐 Arquetipo base${hint}: `), (answer) => resolve(answer.trim()));
  });
}

/**
 * Solicita una opción al usuario en el menú principal.
 */
export function askMenuChoice(rl: Interface): Promise<string> {
  return new Promise((resolve) => {
    rl.question(paint(c.cyan + c.bold, "  → "), (answer) => resolve(answer.trim()));
  });
}
