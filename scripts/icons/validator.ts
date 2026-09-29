/**
 * @fileoverview Validador de referencias a <x-email-icon> en plantillas y layouts de email.
 */

import { existsSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { globSync } from "glob";
import { c, paint } from "../shared/index.ts";

export interface IconValidationIssue {
  readonly file: string;
  readonly line: number;
  readonly iconName: string;
  readonly message: string;
  readonly type: "missing-file" | "invalid-format" | "missing-name";
}

export interface IconValidationSummary {
  readonly checkedReferences: number;
  readonly checkedFiles: number;
  readonly errors: number;
  readonly issues: readonly IconValidationIssue[];
}
import { ICON_NAME_CONVENTION_REGEX } from "../shared/contracts/constants/email-assets.ts";

/**
 * Valida todas las referencias a <x-email-icon> en src/emails/**\/*.html.
 *
 * @param projectRootOverride Directorio raíz del proyecto opcional.
 * @returns Resumen con conteo de errores e incidencias encontradas.
 */
export function validateIconReferences(projectRootOverride?: string): IconValidationSummary {
  const root = projectRootOverride ?? process.cwd();
  const searchPattern = "src/emails/**/*.html";
  const htmlFiles = globSync(searchPattern, { cwd: root });
  const iconsDir = join(root, "src/emails/assets/icons");

  const issues: IconValidationIssue[] = [];
  let checkedReferences = 0;
  let checkedFiles = 0;

  const tagRegex = /<x-email-icon\b([^>]*)\/?>/gi;
  const nameAttrRegex = /\bname\s*=\s*["']([^"']+)["']/i;

  for (const relFile of htmlFiles) {
    const fullPath = join(root, relFile);
    const content = readFileSync(fullPath, "utf-8");

    let fileHadReferences = false;
    let match: RegExpExecArray | null;

    tagRegex.lastIndex = 0;
    while ((match = tagRegex.exec(content)) !== null) {
      fileHadReferences = true;
      checkedReferences++;

      const precedingText = content.slice(0, match.index);
      const lineNumber = precedingText.split("\n").length;
      const attributes = match[1] ?? "";

      const nameMatch = nameAttrRegex.exec(attributes);
      if (!nameMatch || !nameMatch[1].trim()) {
        issues.push({
          file: relFile,
          line: lineNumber,
          iconName: "",
          message: `Etiqueta <x-email-icon> sin atributo 'name' en ${relFile}:L${lineNumber}`,
          type: "missing-name",
        });
        continue;
      }

      const iconName = nameMatch[1].trim();

      if (iconName.endsWith(".png")) {
        issues.push({
          file: relFile,
          line: lineNumber,
          iconName,
          message: `El nombre de icono "${iconName}" no debe incluir la extensión .png en ${relFile}:L${lineNumber}`,
          type: "invalid-format",
        });
        continue;
      }

      if (!ICON_NAME_CONVENTION_REGEX.test(iconName)) {
        issues.push({
          file: relFile,
          line: lineNumber,
          iconName,
          message: `El nombre de icono "${iconName}" no cumple la convención "lucide-<icono>-<hex6>(-v<N>)?" en ${relFile}:L${lineNumber}`,
          type: "invalid-format",
        });
        continue;
      }

      const pngFileName = `${iconName}.png`;
      const expectedPngPath = join(iconsDir, pngFileName);

      if (!existsSync(expectedPngPath)) {
        const relExpected = relative(root, expectedPngPath);
        issues.push({
          file: relFile,
          line: lineNumber,
          iconName,
          message: `Icono PNG no encontrado en disco: "${relExpected}" referenciado en ${relFile}:L${lineNumber}`,
          type: "missing-file",
        });
      }
    }

    if (fileHadReferences) {
      checkedFiles++;
    }
  }

  return {
    checkedReferences,
    checkedFiles,
    errors: issues.length,
    issues,
  };
}

/**
 * Imprime en consola el reporte de validación de iconos.
 *
 * @param summary Resumen obtenido de validateIconReferences.
 */
export function printIconValidationReport(summary: IconValidationSummary): void {
  console.log(
    paint(c.bold + c.white, `\n🎨 Validación de referencias a iconos (<x-email-icon>):\n`),
  );

  if (summary.issues.length === 0) {
    console.log(
      paint(
        c.green + c.bold,
        `  ✅ ${summary.checkedReferences} referencias verificadas en ${summary.checkedFiles} archivo(s). Todos los PNG existen y cumplen la convención.\n`,
      ),
    );
    return;
  }

  for (const issue of summary.issues) {
    console.log(
      `  ❌ ${paint(c.red + c.bold, `[${issue.type}]`)} ${paint(c.dim, `L${issue.line}:`)} ${issue.message}`,
    );
  }

  console.log(
    paint(
      c.red + c.bold,
      `\n  ❌ Total: ${summary.errors} error(es) en referencias a iconos PNG.\n`,
    ),
  );
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const summary = validateIconReferences();
  printIconValidationReport(summary);
  if (summary.errors > 0) {
    process.exit(1);
  }
}
