/**
 * @fileoverview Acciones del menú del CLI.
 * Cada acción corresponde a una opción del menú.
 */

import { buildIfNeeded } from "../build/build-helper.js";
import { sendToInbox } from "../mail/send-inbox.js";
import { sendToMailtester } from "../mail/send-mailtester.js";
import { sendTemplate } from "../mail/send-mailtrap.js";
import { getBuiltTemplates } from "../shared/built-templates.js";
import { c, paint } from "../shared/console.js";
import { askSelectTemplate, askTemplateName, run } from "./helpers.js";
import { clearScreen } from "./ui.js";

/**
 * Acción [1]: Levantar servidor de desarrollo
 * @returns {Promise<void>}
 */
export async function devServer() {
  clearScreen();
  console.log(paint(c.green + c.bold, "\n  ⚡ Iniciando servidor de desarrollo…\n"));
  await run("bun", ["run", "dev"]);
}

/**
 * Acción [2]: Buildear para producción
 * @returns {Promise<void>}
 */
export async function buildProd() {
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
 * @param {import('readline').Interface} rl
 * @returns {Promise<void>}
 */
export async function createTemplate(rl) {
  clearScreen();
  console.log(paint(c.magenta + c.bold, "\n  ✨ Crear nuevo template\n"));

  const name = await askTemplateName(rl);
  if (!name) {
    console.log(paint(c.red, "\n  ❌ El nombre no puede estar vacío.\n"));
    return;
  }

  console.log();
  const code = await run("bun", ["scripts/generators/generate-email.js", name]);
  if (code !== 0) {
    console.log(paint(c.red, `\n  ❌ Error al crear el template (código ${code}).\n`));
  }
}

/**
 * Acción [4]: Enviar template a Mailtrap
 * @param {import('readline').Interface} rl
 * @returns {Promise<void>}
 */
export async function sendMailtrap(rl) {
  clearScreen();
  await sendTemplate(rl);
}

/**
 * Acción [5]: Testear con Mail-Tester (Gmail)
 * @param {import('readline').Interface} rl
 * @returns {Promise<void>}
 */
export async function testMailTester(rl) {
  clearScreen();
  await sendToMailtester(rl);
}

/**
 * Acción [6]: Enviar a bandeja real (Gmail / Outlook / Apple)
 * @param {import('readline').Interface} rl
 * @returns {Promise<void>}
 */
export async function sendInbox(rl) {
  clearScreen();
  await sendToInbox(rl);
}

/**
 * Acción [7]: Exportar template como PNG
 * @param {import('readline').Interface} rl
 * @returns {Promise<void>}
 */
export async function exportScreenshot(rl) {
  clearScreen();
  console.log(paint(c.green + c.bold, "\n  📸 Exportar template como PNG\n"));

  const templateName = await askSelectTemplate(rl);
  if (!templateName) {
    return;
  }

  console.log();
  const code = await run("bun", ["scripts/export-screenshot.js", templateName]);
  if (code !== 0) {
    console.log(paint(c.red, `\n  ❌ Error al exportar la imagen (código ${code}).\n`));
  }
}

/**
 * Acción [8]: Validar compatibilidad email
 * @param {import('readline').Interface} rl
 * @returns {Promise<void>}
 */
export async function validateEmails(rl) {
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

  const { validateEmailHtml } = await import("../build/validate-email-html.js");
  validateEmailHtml();
}
