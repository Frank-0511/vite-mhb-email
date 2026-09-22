/**
 * @fileoverview Fixtures compartidos por los tests de reglas de compatibilidad.
 */

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { rules } from "./rules/index.ts";
import type { Rule, RuleContext } from "./context.ts";

export const cleanHtml =
  '<!doctype html><html><head><meta charset="utf-8"></head><body><a href="https://example.com/unsubscribe">Unsubscribe</a><img src="x" width="1" height="1" alt="x"></body></html>';

const temporaryDirectories: string[] = [];

export function createContext(): RuleContext {
  const projectRoot = mkdtempSync(join(tmpdir(), "email-validation-"));
  temporaryDirectories.push(projectRoot);
  return { projectRoot, filePath: join(projectRoot, "dist", "example.html") };
}

export function cleanupContexts(): void {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
}

export function writeTemplateSource(
  context: RuleContext,
  templateName: string,
  source: string,
  data?: Record<string, unknown>,
): void {
  const templateRoot = join(context.projectRoot, "src", "emails", "templates", templateName);
  mkdirSync(templateRoot, { recursive: true });
  writeFileSync(join(templateRoot, "index.html"), source, "utf8");
  if (data !== undefined) {
    writeFileSync(join(templateRoot, "data.json"), JSON.stringify(data), "utf8");
  }
  context.filePath = join(context.projectRoot, "dist", `${templateName}.html`);
}

export function writeTemplateFile(
  context: { projectRoot: string },
  templateName: string,
  fileName: string,
  content: string,
): void {
  const templateRoot = join(context.projectRoot, "src", "emails", "templates", templateName);
  mkdirSync(templateRoot, { recursive: true });
  writeFileSync(join(templateRoot, fileName), content, "utf8");
}

export function ruleById(ruleId: string): Rule {
  const rule = rules.find((candidate) => candidate.id === ruleId);
  if (!rule) throw new Error(`Regla no registrada: ${ruleId}`);
  return rule;
}
