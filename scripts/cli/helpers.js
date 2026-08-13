/**
 * @fileoverview Funciones helper del CLI.
 * Ejecutar comandos y solicitar entrada del usuario.
 */

import { spawn } from "child_process";
import fs from "fs-extra";
import path from "node:path";
import { c, paint } from "../shared/console.js";

/**
 * Ejecuta un comando del sistema con stdio heredado.
 * @param {string} cmd - Comando a ejecutar
 * @param {string[]} args - Argumentos del comando
 * @param {typeof spawn} [spawnProcess=spawn] - Implementación de spawn.
 * @returns {Promise<number>} Código de salida
 */
export function run(cmd, args = [], spawnProcess = spawn) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const rejectOnce = (error) => {
      if (!settled) {
        settled = true;
        reject(error);
      }
    };

    const child = spawnProcess(cmd, args, { stdio: "inherit" });
    child.once("error", (error) => {
      const message = error instanceof Error ? error.message : String(error);
      rejectOnce(new Error(`No se pudo iniciar "${cmd}": ${message}`, { cause: error }));
    });
    child.once("close", (code, signal) => {
      if (settled) return;
      if (signal) {
        rejectOnce(new Error(`"${cmd}" terminó por la señal ${signal}`));
      } else if (code === null) {
        rejectOnce(new Error(`"${cmd}" terminó sin código de salida`));
      } else {
        settled = true;
        resolve(code);
      }
    });
  });
}

/**
 * Solicita al usuario que ingrese el nombre de un nuevo template.
 * @param {import('readline').Interface} rl
 * @returns {Promise<string>} Nombre del template
 */
export function askTemplateName(rl) {
  return new Promise((resolve) => {
    rl.question(paint(c.magenta, "  ✨ Nombre del nuevo template: "), (answer) =>
      resolve(answer.trim()),
    );
  });
}

/**
 * Lista los templates compilados desde dist/ y permite seleccionar uno.
 * @param {import('readline').Interface} rl
 * @returns {Promise<string | null>} Nombre del template seleccionado o null
 */
export function askSelectTemplate(rl) {
  const distPath = path.join(process.cwd(), "dist");

  if (!fs.existsSync(distPath)) {
    console.log(
      paint(c.red + c.bold, "  ❌ Error:") +
        paint(c.dim, " No existe la carpeta dist/.\n") +
        paint(c.cyan, "     Primero ejecutá 'yarn build'.\n"),
    );
    return Promise.resolve(null);
  }

  const templateFiles = fs
    .readdirSync(distPath, { withFileTypes: true })
    .filter((dirent) => dirent.isFile() && dirent.name.endsWith(".html"))
    .map((dirent) => dirent.name.replace(".html", ""))
    .sort();

  if (templateFiles.length === 0) {
    console.log(
      paint(c.red + c.bold, "  ❌ Error:") +
        paint(c.dim, " No hay templates compilados en dist/.\n"),
    );
    return Promise.resolve(null);
  }

  console.log(paint(c.green + c.bold, "\n  📸 Seleccionar template\n"));
  console.log(paint(c.white + c.bold, "  Templates disponibles:\n"));

  for (let i = 0; i < templateFiles.length; i++) {
    const num = paint(c.green + c.bold, `  [${i + 1}]`);
    console.log(`  ${num}  ${templateFiles[i]}`);
  }

  return new Promise((resolve) => {
    rl.question(paint(c.cyan + c.bold, "\n  → Selecciona el número del template: "), (answer) => {
      const idx = parseInt(answer, 10) - 1;
      if (idx >= 0 && idx < templateFiles.length) {
        resolve(templateFiles[idx]);
      } else {
        console.log(paint(c.red, "  ❌ Selección inválida.\n"));
        resolve(null);
      }
    });
  });
}

/**
 * Solicita una opción al usuario en el menú principal.
 * @param {import('readline').Interface} rl
 * @returns {Promise<string>} La opción seleccionada
 */
export function askMenuChoice(rl) {
  return new Promise((resolve) => {
    rl.question(paint(c.cyan + c.bold, "  → "), (answer) => resolve(answer.trim()));
  });
}
