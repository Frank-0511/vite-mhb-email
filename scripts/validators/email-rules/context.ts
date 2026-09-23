import { resolve } from "node:path";

export const Severity = {
  ERROR: "ERROR",
  WARNING: "WARNING",
  INFO: "INFO",
} as const;

export type SeverityType = (typeof Severity)[keyof typeof Severity];

export interface Issue {
  ruleId: string;
  severity: SeverityType;
  message: string;
  context?: string;
  hint?: string;
  line?: number;
}

export interface RuleContext {
  filePath: string;
  projectRoot: string;
}

export interface Rule {
  id: string;
  severity: SeverityType;
  description: string;
  check: (html: string, context: RuleContext) => Issue[];
}

export const projectRoot = resolve(process.cwd());

/**
 * Obtiene el número de línea aproximado de un índice en el HTML.
 */
export function getLineNumber(html: string, index: number): number {
  return html.substring(0, index).split("\n").length;
}

/**
 * Extrae un fragmento de contexto limpio alrededor de un match.
 */
export function getContext(html: string, index: number, length = 100): string {
  const start = Math.max(0, index);
  const end = Math.min(html.length, start + length);
  let snippet = html.substring(start, end).replace(/\s+/g, " ").trim();
  if (end < html.length) snippet += "…";
  return snippet;
}

/**
 * Extrae el contenido de las etiquetas <style> de un HTML.
 */
export function extractStyleContent(html: string): string {
  const styleBlocks: string[] = [];
  const regex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    styleBlocks.push(match[1]);
  }
  return styleBlocks.join("\n");
}
