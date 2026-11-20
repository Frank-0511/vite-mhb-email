#!/usr/bin/env node
/**
 * @fileoverview Evidencia técnica headless de los emails de dist/: renderiza
 * cada HTML en Chromium (escritorio y móvil), corre axe-core y guarda capturas
 * y un resumen JSON. No sustituye pruebas en clientes de correo reales.
 */

import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { basename, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import puppeteer, { type Page } from "puppeteer";
import { summarize, type ViewportName, type EmailRunResult } from "./summary.ts";

const require = createRequire(import.meta.url);
const projectRoot = resolve(import.meta.dirname ?? ".", "../../..");
const distDir = join(projectRoot, "dist");
const outDir = join(projectRoot, "docs/evidence/mhb-14/headless");

/** Viewports fijos: escritorio y móvil estrecho. */
const VIEWPORTS: ReadonlyArray<{ name: ViewportName; width: number; height: number }> = [
  { name: "desktop", width: 680, height: 900 },
  { name: "mobile", width: 375, height: 812 },
];

/** Tags WCAG que corre axe-core (2A, 2AA y 2.1AA). */
const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21aa"];

interface AxeWindow {
  axe: {
    run(
      context: Document,
      options: { runOnly: { type: "tag"; values: string[] } },
    ): Promise<{ violations: Array<{ id: string; impact: string | null; nodes: unknown[] }> }>;
  };
}

/** Lee el DOM renderizado y devuelve las señales estructurales del email. */
async function inspectDom(
  page: Page,
): Promise<
  Omit<EmailRunResult, "file" | "viewport" | "axeViolations" | "consoleErrors" | "failedRequests">
> {
  return page.evaluate(() => ({
    title: document.title,
    hasDoctype: document.doctype !== null,
    overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    espVarsInText: /\{\{[^}]+\}\}/.test(document.body.innerText),
    imagesWithoutAlt: [...document.images].filter((img) => !img.hasAttribute("alt")).length,
  }));
}

/** Corre axe-core sobre la página ya cargada y resume las violaciones. */
async function runAxe(page: Page, axeSource: string): Promise<EmailRunResult["axeViolations"]> {
  await page.addScriptTag({ content: axeSource });
  return page.evaluate(async (tags: string[]) => {
    const host = window as unknown as AxeWindow;
    const result = await host.axe.run(document, { runOnly: { type: "tag", values: tags } });
    return result.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      nodes: violation.nodes.length,
    }));
  }, AXE_TAGS);
}

/** Renderiza un archivo en un viewport y devuelve su resultado. */
async function renderEmail(
  browser: Awaited<ReturnType<typeof puppeteer.launch>>,
  file: string,
  viewport: (typeof VIEWPORTS)[number],
  axeSource: string,
): Promise<EmailRunResult> {
  const page = await browser.newPage();
  const consoleErrors: string[] = [];
  const failedRequests: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("requestfailed", (request) => {
    failedRequests.push(
      `${request.url().split("?")[0]} (${request.failure()?.errorText ?? "unknown"})`,
    );
  });

  await page.setViewport({ width: viewport.width, height: viewport.height });
  await page
    .goto(pathToFileURL(join(distDir, file)).href, { waitUntil: "networkidle0", timeout: 30000 })
    .catch((error: unknown) => {
      consoleErrors.push(`goto: ${error instanceof Error ? error.message : "unknown"}`);
    });

  const dom = await inspectDom(page);
  const axeViolations = await runAxe(page, axeSource);
  const slug = basename(file, ".html");
  await page.screenshot({ path: join(outDir, `${slug}-${viewport.name}.png`), fullPage: true });
  await page.close();

  return { file, viewport: viewport.name, ...dom, axeViolations, consoleErrors, failedRequests };
}

/** Punto de entrada: renderiza todos los HTML de dist/ y escribe resultados. */
async function main(): Promise<void> {
  mkdirSync(outDir, { recursive: true });
  const axeSource = readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
  const files = readdirSync(distDir)
    .filter((name) => name.endsWith(".html"))
    .sort();

  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
  const results: EmailRunResult[] = [];
  try {
    for (const file of files) {
      for (const viewport of VIEWPORTS) {
        results.push(await renderEmail(browser, file, viewport, axeSource));
      }
    }
  } finally {
    await browser.close();
  }

  writeFileSync(join(outDir, "results.json"), `${JSON.stringify(results, null, 2)}\n`);
  console.log(summarize(results));
}

await main();
