#!/usr/bin/env node

/**
 * @fileoverview CLI interactivo para vite-mhb-email.
 * Opciones: levantar servidor local, buildear para producción, crear template, enviar a Mailtrap.
 */

import { createInterface } from "readline";
import { spawn } from "child_process";
import { sendTemplate } from "./send-mailtrap.js";
import { sendToMailtester } from "./send-mailtester.js";
import { sendToInbox } from "./send-inbox.js";

// ─── Colores ANSI ────────────────────────────────────────────────────────────
const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  white: "\x1b[37m",
  bgCyan: "\x1b[46m",
  bgBlue: "\x1b[44m",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const paint = (color, text) => `${color}${text}${c.reset}`;
const bold = (text) => paint(c.bold, text);
const dim = (text) => paint(c.dim, text);

function clearScreen() {
  process.stdout.write("\x1b[2J\x1b[H");
}

function printBanner() {
  const lines = [
    "",
    paint(c.cyan + c.bold, "  ╔══════════════════════════════════╗"),
    paint(c.cyan + c.bold, "  ║     vite-mhb-email  CLI  🚀      ║"),
    paint(c.cyan + c.bold, "  ╚══════════════════════════════════╝"),
    "",
  ];
  console.log(lines.join("\n"));
}

function printMenu() {
  const options = [
    { key: "1", icon: "⚡", label: "Levantar servidor local", color: c.green },
    { key: "2", icon: "📦", label: "Buildear para producción", color: c.yellow },
    { key: "3", icon: "✨", label: "Crear nuevo template", color: c.magenta },
    { key: "4", icon: "📨", label: "Enviar template a Mailtrap", color: c.blue },
    { key: "5", icon: "🧪", label: "Testear con Mail-Tester (Gmail)", color: c.cyan },
    { key: "6", icon: "📬", label: "Enviar a bandeja real (Gmail / Outlook / Apple)", color: c.magenta },
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

// ─── Ejecutar comandos del sistema ───────────────────────────────────────────

/**
 * Ejecuta un comando heredando stdin/stdout/stderr del proceso padre.
 * @param {string} cmd
 * @param {string[]} args
 * @returns {Promise<number>} código de salida
 */
function run(cmd, args = []) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { stdio: "inherit", shell: true });
    child.on("close", (code) => resolve(code ?? 0));
  });
}

// ─── Acciones ────────────────────────────────────────────────────────────────

async function devServer() {
  clearScreen();
  console.log(paint(c.green + c.bold, "\n  ⚡ Iniciando servidor de desarrollo...\n"));
  await run("yarn", ["dev"]);
}

async function buildProd() {
  clearScreen();
  console.log(paint(c.yellow + c.bold, "\n  📦 Buildeando para producción...\n"));
  const code = await run("yarn", ["build"]);
  if (code === 0) {
    console.log(paint(c.green + c.bold, "\n  ✅ Build completado exitosamente.\n"));
  } else {
    console.log(paint(c.red + c.bold, `\n  ❌ Build falló con código ${code}.\n`));
  }
}

/**
 * Solicita el nombre del nuevo template al usuario.
 * @param {import('readline').Interface} rl
 * @returns {Promise<string>}
 */
function askTemplateName(rl) {
  return new Promise((resolve) => {
    rl.question(
      paint(c.magenta, "  ✨ Nombre del nuevo template: "),
      (answer) => resolve(answer.trim()),
    );
  });
}

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
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  // Preguntar opción al usuario
  const ask = () =>
    new Promise((resolve) => {
      rl.question(
        paint(c.cyan + c.bold, "  → "),
        (answer) => resolve(answer.trim()),
      );
    });

  let running = true;

  while (running) {
    clearScreen();
    printBanner();
    printMenu();

    const choice = await ask();

    switch (choice) {
      case "1":
        await devServer();
        // dev server se ejecuta hasta que el usuario lo corta (Ctrl+C)
        // al volver, mostramos el menú de nuevo
        break;

      case "2":
        await buildProd();
        // Pequeña pausa para que el usuario vea el resultado
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
