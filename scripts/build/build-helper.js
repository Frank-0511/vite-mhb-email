/**
 * @fileoverview Helper que ofrece buildear el proyecto si dist/ está vacío.
 * Importado por los scripts de envío (send-mailtrap, send-mailtester, send-inbox).
 */

import { spawn } from "node:child_process";
import { c, paint } from "../shared/console.js";
import { prompt } from "../shared/prompts.js";

/**
 * Si `dist/` está vacío, pregunta al usuario si quiere buildear ahora.
 * Ejecuta `bun run build` si confirma.
 *
 * @param {import('readline').Interface} rl
 * @returns {Promise<boolean>} `true` si se buildeó exitosamente (o ya había templates), `false` si el usuario canceló o el build falló
 */
export async function buildIfNeeded(rl) {
  console.log(paint(c.yellow, "\n  ⚠️  No hay templates buildeados en dist/."));
  const answer = await prompt(rl, paint(c.yellow + c.bold, "¿Querés buildear ahora? (s/N)"), "N");

  if (!["s", "S", "y", "Y"].includes(answer)) {
    console.log(paint(c.dim, "\n  Operación cancelada.\n"));
    return false;
  }

  console.log(paint(c.yellow + c.bold, "\n  📦 Buildeando para producción…\n"));

  const code = await new Promise((resolve) => {
    const child = spawn("bun", ["run", "build"], { stdio: "inherit", shell: true });
    child.on("close", (c) => resolve(c ?? 0));
  });

  if (code !== 0) {
    console.log(paint(c.red + c.bold, `\n  ❌ Build falló con código ${code}.\n`));
    return false;
  }

  console.log(paint(c.green + c.bold, "\n  ✅ Build completado.\n"));
  return true;
}
