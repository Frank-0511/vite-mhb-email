/**
 * @fileoverview Guard de no-sobrescritura de iconos PNG frente a la rama base (master).
 */

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { c, paint } from "../shared/index.ts";

export interface IconGuardOptions {
  readonly projectRoot?: string;
  readonly baseRef?: string;
  readonly iconsDir?: string;
}

export interface IconGuardSummary {
  readonly verified: boolean;
  readonly errors: number;
  readonly modifiedFiles: readonly string[];
  readonly message: string;
}

/**
 * Comprueba que ningún icono PNG existente haya sido modificado respecto a la rama base.
 *
 * @param options Opciones de configuración (projectRoot, baseRef, iconsDir).
 * @returns Resumen de verificación con lista de archivos modificados y errores.
 */
export function checkIconNoOverwrite(options: IconGuardOptions = {}): IconGuardSummary {
  const root = options.projectRoot ?? process.cwd();
  const iconsRelDir = options.iconsDir ?? "src/emails/assets/icons";
  const iconsFullPath = join(root, iconsRelDir);

  if (!existsSync(iconsFullPath)) {
    return {
      verified: true,
      errors: 0,
      modifiedFiles: [],
      message: `Directorio "${iconsRelDir}" no existe en "${root}"; verificación omitida.`,
    };
  }

  const requestedRef = options.baseRef ?? "master";
  const primaryRef = requestedRef;
  const fallbackRef = requestedRef.startsWith("origin/")
    ? requestedRef.replace(/^origin\//, "")
    : `origin/${requestedRef}`;

  let resolvedRef: string | null = null;

  const checkPrimary = spawnSync("git", ["rev-parse", "--verify", primaryRef], {
    cwd: root,
    encoding: "utf-8",
  });

  if (checkPrimary.status === 0) {
    resolvedRef = primaryRef;
  } else {
    const checkFallback = spawnSync("git", ["rev-parse", "--verify", fallbackRef], {
      cwd: root,
      encoding: "utf-8",
    });
    if (checkFallback.status === 0) {
      resolvedRef = fallbackRef;
    }
  }

  if (!resolvedRef) {
    const message = `No se encontró la rama '${primaryRef}' ni su respaldo '${fallbackRef}' localmente para verificar no-sobrescritura de iconos. Verifique que '${primaryRef}' u '${fallbackRef}' esté disponible en el repositorio local.`;
    return {
      verified: false,
      errors: 1,
      modifiedFiles: [],
      message,
    };
  }

  const diffResult = spawnSync(
    "git",
    ["diff", "--diff-filter=M", "--name-only", resolvedRef, "--", iconsRelDir],
    {
      cwd: root,
      encoding: "utf-8",
    },
  );

  if (diffResult.status !== 0) {
    const errorMsg = (diffResult.stderr ?? "").trim() || "Error ejecutando git diff";
    return {
      verified: false,
      errors: 1,
      modifiedFiles: [],
      message: `Error al comparar iconos contra ${resolvedRef}: ${errorMsg}`,
    };
  }

  const output = diffResult.stdout ?? "";
  const modifiedFiles = output
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && line.endsWith(".png"));

  if (modifiedFiles.length > 0) {
    const message = `Se detectaron ${modifiedFiles.length} icono(s) PNG existente(s) modificado(s) respecto a ${resolvedRef}: ${modifiedFiles.join(", ")}. Los iconos son inmutables por caché de jsDelivr. Cree un archivo nuevo con sufijo de versión (ej: -v2) en lugar de modificar un PNG existente.`;
    return {
      verified: true,
      errors: modifiedFiles.length,
      modifiedFiles,
      message,
    };
  }

  return {
    verified: true,
    errors: 0,
    modifiedFiles: [],
    message: `Integridad de iconos OK: ningún PNG existente ha sido modificado respecto a ${resolvedRef}.`,
  };
}

/**
 * Imprime el reporte del guard de no-sobrescritura en consola.
 *
 * @param summary Resumen devuelto por checkIconNoOverwrite.
 */
export function printIconGuardReport(summary: IconGuardSummary): void {
  console.log(paint(c.bold + c.white, `\n🛡️  Guard de no-sobrescritura de iconos PNG:\n`));

  if (summary.errors === 0) {
    console.log(paint(c.green + c.bold, `  ✅ ${summary.message}\n`));
    return;
  }

  console.error(paint(c.red + c.bold, `  ❌ ${summary.message}\n`));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const summary = checkIconNoOverwrite();
  printIconGuardReport(summary);
  if (summary.errors > 0) {
    process.exit(1);
  }
}
