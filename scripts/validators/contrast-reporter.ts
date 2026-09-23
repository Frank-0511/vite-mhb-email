/**
 * @fileoverview Formateo y emisión de reportes de contraste WCAG en consola.
 */

import type { Theme } from "../shared/contracts/types/theme.ts";
import { c as colors, paint } from "../shared/index.ts";
import type { ContrastStatus, PairResult } from "./contrast-calculator.ts";

const severityIcon: Record<ContrastStatus, string> = { ERROR: "❌", WARNING: "⚠️", OK: "✅" };
const severityColor: Record<ContrastStatus, string> = {
  ERROR: colors.red,
  WARNING: colors.yellow,
  OK: colors.green,
};

export interface ThemeReportGroup {
  theme: Theme;
  results: PairResult[];
}

export function printThemeReport(themeName: Theme, results: PairResult[]): void {
  console.log(paint(colors.bold + colors.white, `\n🎨 Contraste WCAG — tema ${themeName}\n`));
  for (const result of results) {
    const icon = severityIcon[result.status];
    const color = severityColor[result.status];
    if (result.ratio === undefined) {
      console.log(`  ${icon} ${paint(color, result.name)}: ${result.message}`);
    } else {
      console.log(
        `  ${icon} ${paint(color, result.name)}: ${result.ratio.toFixed(2)}:1 (mínimo ${result.threshold}:1)`,
      );
    }
  }
}

export function printSummary(allResults: ThemeReportGroup[]): {
  errors: number;
  warnings: number;
  ok: number;
} {
  const flat = allResults.flatMap((r) => r.results);
  const errors = flat.filter((r) => r.status === "ERROR").length;
  const warnings = flat.filter((r) => r.status === "WARNING").length;
  const ok = flat.filter((r) => r.status === "OK").length;
  console.log(paint(colors.bold + colors.white, "\n══════════════════════════════════════════"));
  console.log(
    `   ${paint(colors.green, `✅ ${ok} OK`)}  │  ${paint(colors.yellow, `⚠️  ${warnings} warning${warnings !== 1 ? "s" : ""}`)}  │  ${paint(colors.red, `❌ ${errors} error${errors !== 1 ? "es" : ""}`)}\n`,
  );
  return { errors, warnings, ok };
}
