/**
 * @fileoverview Transformaciones sintácticas de condicionales y bucles Maizzle a Handlebars.
 */

import type Handlebars from "handlebars";

/** Operadores de comparación soportados, mapeados a su helper Handlebars. */
const COMPARISON_HELPERS: Record<string, string> = {
  "===": "eq",
  "==": "eq",
  "!==": "ne",
  "!=": "ne",
  ">=": "gte",
  "<=": "lte",
  ">": "gt",
  "<": "lt",
};

/** Comparación binaria simple; las alternativas largas van primero. */
const COMPARISON_PATTERN = /^(.+?)\s*(===|!==|==|!=|>=|<=|>|<)\s*(.+)$/;

/** Literales que Handlebars acepta tal cual como parámetro. */
const LITERAL_PATTERN = /^(?:-?\d+(?:\.\d+)?|true|false|null|undefined)$/;

/** Path de contexto (`prop`, `page.title`). */
const PATH_PATTERN = /^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*$/;

/**
 * Tag de control de flujo de Maizzle, de apertura o de cierre. Los atributos
 * admiten `>` dentro de comillas (`condition="total >= 3"`).
 */
const CONTROL_TAG_PATTERN = /<(\/)?(if|elseif|else)\b((?:"[^"]*"|'[^']*'|[^>"'])*)>/gi;

/**
 * Traduce un operando de Maizzle a un parámetro Handlebars.
 *
 * @param raw Texto crudo del operando.
 * @returns Cadena traducida o `null` si no es traducible.
 */
function convertOperand(raw: string): string | null {
  const value = raw.trim();
  const singleQuoted = value.match(/^'([^']*)'$/);
  if (singleQuoted) return singleQuoted[1].includes('"') ? null : `"${singleQuoted[1]}"`;
  if (LITERAL_PATTERN.test(value)) return value;
  if (PATH_PATTERN.test(value)) return value;
  return null;
}

/**
 * Parte una expresión por un operador lógico, ignorando cadenas entrecomilladas.
 *
 * @param expression Expresión lógica a dividir.
 * @param operator Operador lógico (`&&` o `||`).
 * @returns Partes resultantes.
 */
function splitLogical(expression: string, operator: "&&" | "||"): string[] {
  const parts: string[] = [];
  let current = "";
  let inString = false;
  for (let index = 0; index < expression.length; index += 1) {
    const char = expression[index];
    if (char === "'") inString = !inString;
    if (!inString && expression.startsWith(operator, index)) {
      parts.push(current);
      current = "";
      index += operator.length - 1;
      continue;
    }
    current += char;
  }
  parts.push(current);
  return parts;
}

/**
 * Traduce una condición de Maizzle a una expresión Handlebars válida.
 *
 * Soporta paths, literales, negación, comparaciones y los operadores lógicos
 * `&&` y `||`. Una condición que no se pueda traducir devuelve `null`.
 *
 * @param condition Expresión condicional de Maizzle.
 * @returns Expresión Handlebars o `null` si no es válida.
 */
export function convertCondition(condition: unknown): string | null {
  const expression = String(condition ?? "").trim();
  if (!expression) return null;

  const logicalOperators: Array<["||" | "&&", "or" | "and"]> = [
    ["||", "or"],
    ["&&", "and"],
  ];

  for (const [operator, helper] of logicalOperators) {
    const parts = splitLogical(expression, operator);
    if (parts.length > 1) {
      const converted = parts.map((part) => convertCondition(part));
      if (converted.some((part) => part === null)) return null;
      return `(${helper} ${converted.join(" ")})`;
    }
  }

  if (expression.startsWith("!") && !expression.startsWith("!=")) {
    const inner = convertCondition(expression.slice(1));
    return inner === null ? null : `(not ${inner})`;
  }

  const comparison = expression.match(COMPARISON_PATTERN);
  if (comparison) {
    const left = convertOperand(comparison[1]);
    const right = convertOperand(comparison[3]);
    if (left === null || right === null) return null;
    return `(${COMPARISON_HELPERS[comparison[2]]} ${left} ${right})`;
  }

  return convertOperand(expression);
}

