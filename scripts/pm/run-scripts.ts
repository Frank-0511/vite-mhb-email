/**
 * @fileoverview Ejecuta en secuencia scripts de `package.json` con el package
 * manager detectado. Sustituye los encadenados `<pm> run a && <pm> run b`.
 *
 * Uso: node scripts/pm/run-scripts.ts <script> [<script>...]
 */

import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { detectPackageManager, type PackageManager } from "../shared/env/detect-pm.ts";

export interface ScriptRunResult {
  readonly status: number | null;
  readonly error?: Error;
}

export type ScriptRunner = (pm: PackageManager, script: string) => ScriptRunResult;

const spawnScript: ScriptRunner = (pm, script) =>
  spawnSync(pm, ["run", script], { stdio: "inherit" });

/**
 * Ejecuta los scripts en orden y se detiene en el primero que falla.
 *
 * @returns 0 si todos pasan, el código del primero que falla, 1 si no se pudo
 *   lanzar o 2 si no se indicó ningún script
 */
export function runScripts(
  scripts: readonly string[],
  pm: PackageManager = detectPackageManager(),
  runner: ScriptRunner = spawnScript,
): number {
  if (scripts.length === 0) {
    console.error("Uso: node scripts/pm/run-scripts.ts <script> [<script>...]");
    return 2;
  }
  for (const script of scripts) {
    const { status, error } = runner(pm, script);
    if (error) {
      console.error(`No se pudo ejecutar "${pm} run ${script}": ${error.message}`);
      return 1;
    }
    if (status !== 0) return status ?? 1;
  }
  return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.exitCode = runScripts(process.argv.slice(2));
}
