#!/usr/bin/env node
// @ts-check

/**
 * @fileoverview CLI interactivo para vite-mhb-email.
 *
 * Uso:
 *   yarn cli          — Abre el menú interactivo
 *   yarn cli --help   — Muestra la ayuda y sale
 */

import { createInterface } from "readline";
import { spawn } from "child_process";
import { sendTemplate } from "./send-mailtrap.js";
import { sendToMailtester } from "./send-mailtester.js";
import { sendToInbox } from "./send-inbox.js";
import { c, paint, checkEnv } from "./utils.js";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** @param {string} text @returns {string} */
const bold = (text) => paint(c.bold, text);
/** @param {string} text @returns {string} */
const dim = (text) => paint(c.dim, text);

function clearScreen() {
  process.stdout.write("\x1b[2J\x1b[H");
}

// ─── --help ───────────────────────────────────────────────────────────────────

function printHelp() {
  console.log(`
${paint(c.cyan + c.bold, "  vite-mhb-email CLI")}

  ${bold("Uso:")}
    yarn cli          Abre el menú interactivo
    yarn cli --help   Muestra esta ayuda

  ${bold("Opciones del menú:")}
    ${paint(c.green, "[1]")}  ⚡  Levantar servidor de desarrollo  (yarn dev)
    ${paint(c.yellow, "[2]")}  📦  Buildear para producción          (yarn build)
    ${paint(c.magenta, "[3]")}  ✨  Crear nuevo template
    ${paint(c.blue, "[4]")}  📨  Enviar template a Mailtrap        (requiere MAILTRAP_*)
    ${paint(c.cyan, "[5]")}  🧪  Testear con Mail-Tester (Gmail)   (requiere GMAIL_*)
    ${paint(c.magenta, "[6]")}  📬  Enviar a bandeja real             (requiere GMAIL_*)
    ${paint(c.red, "[0]")}  👋  Salir

  ${bold("Variables de entorno:")}
    Copiá ${dim(".env.example")} → ${dim(".env")} y completá tus credenciales.
    Ver README para la referencia completa de variables.
`);
}

// ─── Banner y menú ────────────────────────────────────────────────────────────

function printBanner() {
  console.log(
    [
      "",
      paint(c.cyan + c.bold, "  ╔══════════════════════════════════╗"),
      paint(c.cyan + c.bold, "  ║     vite-mhb-email  CLI  🚀      ║"),
      paint(c.cyan + c.bold, "  ╚══════════════════════════════════╝"),
      "",
    ].join("\n"),
  );
}

function printMenu() {
  const options = [
    { key: "1", icon: "⚡", label: "Levantar servidor local", color: c.green },
    { key: "2", icon: "📦", label: "Buildear para producción", color: c.yellow },
    { key: "3", icon: "✨", label: "Crear nuevo template", color: c.magenta },
    { key: "4", icon: "📨", label: "Enviar template a Mailtrap", color: c.blue },
    { key: "5", icon: "🧪", label: "Testear con Mail-Tester (Gmail)", color: c.cyan },
    {
      key: "6",
      icon: "📬",
      label: "Enviar a bandeja real (Gmail / Outlook / Apple)",
      color: c.magenta,
    },
    { key: "0", icon: "👋", label: "Salir", color: c.red },
  ];

  console.log(paint(c.white + c.bold, "  Seleccioná una opción:\n"));
  for (const opt of options) {
    const key = paint(opt.color + c.bold, ` [${opt.key}] `);
    const label = paint(opt.color, `${opt.icon}  ${opt.label}`);
    console.log(`  ${key} ${label}`);
  }
  console.log();
}

// ─── Validación de .env al arrancar ──────────────────────────────────────────

/**
 * Verifica el estado del .env y muestra advertencias si faltan variables.
 * No termina el proceso — solo informa al usuario.
 */
