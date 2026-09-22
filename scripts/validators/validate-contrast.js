#!/usr/bin/env node
// @ts-check
/**
 * @fileoverview Valida el contraste WCAG de los pares fg/bg declarados en
 * design-tokens.css para los temas claro y oscuro. No depende de un
 * navegador: parsea el CSS y calcula la luminancia relativa/ratio de
 * contraste directamente sobre los valores hex.
 */

import fs from "node:fs";
import path from "node:path";
import { c as colors, paint } from "../shared/index.ts";

const TOKENS_PATH = path.resolve(process.cwd(), "src/web/shared/styles/design-tokens.css");

/** Umbral WCAG AA por rol: texto normal exige 4.5:1, UI/texto grande 3:1. */
const ROLE_THRESHOLD = {
  text: 4.5,
  ui: 3,
};

/**
 * @typedef {Object} ContrastPair
 * @property {string} name
 * @property {string} fg Nombre del custom property (sin `--`).
 * @property {string} bg Nombre del custom property (sin `--`).
 * @property {keyof typeof ROLE_THRESHOLD} role
 */

/**
 * Pares fg/bg a validar, derivados de los componentes declarados en
 * `docs/design/DESIGN.md` (`action-primary`, `status-*`) y de los pares de
 * texto base usados en Home/Preview/Library.
 * @type {ContrastPair[]}
 */
export const PAIRS = [
  { name: "text/canvas", fg: "ef-text", bg: "ef-canvas", role: "text" },
  { name: "text/surface", fg: "ef-text", bg: "ef-surface", role: "text" },
  {
    name: "text/surface-raised",
    fg: "ef-text",
    bg: "ef-surface-raised",
    role: "text",
  },
  {
    name: "text-muted/canvas",
    fg: "ef-text-muted",
    bg: "ef-canvas",
    role: "text",
  },
  {
    name: "text-muted/surface",
    fg: "ef-text-muted",
    bg: "ef-surface",
    role: "text",
  },
  {
    name: "text-muted/surface-raised",
    fg: "ef-text-muted",
    bg: "ef-surface-raised",
    role: "text",
  },
  {
    name: "action-primary (text-on-accent/accent-strong)",
    fg: "ef-text-on-accent",
    bg: "ef-accent-strong",
    role: "ui",
  },
  {
    name: "status-success/surface",
    fg: "ef-success",
    bg: "ef-surface",
    role: "ui",
  },
  {
    name: "status-warning/surface",
    fg: "ef-warning",
    bg: "ef-surface",
    role: "ui",
  },
  {
    name: "status-danger/surface",
    fg: "ef-danger",
    bg: "ef-surface",
    role: "ui",
  },
  {
    name: "status-success/canvas",
    fg: "ef-success",
    bg: "ef-canvas",
    role: "ui",
  },
  {
    name: "status-warning/canvas",
    fg: "ef-warning",
    bg: "ef-canvas",
    role: "ui",
  },
  { name: "status-danger/canvas", fg: "ef-danger", bg: "ef-canvas", role: "ui" },
];

const THEMES = /** @type {const} */ ([
  { name: "light", selector: ":root" },
  { name: "dark", selector: ".dark" },
]);

/**
 * Extrae los custom properties `--ef-*` de un bloque de selector (`:root` o
 * `.dark`) dentro del CSS de tokens.
 * @param {string} css
 * @param {string} selector
 * @returns {Record<string, string>}
 */
