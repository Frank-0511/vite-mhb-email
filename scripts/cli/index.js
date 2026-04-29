/**
 * @fileoverview Loop principal del CLI interactivo.
 * Orquesta el flujo: UI, menú, acciones.
 */

import { createInterface } from "readline";
import { c, paint } from "../utils.js";
import {
  buildProd,
  createTemplate,
  devServer,
  exportScreenshot,
  sendInbox,
  sendMailtrap,
  testMailTester,
  validateEmails,
} from "./actions.js";
import { askMenuChoice } from "./helpers.js";
import { clearScreen, printBanner, printHelp, printMenu, warnMissingEnv } from "./ui.js";

/**
 * Ejecuta el loop principal del CLI.
 * @returns {Promise<void>}
 */
export async function main() {
  // Flag --help
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    printHelp();
    process.exit(0);
  }

  const rl = createInterface({ input: process.stdin, output: process.stdout });

  let running = true;

  while (running) {
    clearScreen();
    printBanner();
    warnMissingEnv();
    printMenu();

    const choice = await askMenuChoice(rl);

    switch (choice) {
      case "1":
        await devServer();
        break;

      case "2":
        await buildProd();
        await new Promise((r) => setTimeout(r, 1500));
        break;

      case "3":
        await createTemplate(rl);
        await new Promise((r) => setTimeout(r, 1500));
        break;

      case "4":
        await sendMailtrap(rl);
        await new Promise((r) => setTimeout(r, 2000));
        break;

      case "5":
        await testMailTester(rl);
        await new Promise((r) => setTimeout(r, 2000));
        break;

      case "6":
        await sendInbox(rl);
        await new Promise((r) => setTimeout(r, 2000));
        break;

      case "7":
        await exportScreenshot(rl);
        await new Promise((r) => setTimeout(r, 1500));
        break;

      case "8":
        await validateEmails(rl);
        await new Promise((r) => setTimeout(r, 2000));
        break;

      case "0":
      case "q":
      case "":
        running = false;
        console.log(paint(c.cyan, "\n  👋 ¡Hasta luego!\n"));
        break;

      default:
        console.log(paint(c.red, `\n  ❌ Opción "${choice}" no válida.\n`));
        await new Promise((r) => setTimeout(r, 1000));
    }
  }

  rl.close();
  process.exit(0);
}