/**
 * Registra en una instancia de Handlebars los helpers que necesitan las
 * condiciones traducidas por `convertCondition`.
 *
 * @param handlebars Instancia de Handlebars.
 * @returns La misma instancia, para encadenar.
 */
export function registerConditionHelpers<T extends typeof Handlebars>(handlebars: T): T {
  handlebars.registerHelper("eq", (a: unknown, b: unknown) => a === b);
  handlebars.registerHelper("ne", (a: unknown, b: unknown) => a !== b);
  handlebars.registerHelper("gt", (a: unknown, b: unknown) => Number(a) > Number(b));
  handlebars.registerHelper("lt", (a: unknown, b: unknown) => Number(a) < Number(b));
  handlebars.registerHelper("gte", (a: unknown, b: unknown) => Number(a) >= Number(b));
  handlebars.registerHelper("lte", (a: unknown, b: unknown) => Number(a) <= Number(b));
  handlebars.registerHelper("not", (value: unknown) => !value);
  handlebars.registerHelper("and", (...args: unknown[]) => args.slice(0, -1).every(Boolean));
  handlebars.registerHelper("or", (...args: unknown[]) => args.slice(0, -1).some(Boolean));
  return handlebars;
}

/**
 * Convierte la cadena `<if>` / `<elseif>` / `<else>` completa a un único bloque
 * `{{#if}}…{{else if}}…{{else}}…{{/if}}`.
 *
 * @param html Código HTML de entrada.
 * @returns HTML con condicionales traducidos.
 */
function convertConditionalChain(html: string): string {
  const matches = [...html.matchAll(CONTROL_TAG_PATTERN)];
  if (matches.length === 0) return html;

  let output = "";
  let lastIndex = 0;
  let openChains = 0;

  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index];
    const isClosing = Boolean(match[1]);
    const tag = match[2].toLowerCase();
    const previous = matches[index - 1];
    const previousIsOpening = Boolean(previous) && !previous[1];
    const continuesPreviousChain =
      Boolean(previous) &&
      Boolean(previous[1]) &&
      !isClosing &&
      (tag === "elseif" || tag === "else");

    let text = html.slice(lastIndex, match.index);
    if (previousIsOpening) text = text.trimStart();
    if (isClosing || continuesPreviousChain) text = text.trimEnd();
    if (continuesPreviousChain) text = text.trimStart();
    output += text;
    lastIndex = (match.index ?? 0) + match[0].length;

    if (isClosing) {
      const next = matches[index + 1];
      const nextTag = next ? next[2].toLowerCase() : "";
      const continuesChain =
        Boolean(next) && !next[1] && (nextTag === "elseif" || nextTag === "else");
      if (tag === "else" || !continuesChain) {
        output += "{{/if}}";
        openChains = Math.max(0, openChains - 1);
      }
      continue;
    }

    if (tag === "else") {
      output += "{{else}}";
      continue;
    }

    const condition = (match[3] || "").match(/condition="([^"]*)"/i);
    const expression = convertCondition(condition ? condition[1] : "") ?? "false";
    if (tag === "if") {
      output += `{{#if ${expression}}}`;
      openChains += 1;
    } else {
      output += `{{else if ${expression}}}`;
    }
  }

  output += html.slice(lastIndex);
  return output + "{{/if}}".repeat(openChains);
}

/**
 * Convierte condicionales y loops de Maizzle (`<if>`, `<elseif>`, `<else>`,
 * `<each>`) a sus equivalentes Handlebars. Se aplica antes del render Maizzle.
 *
 * @param html Código HTML de entrada.
 * @returns HTML con condicionales y loops convertidos a Handlebars.
 */
export function convertMaizzleConditionals(html: string): string {
  let output = convertConditionalChain(html);

  output = output.replace(
    /<each\s+loop="([A-Za-z_$][\w$]*)\s+in\s+([^"]+)"\s*>/gi,
    (_match, itemVar: string, collectionExpr: string) => {
      const collection = String(collectionExpr || "").trim();
      if (!collection) return _match;
      return `{{#each ${collection} as |${itemVar}|}}`;
    },
  );

  output = output.replace(/<\/each>/gi, "{{/each}}");
  return output;
}
