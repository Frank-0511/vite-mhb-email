#!/usr/bin/env node
/** @fileoverview Descubre HTML compilado, ejecuta reglas y formatea reportes. */
import { readFileSync } from "node:fs";
import { globSync } from "glob";
import { resolve } from "node:path";
import { projectRoot, Severity, type Issue } from "./email-rules/context.ts";
import { rules, runRules } from "./email-rules/rules/index.ts";

const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
};

const paint = (color: string, text: string): string => `${color}${text}${colors.reset}`;

const severityIcon: Record<string, string> = {
  [Severity.ERROR]: "❌",
  [Severity.WARNING]: "⚠️",
  [Severity.INFO]: "ℹ️",
};

const severityColor: Record<string, string> = {
  [Severity.ERROR]: colors.red,
  [Severity.WARNING]: colors.yellow,
  [Severity.INFO]: colors.blue,
};

export interface FileValidationResult {
  file: string;
  issues: Issue[];
}

export interface ValidationSummary {
  errors: number;
  warnings: number;
  infos: number;
}

function validateFile(filePath: string, projectRootOverride?: string): FileValidationResult {
  const html = readFileSync(filePath, "utf-8");
  const file = filePath.split("/").pop() ?? filePath;
  const issues = runRules(
    html,
    { filePath, projectRoot: projectRootOverride ?? projectRoot },
    rules,
    (rule, error) => {
      console.error(
        paint(colors.red, `  Error ejecutando regla "${rule.id}" en ${file}: ${error.message}`),
      );
    },
  );
  return { file, issues };
}

function printFileReport({ file, issues }: FileValidationResult): void {
  console.log(paint(colors.bold + colors.white, `\n📋 Email Compatibility Report: ${file}\n`));
  if (issues.length === 0) {
    console.log(paint(colors.green + colors.bold, "  ✅ No se encontraron problemas!\n"));
    return;
  }
  for (const issue of issues) {
    const lineInfo = issue.line ? paint(colors.dim, `L${issue.line}: `) : "";
    const icon = severityIcon[issue.severity] ?? "•";
    const color = severityColor[issue.severity] ?? colors.white;
    console.log(
      `  ${icon} ${paint(color + colors.bold, `[${issue.ruleId}]`)}  ${lineInfo}${issue.message}`,
    );
    if (issue.context) console.log(paint(colors.dim, `     → ${issue.context}`));
    if (issue.hint) console.log(paint(colors.cyan, `     💡 ${issue.hint}`));
    console.log();
  }
  const errors = issues.filter((issue) => issue.severity === Severity.ERROR).length;
  const warnings = issues.filter((issue) => issue.severity === Severity.WARNING).length;
  const infos = issues.filter((issue) => issue.severity === Severity.INFO).length;
  const passed = rules.length - new Set(issues.map((issue) => issue.ruleId)).size;
  console.log(paint(colors.dim, "  ─────────────────────────────────────────"));
  console.log(
    `  ${paint(colors.green, `✅ ${passed} reglas OK`)}  │  ${paint(colors.red, `❌ ${errors} error${errors !== 1 ? "es" : ""}`)}  │  ${paint(colors.yellow, `⚠️  ${warnings} warning${warnings !== 1 ? "s" : ""}`)}  │  ${paint(colors.blue, `ℹ️  ${infos} info`)}`,
  );
}

function printSummary(results: FileValidationResult[]): void {
  const issues = results.flatMap((result) => result.issues);
  const errors = issues.filter((issue) => issue.severity === Severity.ERROR).length;
  const warnings = issues.filter((issue) => issue.severity === Severity.WARNING).length;
  const infos = issues.filter((issue) => issue.severity === Severity.INFO).length;
  console.log(paint(colors.bold + colors.white, "\n══════════════════════════════════════════"));
  console.log(
    paint(
      colors.bold + colors.white,
      `📊 Resumen total: ${results.length} archivo${results.length !== 1 ? "s" : ""} analizado${results.length !== 1 ? "s" : ""}`,
    ),
  );
  console.log(
    `   ${paint(colors.red, `❌ ${errors} error${errors !== 1 ? "es" : ""}`)}  │  ${paint(colors.yellow, `⚠️  ${warnings} warning${warnings !== 1 ? "s" : ""}`)}  │  ${paint(colors.blue, `ℹ️  ${infos} info`)}`,
  );
  if (errors === 0 && warnings === 0) {
    console.log(
      paint(colors.green + colors.bold, "\n✅ Todos los templates son compatibles con email!\n"),
    );
  } else {
    console.log();
  }
}

/**
 * Valida todos los HTML de dist y devuelve conteos por severidad.
 * Solo ERROR bloquea a los consumidores del resultado.
 */
export function validateEmailHtml(
  distDirOverride?: string,
  projectRootOverride?: string,
): ValidationSummary {
  const root = projectRootOverride ?? projectRoot;
  const distDir = distDirOverride ?? resolve(root, "dist");
  const htmlFiles = globSync("**/*.html", { cwd: distDir });
  if (htmlFiles.length === 0) {
    console.log(`\n⚠️  No HTML files found in ${distDir}\n`);
    return { errors: 0, warnings: 0, infos: 0 };
  }
  console.log(paint(colors.cyan + colors.bold, "🔍 Validando compatibilidad email...\n"));
  const results = htmlFiles.map((file) => validateFile(resolve(distDir, file), root));
  results.forEach(printFileReport);
  printSummary(results);
  const issues = results.flatMap((result) => result.issues);
  return {
    errors: issues.filter((issue) => issue.severity === Severity.ERROR).length,
    warnings: issues.filter((issue) => issue.severity === Severity.WARNING).length,
    infos: issues.filter((issue) => issue.severity === Severity.INFO).length,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  validateEmailHtml();
}