function warnMissingEnv() {
  const ALL_KEYS = ["MAILTRAP_API_TOKEN", "MAILTRAP_INBOX_ID", "GMAIL_USER", "GMAIL_APP_PASS"];

  const { exists, missing } = checkEnv(ALL_KEYS);

  if (!exists) {
    console.log(
      paint(c.yellow + c.bold, "  ⚠️  No se encontró el archivo .env.") +
        paint(c.dim, "  Las opciones de envío (4, 5, 6) no estarán disponibles.\n") +
        paint(c.dim, "     Copiá .env.example → .env y completá tus credenciales.\n"),
    );
    return;
  }

  if (missing.length > 0) {
    const groups = {
      "Mailtrap (opción 4)": ["MAILTRAP_API_TOKEN", "MAILTRAP_INBOX_ID"],
      "Gmail SMTP (opciones 5 y 6)": ["GMAIL_USER", "GMAIL_APP_PASS"],
    };

    const affectedGroups = Object.entries(groups)
      .filter(([, keys]) => keys.some((k) => missing.includes(k)))
      .map(([name]) => name);

    if (affectedGroups.length > 0) {
      console.log(paint(c.yellow + c.bold, "  ⚠️  Variables de .env sin configurar:"));
      for (const g of affectedGroups) {
        console.log(paint(c.dim, `     • ${g}`));
      }
      console.log(paint(c.dim, "     Ver README → Variables de entorno para más info.\n"));
    }
  }
}

// ─── Ejecutar comandos del sistema ───────────────────────────────────────────

/** @param {string} cmd @param {string[]} args @returns {Promise<number>} */
function run(cmd, args = []) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { stdio: "inherit", shell: true });
    child.on("close", (code) => resolve(code ?? 0));
  });
}

// ─── Acciones ────────────────────────────────────────────────────────────────

async function devServer() {
  clearScreen();
  console.log(paint(c.green + c.bold, "\n  ⚡ Iniciando servidor de desarrollo…\n"));
  await run("yarn", ["dev"]);
}

async function buildProd() {
  clearScreen();
  console.log(paint(c.yellow + c.bold, "\n  📦 Buildeando para producción…\n"));
  const code = await run("yarn", ["build"]);
  if (code === 0) {
    console.log(paint(c.green + c.bold, "\n  ✅ Build completado exitosamente.\n"));
  } else {
    console.log(paint(c.red + c.bold, `\n  ❌ Build falló con código ${code}.\n`));
  }
}

/**
 * @param {import('readline').Interface} rl
 * @returns {Promise<string>}
 */
function askTemplateName(rl) {
  return new Promise((resolve) => {
    rl.question(paint(c.magenta, "  ✨ Nombre del nuevo template: "), (answer) =>
      resolve(answer.trim()),
    );
  });
}

/**
 * @param {import('readline').Interface} rl
 * @returns {Promise<void>}
 */
async function createTemplate(rl) {
  clearScreen();
  console.log(paint(c.magenta + c.bold, "\n  ✨ Crear nuevo template\n"));

  const name = await askTemplateName(rl);
  if (!name) {
    console.log(paint(c.red, "\n  ❌ El nombre no puede estar vacío.\n"));
    return;
  }

  console.log();
  const code = await run("node", ["scripts/generate-email.js", name]);
  if (code !== 0) {
    console.log(paint(c.red, `\n  ❌ Error al crear el template (código ${code}).\n`));
  }
}

// ─── Loop principal ───────────────────────────────────────────────────────────

async function main() {
  // Flag --help
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    printHelp();
    process.exit(0);
  }

  const rl = createInterface({ input: process.stdin, output: process.stdout });

  const ask = () =>
    new Promise((resolve) => {
      rl.question(paint(c.cyan + c.bold, "  → "), (answer) => resolve(answer.trim()));
    });

  let running = true;

  while (running) {
    clearScreen();
    printBanner();
    warnMissingEnv();
    printMenu();

    const choice = await ask();

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
        clearScreen();
        await sendTemplate(rl);
        await new Promise((r) => setTimeout(r, 2000));
        break;

      case "5":
        clearScreen();
        await sendToMailtester(rl);
        await new Promise((r) => setTimeout(r, 2000));
        break;

      case "6":
        clearScreen();
        await sendToInbox(rl);
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

main().catch((err) => {
  console.error(paint(c.red, `\n  ❌ Error inesperado: ${err.message}\n`));
  process.exit(1);
});
