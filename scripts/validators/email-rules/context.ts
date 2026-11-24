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

/**
 * Extrae cada bloque <style> por separado (sin unir), para validar límites
 * por bloque como el de 8192 bytes que aplica Gmail.
 */
export function extractStyleBlocks(html: string): string[] {
  const styleBlocks: string[] = [];
  const regex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    styleBlocks.push(match[1]);
  }
  return styleBlocks;
}

/**
 * Extrae el contenido de los atributos style="" de un HTML, unido en un solo
 * bloque de texto CSS. Usado por reglas que validan valores CSS (colores,
 * unidades) tanto en <style> como en estilos inline.
 */
export function extractInlineStyleContent(html: string): string {
  const values: string[] = [];
  const regex = /\bstyle\s*=\s*"([^"]*)"/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    values.push(match[1]);
  }
  return values.join("\n");
}

/**
 * Devuelve el contenido de cada atributo style="..." o style='...', por
 * separado. Ignora atributos que solo terminan en "style" (p. ej. data-style).
 */
export function extractInlineStyles(html: string): string[] {
  const styles: string[] = [];
  const regex = /(?<![\w-])style\s*=\s*(["'])([\s\S]*?)\1/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    styles.push(match[2]);
  }
  return styles;
}

export interface CssDeclaration {
  property: string;
  value: string;
}

const CSS_COMMENT = /\/\*[\s\S]*?\*\//g;
const CSS_CONTENT_STRING = /((?<![\w-])content\s*:\s*)(?:"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/gi;
const CSS_PROPERTY_NAME = /^-{0,2}[a-z_][\w-]*$/i;

/**
 * Convierte CSS (de un bloque <style> o de un atributo style) en pares
 * propiedad/valor. Elimina comentarios y el contenido de content: "...",
 * separa declaraciones por ";" (y por llaves, para bloques con selectores) y
 * parte cada declaración por el primer ":". Descarta fragmentos cuyo nombre
 * no es un identificador CSS, como "@media (max-width".
 */
export function parseCssDeclarations(css: string): CssDeclaration[] {
  const cleaned = css.replace(CSS_COMMENT, "").replace(CSS_CONTENT_STRING, '$1""');
  const declarations: CssDeclaration[] = [];
  for (const segment of cleaned.split(/[;{}]/)) {
    const colon = segment.indexOf(":");
    if (colon === -1) continue;
    const property = segment.slice(0, colon).trim().toLowerCase();
    if (!CSS_PROPERTY_NAME.test(property)) continue;
    declarations.push({ property, value: segment.slice(colon + 1).trim() });
  }
  return declarations;
}
