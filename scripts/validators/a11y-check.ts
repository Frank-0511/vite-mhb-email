#!/usr/bin/env node
/**
 * @fileoverview Checker de accesibilidad de la dashboard (Home/Library/
 * Preview) con axe-core inyectado sobre el Puppeteer ya usado para exportar
 * PNG. Levanta un servidor Vite efímero (no depende de `bun run dev`
 * corriendo), visita rutas fijas en tema claro y oscuro, y reporta
 * violaciones por severidad. Separado de `bun run lint`/`bun run test` por
 * el costo de un navegador real, igual que `validate-email` hoy.
 */

import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import puppeteer, { type Browser } from "puppeteer";
import { createServer } from "vite";
import { c as colors, paint } from "../shared/index.ts";

const require = createRequire(import.meta.url);
const projectRoot = resolve(import.meta.dirname ?? ".", "../..");

/** Rutas del dashboard a auditar; `/preview` requiere un template válido. */
export const ROUTES: readonly string[] = ["/", "/library", "/preview?template=welcome"] as const;

/** Temas a auditar, replicando `document.documentElement.classList` real. */
export const THEMES = ["light", "dark"] as const;
export type ThemeType = (typeof THEMES)[number];

/** Tags WCAG que corre axe-core (2A, 2AA y 2.1AA). */
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21aa"];

export type A11ySeverity = "ERROR" | "WARNING" | "INFO";

/**
 * Mapea el `impact` de axe-core a la severidad del proyecto.
 */
export function mapImpactToSeverity(impact: string | null): A11ySeverity {
  if (impact === "critical" || impact === "serious") return "ERROR";
  if (impact === "moderate") return "WARNING";
  return "INFO";
}

export interface ViolationSummary {
  id: string;
  severity: A11ySeverity;
  impact: string;
  help: string;
  helpUrl: string;
  nodesCount: number;
  firstTarget: string;
}

export interface RouteReport {
  route: string;
  theme: ThemeType;
  violations: ViolationSummary[];
}

export interface RawAxeResults {
  violations: Array<{
    id: string;
    impact: string | null;
    help: string;
    helpUrl: string;
    nodes: Array<{ target: string[] }>;
  }>;
}

/**
 * Convierte el resultado crudo de `axe.run()` en un resumen por violación,
 * ordenado por severidad. Función pura: no toca el navegador.
 */
export function summarizeAxeResults(
  route: string,
  theme: ThemeType,
  axeResults: RawAxeResults,
): RouteReport {
  const severityRank: Record<A11ySeverity, number> = { ERROR: 0, WARNING: 1, INFO: 2 };
  const violations: ViolationSummary[] = axeResults.violations
    .map((violation) => ({
      id: violation.id,
      severity: mapImpactToSeverity(violation.impact),
      impact: violation.impact ?? "desconocido",
      help: violation.help,
      helpUrl: violation.helpUrl,
      nodesCount: violation.nodes.length,
      firstTarget: violation.nodes[0]?.target.join(" ") ?? "",
    }))
    .sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
  return { route, theme, violations };
}

const severityIcon: Record<A11ySeverity, string> = { ERROR: "❌", WARNING: "⚠️", INFO: "ℹ️" };
const severityColor: Record<A11ySeverity, string> = {
  ERROR: colors.red,
  WARNING: colors.yellow,
  INFO: colors.blue,
};

/**
 * Imprime el reporte de accesibilidad agrupado por ruta y tema. Función pura
 * sobre datos ya resumidos (recibe `RouteReport[]`, no toca el navegador).
 */
export function printReport(reports: RouteReport[]): {
  errors: number;
  warnings: number;
  infos: number;
} {
  console.log(paint(colors.bold + colors.white, "\n♿ Accesibilidad de la dashboard (axe-core)\n"));
  for (const { route, theme, violations } of reports) {
    console.log(paint(colors.bold + colors.white, `\n📋 ${route} — tema ${theme}\n`));
    if (violations.length === 0) {
      console.log(paint(colors.green + colors.bold, "  ✅ Sin violaciones detectadas."));
      continue;
    }
    for (const violation of violations) {
      const icon = severityIcon[violation.severity];
      const color = severityColor[violation.severity];
      console.log(
        `  ${icon} ${paint(color + colors.bold, `[${violation.id}]`)} (${violation.impact}, ${violation.nodesCount} nodo${violation.nodesCount !== 1 ? "s" : ""}) ${violation.help}`,
      );
      console.log(paint(colors.dim, `     → ${violation.firstTarget}`));
      console.log(paint(colors.dim, `     ${violation.helpUrl}`));
    }
  }
  const flat = reports.flatMap((r) => r.violations);
  const errors = flat.filter((v) => v.severity === "ERROR").length;
  const warnings = flat.filter((v) => v.severity === "WARNING").length;
  const infos = flat.filter((v) => v.severity === "INFO").length;
  console.log(paint(colors.bold + colors.white, "\n══════════════════════════════════════════"));
  console.log(
    `   ${paint(colors.red, `❌ ${errors} error${errors !== 1 ? "es" : ""}`)}  │  ${paint(colors.yellow, `⚠️  ${warnings} warning${warnings !== 1 ? "s" : ""}`)}  │  ${paint(colors.blue, `ℹ️  ${infos} info`)}\n`,
  );
  return { errors, warnings, infos };
}

/**
 * Levanta un servidor Vite efímero, recorre `ROUTES` x `THEMES` con
 * Puppeteer + axe-core, y devuelve el reporte por ruta/tema.
 */
export async function crawlDashboard(): Promise<RouteReport[]> {
  const server = await createServer({
    configFile: resolve(projectRoot, "vite.config.js"),
    server: { port: 0, open: false, strictPort: false },
    logLevel: "warn",
  });
  await server.listen();
  const address = server.httpServer?.address();
  if (!address || typeof address === "string") {
    throw new Error("No se pudo determinar el puerto del servidor Vite efímero.");
  }
  const baseURL = `http://localhost:${address.port}`;
  const axeSource = readFileSync(require.resolve("axe-core/axe.min.js"), "utf-8");

  let browser: Browser | undefined;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const reports: RouteReport[] = [];
    for (const route of ROUTES) {
      for (const theme of THEMES) {
        const page = await browser.newPage();
        try {
          await page.evaluateOnNewDocument((themeName: string) => {
            window.localStorage.setItem("app-theme", themeName);
          }, theme);
          await page.goto(`${baseURL}${route}`, { waitUntil: "load" });
          await page.waitForNetworkIdle({ idleTime: 500, timeout: 8000 }).catch(() => {});
          await page.evaluate(axeSource);
          const axeResults = (await page.evaluate((tags: string[]) => {
            // @ts-expect-error -- window.axe existe en runtime inyectado vía axeSource.
            return window.axe.run(
              { exclude: [["iframe"]] },
              { runOnly: { type: "tag", values: tags } },
            );
          }, AXE_TAGS)) as RawAxeResults;
          reports.push(summarizeAxeResults(route, theme, axeResults));
        } finally {
          await page.close();
        }
      }
    }
    return reports;
  } finally {
    if (browser) await browser.close();
    await server.close();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const reports = await crawlDashboard();
  const { errors } = printReport(reports);
  if (errors > 0) process.exitCode = 1;
}
