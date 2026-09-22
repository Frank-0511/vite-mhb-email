/**
 * @fileoverview Helper que ofrece buildear el proyecto si dist/ está vacío.
 * Importado por los scripts de envío (send-mailtrap, send-mailtester, send-inbox).
 */

import { spawn } from "node:child_process";
import { c, paint, prompt, type PromptSource } from "../shared/index.ts";

export type SpawnFunction = typeof spawn;

/**
 * Si `dist/` está vacío, pregunta al usuario si quiere buildear ahora.
 * Ejecuta `bun run build` si confirma.
 *
 * @param rl - Fuente de prompt readline
 * @param spawnProcess - Implementación de spawn.
 * @returns `true` si se buildeó exitosamente (o ya había templates), `false` si el usuario canceló o el build falló
 */
export async function buildIfNeeded(
  rl: PromptSource,
  spawnProcess: SpawnFunction = spawn,
): Promise<boolean> {
  console.log(paint(c.yellow, "\n  ⚠️  No hay templates buildeados en dist/."));
  const answer = await prompt(rl, paint(c.yellow + c.bold, "¿Querés buildear ahora? (s/N)"), "N");

  if (!["s", "S", "y", "Y"].includes(answer)) {
    console.log(paint(c.dim, "\n  Operación cancelada.\n"));
    return false;
  }

  console.log(paint(c.yellow + c.bold, "\n  📦 Buildeando para producción…\n"));

  const code = await new Promise<number>((resolve, reject) => {
    let settled = false;
    const rejectOnce = (error: Error) => {
      if (!settled) {
        settled = true;
        reject(error);
      }
    };

    const child = spawnProcess("bun", ["run", "build"], { stdio: "inherit" });
    child.once("error", (error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      rejectOnce(new Error(`No se pudo iniciar "bun run build": ${message}`, { cause: error }));
    });
    child.once("close", (code: number | null, signal: string | null) => {
      if (settled) return;
      if (signal) {
        rejectOnce(new Error(`"bun run build" terminó por la señal ${signal}`));
      } else if (code === null) {
        rejectOnce(new Error('"bun run build" terminó sin código de salida'));
      } else {
        settled = true;
        resolve(code);
      }
    });
  });

  if (code !== 0) {
    console.log(paint(c.red + c.bold, `\n  ❌ Build falló con código ${code}.\n`));
    return false;
  }

  console.log(paint(c.green + c.bold, "\n  ✅ Build completado.\n"));
  return true;
}
