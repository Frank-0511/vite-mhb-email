#!/usr/bin/env node
// @ts-check
/**
 * @fileoverview Checker de accesibilidad de la dashboard (Home/Library/
 * Preview) con axe-core inyectado sobre el Puppeteer ya usado para exportar
 * PNG. Levanta un servidor Vite efímero (no depende de `bun run dev`
 * corriendo), visita rutas fijas en tema claro y oscuro, y reporta
 * violaciones por severidad. Separado de `bun run lint`/`bun run test` por
 * el costo de un navegador real, igual que `validate-email` hoy.
 */

import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import puppeteer from "puppeteer";
import { createServer } from "vite";
import { c as colors, paint } from "../shared/console.js";

const require = createRequire(import.meta.url);
const projectRoot = path.resolve(import.meta.dirname, "../..");

/** Rutas del dashboard a auditar; `/preview` requiere un template válido. */
export const ROUTES = ["/", "/library", "/preview?template=welcome"];

/** Temas a auditar, replicando `document.documentElement.classList` real. */
export const THEMES = /** @type {const} */ (["light", "dark"]);

/** Tags WCAG que corre axe-core (2A, 2AA y 2.1AA). */
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21aa"];

/**
 * Mapea el `impact` de axe-core a la severidad del proyecto.
 * @param {string | null} impact
 * @returns {"ERROR" | "WARNING" | "INFO"}
 */
export function mapImpactToSeverity(impact) {
  if (impact === "critical" || impact === "serious") return "ERROR";
  if (impact === "moderate") return "WARNING";
  return "INFO";
}

/**
 * @typedef {Object} ViolationSummary
 * @property {string} id
 * @property {"ERROR" | "WARNING" | "INFO"} severity
 * @property {string} impact
 * @property {string} help
 * @property {string} helpUrl
 * @property {number} nodesCount
 * @property {string} firstTarget
 */

/**
 * @typedef {Object} RouteReport
 * @property {string} route
 * @property {"light" | "dark"} theme
 * @property {ViolationSummary[]} violations
 */

/**
 * Convierte el resultado crudo de `axe.run()` en un resumen por violación,
 * ordenado por severidad. Función pura: no toca el navegador.
 * @param {string} route
 * @param {"light" | "dark"} theme
 * @param {{ violations: Array<{ id: string, impact: string | null, help: string, helpUrl: string, nodes: Array<{ target: string[] }> }> }} axeResults
 * @returns {RouteReport}
 */
export function summarizeAxeResults(route, theme, axeResults) {
  const severityRank = { ERROR: 0, WARNING: 1, INFO: 2 };
  const violations = axeResults.violations
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

const severityIcon = { ERROR: "❌", WARNING: "⚠️", INFO: "ℹ️" };
const severityColor = { ERROR: colors.red, WARNING: colors.yellow, INFO: colors.blue };

/**
 * Imprime el reporte de accesibilidad agrupado por ruta y tema. Función pura
 * sobre datos ya resumidos (recibe `RouteReport[]`, no toca el navegador).
 * @param {RouteReport[]} reports
 * @returns {{ errors: number, warnings: number, infos: number }}
 */
export function printReport(reports) {
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
 * Puppeteer + axe-core, y devuelve el reporte por ruta/tema. Único punto no
 * cubierto por pruebas unitarias (requiere navegador y servidor reales).
 * @returns {Promise<RouteReport[]>}
 */
export async function crawlDashboard() {
  const server = await createServer({
    configFile: path.resolve(projectRoot, "vite.config.js"),
    server: { port: 0, open: false, strictPort: false },
    logLevel: "warn",
  });
  await server.listen();
  const address = server.httpServer?.address();
  if (!address || typeof address === "string") {
    throw new Error("No se pudo determinar el puerto del servidor Vite efímero.");
  }
  const baseURL = `http://localhost:${address.port}`;
  const axeSource = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf-8");

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    /** @type {RouteReport[]} */
    const reports = [];
    for (const route of ROUTES) {
      for (const theme of THEMES) {
        const page = await browser.newPage();
        try {
          await page.evaluateOnNewDocument((themeName) => {
            // Corre en contexto de navegador (inyectado por Puppeteer), no de Node.
            // eslint-disable-next-line no-undef
            window.localStorage.setItem("app-theme", themeName);
          }, theme);
          // `networkidle0` nunca se cumple en `/preview`: el iframe de
          // renderizado y el editor JSON dejan conexiones abiertas que
          // agotan el timeout de navegación. Se espera la carga y una
          // ventana acotada de inactividad de red, tolerante a que no
          // llegue a cero conexiones.
          await page.goto(`${baseURL}${route}`, { waitUntil: "load" });
          await page.waitForNetworkIdle({ idleTime: 500, timeout: 8000 }).catch(() => {});
          await page.evaluate(axeSource);
          const axeResults = await page.evaluate((tags) => {
            // Corre en contexto de navegador; axe se inyecta en runtime vía axeSource.
            // @ts-expect-error -- window.axe existe en runtime, no en los tipos de Node.
            // eslint-disable-next-line no-undef
            return window.axe.run(
              { exclude: [["iframe"]] },
              { runOnly: { type: "tag", values: tags } },
            );
          }, AXE_TAGS);
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