export function parseThemeTokens(css, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const blockMatch = new RegExp(`${escaped}\\s*\\{([^}]*)\\}`).exec(css);
  if (!blockMatch) return {};
  /** @type {Record<string, string>} */
  const tokens = {};
  const propRegex = /--([a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{3,8})/g;
  let match;
  while ((match = propRegex.exec(blockMatch[1])) !== null) {
    tokens[match[1]] = match[2];
  }
  return tokens;
}

/**
 * Linealiza un canal sRGB (0-255) según la fórmula WCAG.
 * @param {number} channel
 * @returns {number}
 */
function linearizeChannel(channel) {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/**
 * Luminancia relativa de un color hex (#rgb o #rrggbb), fórmula WCAG.
 * @param {string} hex
 * @returns {number}
 */
export function relativeLuminance(hex) {
  const normalized = hex.length === 4 ? `#${[...hex.slice(1)].map((c) => c + c).join("")}` : hex;
  const r = parseInt(normalized.slice(1, 3), 16);
  const g = parseInt(normalized.slice(3, 5), 16);
  const b = parseInt(normalized.slice(5, 7), 16);
  return 0.2126 * linearizeChannel(r) + 0.7152 * linearizeChannel(g) + 0.0722 * linearizeChannel(b);
}

/**
 * Ratio de contraste WCAG entre dos colores hex.
 * @param {string} hexA
 * @param {string} hexB
 * @returns {number}
 */
export function contrastRatio(hexA, hexB) {
  const lumA = relativeLuminance(hexA);
  const lumB = relativeLuminance(hexB);
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * @typedef {Object} PairResult
 * @property {string} name
 * @property {"ERROR" | "WARNING" | "OK"} status
 * @property {number} [ratio]
 * @property {number} [threshold]
 * @property {string} [message]
 */

/**
 * Evalúa la lista fija de pares fg/bg contra los tokens resueltos de un tema.
 * @param {Record<string, string>} tokens
 * @param {ContrastPair[]} [pairs]
 * @returns {PairResult[]}
 */
export function evaluatePairs(tokens, pairs = PAIRS) {
  return pairs.map((pair) => {
    const fg = tokens[pair.fg];
    const bg = tokens[pair.bg];
    if (!fg || !bg) {
      const missing = !fg ? `--${pair.fg}` : `--${pair.bg}`;
      return {
        name: pair.name,
        status: "ERROR",
        message: `Token faltante: ${missing} no está definido en este tema.`,
      };
    }
    const ratio = contrastRatio(fg, bg);
    const threshold = ROLE_THRESHOLD[pair.role];
    const status = ratio < threshold ? "ERROR" : ratio < threshold + 0.3 ? "WARNING" : "OK";
    return { name: pair.name, status, ratio, threshold };
  });
}

const severityIcon = { ERROR: "❌", WARNING: "⚠️", OK: "✅" };
const severityColor = { ERROR: colors.red, WARNING: colors.yellow, OK: colors.green };

/**
 * @param {string} themeName
 * @param {PairResult[]} results
 */
function printThemeReport(themeName, results) {
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

/**
 * @param {{ theme: string, results: PairResult[] }[]} allResults
 */
function printSummary(allResults) {
  const flat = allResults.flatMap((r) => r.results);
  const errors = flat.filter((r) => r.status === "ERROR").length;
  const warnings = flat.filter((r) => r.status === "WARNING").length;
  const ok = flat.filter((r) => r.status === "OK").length;
  console.log(paint(colors.bold + colors.white, "\n══════════════════════════════════════════"));
  console.log(
    `   ${paint(colors.green, `✅ ${ok} OK`)}  │  ${paint(colors.yellow, `⚠️  ${warnings} warning${warnings !== 1 ? "s" : ""}`)}  │  ${paint(colors.red, `❌ ${errors} error${errors !== 1 ? "es" : ""}`)}\n`,
  );
}

/**
 * Corre la validación completa de contraste sobre `design-tokens.css`.
 * @param {string} [tokensPathOverride]
 * @returns {{ errors: number, warnings: number, ok: number }}
 */
export function validateContrast(tokensPathOverride) {
  const tokensPath = tokensPathOverride ?? TOKENS_PATH;
  const css = fs.readFileSync(tokensPath, "utf-8");
  const allResults = THEMES.map((theme) => ({
    theme: theme.name,
    results: evaluatePairs(parseThemeTokens(css, theme.selector)),
  }));
  allResults.forEach(({ theme, results }) => printThemeReport(theme, results));
  printSummary(allResults);
  const flat = allResults.flatMap((r) => r.results);
  return {
    errors: flat.filter((r) => r.status === "ERROR").length,
    warnings: flat.filter((r) => r.status === "WARNING").length,
    ok: flat.filter((r) => r.status === "OK").length,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { errors } = validateContrast();
  if (errors > 0) process.exitCode = 1;
}
