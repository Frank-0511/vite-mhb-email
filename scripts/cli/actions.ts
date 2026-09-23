/**
 * @fileoverview Acciones del menú del CLI.
 * Cada acción corresponde a una opción del menú.
 */

import type { Interface } from "readline";
import { buildIfNeeded } from "../build/build-helper.ts";
import { getAvailableArchetypes } from "../generators/archetypes.ts";
import { sendToInbox } from "../mail/send-inbox.ts";
import { sendToMailtester } from "../mail/send-mailtester.ts";
import { sendTemplate } from "../mail/send-mailtrap.ts";
import { c, getBuiltTemplates, paint } from "../shared/index.ts";
import { run } from "./process-runner.ts";
import { askCreationMode, askSelectArchetype, askTemplateName } from "./prompts.ts";
import { askSelectTemplate } from "./template-prompts.ts";
import { clearScreen } from "./ui.ts";

/**
 * Acción [1]: Levantar servidor de desarrollo
 */
export async function devServer(): Promise<void> {
  clearScreen();
  console.log(paint(c.green + c.bold, "\n  ⚡ Iniciando servidor de desarrollo…\n"));
  await run("bun", ["run", "dev"]);
}

/**
 * Acción [2]: Buildear para producción
 */
export async function buildProd(): Promise<void> {
  clearScreen();
  console.log(paint(c.yellow + c.bold, "\n  📦 Buildeando para producción…\n"));
  const code = await run("bun", ["run", "build"]);
  if (code === 0) {
    console.log(paint(c.green + c.bold, "\n  ✅ Build completado exitosamente.\n"));
  } else {
    console.log(paint(c.red + c.bold, `\n  ❌ Build falló con código ${code}.\n`));
  }
}

/**
 * Acción [3]: Crear nuevo template
 */
export async function createTemplate(rl: Interface): Promise<void> {
  clearScreen();
  console.log(paint(c.magenta + c.bold, "\n  ✨ Crear nuevo template\n"));

  const name = await askTemplateName(rl);
  if (!name) {
    console.log(paint(c.red, "\n  ❌ El nombre no puede estar vacío.\n"));
    return;
  }

  console.log();
  const mode = await askCreationMode(rl);
  let archetype = "";

  if (mode === "template") {
    const availableArchetypes = getAvailableArchetypes(process.cwd());
    const selected = await askSelectArchetype(rl, availableArchetypes);
    if (!selected) {
      console.log(paint(c.yellow, "  ⚠️ Creación cancelada o arquetipo no seleccionado.\n"));
      return;
    }
    archetype = selected;
  }

  console.log();
  const args = ["scripts/generators/generate-email.ts", name];
  if (archetype) {
    args.push(archetype);
  }

  const code = await run("bun", args);
  if (code !== 0) {
    console.log(paint(c.red, `\n  ❌ Error al crear el template (código ${code}).\n`));
  }
}

/**
 * Acción [4]: Enviar template a Mailtrap
 */
export async function sendMailtrap(rl: Interface): Promise<void> {
  clearScreen();
  await sendTemplate(rl);
}

/**
 * Acción [5]: Testear con Mail-Tester (Gmail)
 */
export async function testMailTester(rl: Interface): Promise<void> {
  clearScreen();
  await sendToMailtester(rl);
}

/**
 * Acción [6]: Enviar a bandeja real (Gmail / Outlook / Apple)
 */
export async function sendInbox(rl: Interface): Promise<void> {
  clearScreen();
  await sendToInbox(rl);
}

/**
 * Acción [7]: Exportar template como PNG
 */
export async function exportScreenshot(rl: Interface): Promise<void> {
  clearScreen();
  console.log(paint(c.green + c.bold, "\n  📸 Exportar template como PNG\n"));

  const templateName = await askSelectTemplate(rl);
  if (!templateName) {
    return;
  }

  console.log();
  const code = await run("bun", ["scripts/export/export-screenshot.ts", templateName]);
  if (code !== 0) {
    console.log(paint(c.red, `\n  ❌ Error al exportar la imagen (código ${code}).\n`));
  }
}

/**
 * Acción [8]: Validar compatibilidad email
 */
export async function validateEmails(rl: Interface): Promise<void> {
  clearScreen();
  console.log(paint(c.cyan + c.bold, "\n  🔍 Validar compatibilidad email\n"));

  let templates = getBuiltTemplates();
  if (templates.length === 0) {
    const built = await buildIfNeeded(rl);
    if (!built) return;
    templates = getBuiltTemplates();
    if (templates.length === 0) {
      console.log(paint(c.red, "\n  ❌ El build no generó templates en dist/.\n"));
      return;
    }
  }

  const { validateEmailHtml } = await import("../validators/validate-email-html.ts");
  validateEmailHtml();
}
