/**
 * @fileoverview Funciones de cálculo matemático y parsing de tokens de color para contraste WCAG.
 */

export const ROLE_THRESHOLD = {
  text: 4.5,
  ui: 3,
} as const;

export type ContrastRole = keyof typeof ROLE_THRESHOLD;

export interface ContrastPair {
  name: string;
  fg: string;
  bg: string;
  role: ContrastRole;
}

export const PAIRS: ContrastPair[] = [
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

export const THEMES = [
  { name: "light", selector: ":root" },
  { name: "dark", selector: ".dark" },
] as const;

export function parseThemeTokens(css: string, selector: string): Record<string, string> {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const blockMatch = new RegExp(`${escaped}\\s*\\{([^}]*)\\}`).exec(css);
  if (!blockMatch) return {};
  const tokens: Record<string, string> = {};
  const propRegex = /--([a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{3,8})/g;
  let match: RegExpExecArray | null;
  while ((match = propRegex.exec(blockMatch[1])) !== null) {
    tokens[match[1]] = match[2];
  }
  return tokens;
}

function linearizeChannel(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number {
  const normalized = hex.length === 4 ? `#${[...hex.slice(1)].map((c) => c + c).join("")}` : hex;
  const r = parseInt(normalized.slice(1, 3), 16);
  const g = parseInt(normalized.slice(3, 5), 16);
  const b = parseInt(normalized.slice(5, 7), 16);
  return 0.2126 * linearizeChannel(r) + 0.7152 * linearizeChannel(g) + 0.0722 * linearizeChannel(b);
}

export function contrastRatio(hexA: string, hexB: string): number {
  const lumA = relativeLuminance(hexA);
  const lumB = relativeLuminance(hexB);
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return (lighter + 0.05) / (darker + 0.05);
}

export type ContrastStatus = "ERROR" | "WARNING" | "OK";

export interface PairResult {
  name: string;
  status: ContrastStatus;
  ratio?: number;
  threshold?: number;
  message?: string;
}

export function evaluatePairs(
  tokens: Record<string, string>,
  pairs: ContrastPair[] = PAIRS,
): PairResult[] {
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
    const status: ContrastStatus =
      ratio < threshold ? "ERROR" : ratio < threshold + 0.3 ? "WARNING" : "OK";
    return { name: pair.name, status, ratio, threshold };
  });
}
