/**
 * @fileoverview Ejecución de subprocesos del sistema con stdio heredado.
 */

import { spawn, type ChildProcess } from "node:child_process";

/**
 * Tipo compatible para inyección de spawn en pruebas.
 */
export type SpawnFunction = (
  command: string,
  args: readonly string[],
  options: Record<string, unknown>,
) => ChildProcess;

/**
 * Ejecuta un comando del sistema con stdio heredado.
 *
 * @param cmd - Comando a ejecutar
 * @param args - Argumentos del comando
 * @param spawnProcess - Implementación de spawn inyectable para testing
 * @returns Código de salida
 */
export function run(
  cmd: string,
  args: string[] = [],
  spawnProcess: SpawnFunction | typeof spawn = spawn,
): Promise<number> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const rejectOnce = (error: Error) => {
      if (!settled) {
        settled = true;
        reject(error);
      }
    };

    const child = (spawnProcess as typeof spawn)(cmd, args, { stdio: "inherit" });
    child.once("error", (error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      rejectOnce(new Error(`No se pudo iniciar "${cmd}": ${message}`, { cause: error }));
    });
    child.once("close", (code: number | null, signal: NodeJS.Signals | null) => {
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
