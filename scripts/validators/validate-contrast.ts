#!/usr/bin/env node
/**
 * @fileoverview Valida el contraste WCAG de los pares fg/bg declarados en
 * design-tokens.css para los temas claro y oscuro.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { evaluatePairs, parseThemeTokens, THEMES } from "./contrast-calculator.ts";
import { printSummary, printThemeReport, type ThemeReportGroup } from "./contrast-reporter.ts";

export * from "./contrast-calculator.ts";
export * from "./contrast-reporter.ts";

export const TOKENS_PATH = resolve(process.cwd(), "src/web/shared/styles/design-tokens.css");

/**
 * Corre la validación completa de contraste sobre `design-tokens.css`.
 */
export function validateContrast(tokensPathOverride?: string): {
  errors: number;
  warnings: number;
  ok: number;
} {
  const tokensPath = tokensPathOverride ?? TOKENS_PATH;
  const css = readFileSync(tokensPath, "utf-8");
  const allResults: ThemeReportGroup[] = THEMES.map((theme) => ({
    theme: theme.name,
    results: evaluatePairs(parseThemeTokens(css, theme.selector)),
  }));
  allResults.forEach(({ theme, results }) => printThemeReport(theme, results));
  return printSummary(allResults);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { errors } = validateContrast();
  if (errors > 0) process.exitCode = 1;
}
