#!/usr/bin/env node
/**
 * @fileoverview Control determinista de inventario para la migración gradual a TypeScript.
 *
 * Clasifica los archivos JavaScript, MJS y TypeScript propios por capa (MHB-30 a MHB-34)
 * y valida que el recuento de archivos JS/MJS no supere el baseline versionado decreciente.
 *
 * Uso:
 *   bun scripts/inventory/check-migration-inventory.js
 */

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../..");

/**
 * Ignora directorios de dependencias, builds y metadatos.
 * @type {Set<string>}
 */
const IGNORED_DIRECTORIES = new Set([
  "node_modules",
  "dist",
  ".git",
  ".agent",
  ".agents",
  ".claude",
  ".codex",
  ".github",
  ".gemini",
  ".cache",
  ".temp-screenshots",
  ".superpowers",
  "types",
]);

/**
 * Escanea recursivamente el directorio del proyecto recolectando archivos JS, MJS y TS propios.
 *
 * @param {string} rootDir
 * @returns {{ jsFiles: string[], tsFiles: string[] }}
 */
export function collectProjectFiles(rootDir) {
  const jsFiles = [];
  const tsFiles = [];

  function walk(currentDir) {
    const entries = readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      const relativePath = path.relative(rootDir, fullPath).replace(/\\/g, "/");

      if (entry.isDirectory()) {
        if (!IGNORED_DIRECTORIES.has(entry.name)) {
          walk(fullPath);
        }
      } else if (entry.isFile()) {
        if (entry.name.endsWith(".d.ts")) {
          // Excluir archivos de declaración ambiental de tipos
          continue;
        }

        if (entry.name.endsWith(".js") || entry.name.endsWith(".mjs")) {
          jsFiles.push(relativePath);
        } else if (entry.name.endsWith(".ts")) {
          tsFiles.push(relativePath);
        }
      }
    }
  }

  walk(rootDir);
  return { jsFiles, tsFiles };
}

/**
 * Determina si una ruta relativa coincide con los patrones de una capa.
 *
 * @param {string} relativePath
 * @param {string} layerKey
 * @returns {boolean}
 */
export function matchesLayer(relativePath, layerKey) {
  switch (layerKey) {
    case "layer-1-core":
      return (
        relativePath.startsWith("scripts/shared/") ||
        relativePath.startsWith("scripts/build/") ||
        relativePath.startsWith("scripts/esp/") ||
        relativePath.startsWith("scripts/validators/") ||
        relativePath.startsWith("src/emails/partials/")
      );

    case "layer-2-cli":
      return (
        relativePath.startsWith("scripts/cli/") ||
        relativePath.startsWith("scripts/export/") ||
        relativePath.startsWith("scripts/generators/") ||
        relativePath.startsWith("scripts/mail/")
      );

    case "layer-3-vite":
      return (
        relativePath.startsWith("scripts/vite/") ||
        relativePath === "vite.config.js" ||
        relativePath === "vite.config.ts"
      );

    case "layer-4-web":
      return relativePath.startsWith("src/web/");

    case "layer-5-tooling":
      return (
        relativePath.startsWith("scripts/ai/") ||
        relativePath.startsWith("scripts/perf/") ||
        relativePath.startsWith("scripts/inventory/") ||
        (relativePath !== "vite.config.js" &&
          relativePath !== "vite.config.ts" &&
          (relativePath.endsWith(".config.js") ||
            relativePath.endsWith(".config.ts") ||
            relativePath.endsWith(".config.mjs")))
      );

    default:
      return false;
  }
}

/**
 * Analiza el inventario del repositorio contra el baseline especificado.
 *
 * @param {string} rootDir
 * @param {object} baselineData
 * @returns {{
 *   layerResults: Array<{
 *     key: string,
 *     name: string,
 *     targetTask: string,
 *     baselineJs: number,
 *     currentJs: number,
 *     currentTs: number,
 *     passed: boolean,
 *     jsFiles: string[],
 *     tsFiles: string[]
 *   }>,
 *   totalBaselineJs: number,
 *   totalCurrentJs: number,
 *   totalCurrentTs: number,
 *   allPassed: boolean,
 *   unassignedFiles: string[]
 * }}
 */
/**
 * Analiza el inventario del repositorio contra el baseline especificado.
 *
 * @param {string} rootDir
 * @param {object} baselineData
 * @param {{ requireZero?: boolean }} [options]
 * @returns {{
 *   layerResults: Array<{
 *     key: string,
 *     name: string,
 *     targetTask: string,
 *     baselineJs: number,
 *     currentJs: number,
 *     currentTs: number,
 *     passed: boolean,
 *     jsFiles: string[],
 *     tsFiles: string[]
 *   }>,
 *   totalBaselineJs: number,
 *   totalCurrentJs: number,
 *   totalCurrentTs: number,
 *   requireZero?: boolean,
 *   allPassed: boolean,
 *   unassignedFiles: string[]
 * }}
 */
export function checkInventory(rootDir, baselineData, options = {}) {
  const requireZero = Boolean(options.requireZero);
  const { jsFiles, tsFiles } = collectProjectFiles(rootDir);
  const layers = baselineData.layers;

  const assignedJs = new Set();
  const assignedTs = new Set();

  const layerResults = Object.entries(layers).map(([key, config]) => {
    const layerJs = jsFiles.filter((file) => {
      if (matchesLayer(file, key)) {
        assignedJs.add(file);
        return true;
      }
      return false;
    });

    const layerTs = tsFiles.filter((file) => {
      if (matchesLayer(file, key)) {
        assignedTs.add(file);
        return true;
      }
      return false;
    });

    const passed = requireZero ? layerJs.length === 0 : layerJs.length <= config.baselineJsCount;

    return {
      key,
      name: config.name,
      targetTask: config.targetTask,
      baselineJs: config.baselineJsCount,
      currentJs: layerJs.length,
      currentTs: layerTs.length,
      passed,
      jsFiles: layerJs,
      tsFiles: layerTs,
    };
  });

  const unassignedFiles = [
    ...jsFiles.filter((file) => !assignedJs.has(file)),
    ...tsFiles.filter((file) => !assignedTs.has(file)),
  ];

  const totalBaselineJs = baselineData.totalBaselineJsCount;
  const totalCurrentJs = jsFiles.length;
  const totalCurrentTs = tsFiles.length;
  const allPassed =
    layerResults.every((layer) => layer.passed) &&
    (requireZero ? totalCurrentJs === 0 : totalCurrentJs <= totalBaselineJs) &&
    unassignedFiles.length === 0;

  return {
    layerResults,
    totalBaselineJs,
    totalCurrentJs,
    totalCurrentTs,
    requireZero,
    allPassed,
    unassignedFiles,
  };
}

/**
 * Genera un reporte formateado en texto / markdown a partir de los resultados.
 *
 * @param {ReturnType<typeof checkInventory>} results
 * @returns {string}
 */
export function formatInventoryReport(results) {
  const headerNote = results.requireZero ? " [MODO --require-zero ACTIVO]" : "";
  const lines = [
    `📊 Control de Inventario de Migración TypeScript (MHB-29 — MHB-34)${headerNote}`,
    "═══════════════════════════════════════════════════════════════════════════════════════════",
    "| Capa / Tarea Asignada               | Baseline JS | Actual JS | Actual TS | Estado      |",
    "| :---------------------------------- | ----------: | --------: | --------: | :---------- |",
  ];

  for (const layer of results.layerResults) {
    const label = `${layer.targetTask} (${layer.name})`.padEnd(35);
    const baseline = String(layer.baselineJs).padStart(11);
    const currentJs = String(layer.currentJs).padStart(9);
    const currentTs = String(layer.currentTs).padStart(9);
    const status = layer.passed
      ? (layer.currentJs === 0 ? "✅ Migrado" : "🟢 Conforme").padEnd(11)
      : "❌ Excedido".padEnd(11);

    lines.push(`| ${label} | ${baseline} | ${currentJs} | ${currentTs} | ${status} |`);
  }

  lines.push(
    "| ─────────────────────────────────── | ─────────── | ───────── | ───────── | ─────────── |",
  );

  const totalLabel = "TOTAL PROYECTO".padEnd(35);
  const totalBaseline = String(results.totalBaselineJs).padStart(11);
  const totalJs = String(results.totalCurrentJs).padStart(9);
  const totalTs = String(results.totalCurrentTs).padStart(9);
  const totalStatus = results.allPassed ? "🟢 Conforme".padEnd(11) : "❌ Fallido".padEnd(11);

  lines.push(`| ${totalLabel} | ${totalBaseline} | ${totalJs} | ${totalTs} | ${totalStatus} |`);
  lines.push(
    "═══════════════════════════════════════════════════════════════════════════════════════════",
  );

  if (results.requireZero && results.totalCurrentJs > 0) {
    lines.push(
      `\n❌ Modo estricto activo (--require-zero): se requiere que el conteo de JS/MJS sea 0, pero aún quedan ${results.totalCurrentJs} archivos.`,
    );
  }

  if (results.unassignedFiles.length > 0) {
    lines.push("\n⚠️ Archivos sin capa asignada detectados:");
    for (const f of results.unassignedFiles) {
      lines.push(`  - ${f}`);
    }
  }

  return lines.join("\n");
}

function main() {
  const requireZero =
    process.argv.includes("--require-zero") || process.argv.includes("--strict-zero");
  const baselinePath = path.join(__dirname, "inventory-baseline.json");
  const baselineData = JSON.parse(readFileSync(baselinePath, "utf8"));

  const results = checkInventory(projectRoot, baselineData, { requireZero });
  const report = formatInventoryReport(results);

  console.log(`\n${report}\n`);

  if (!results.allPassed) {
    if (requireZero && results.totalCurrentJs > 0) {
      console.error(
        `❌ Cierre estricto fallido: aún quedan ${results.totalCurrentJs} archivos JS/MJS propios pendientes de migrar a TypeScript.`,
      );
    } else {
      console.error(
        "❌ Control de inventario fallido: hay archivos JS/MJS no autorizados o capas que exceden su baseline.",
      );
    }
    process.exit(1);
  } else {
    console.log("✅ Control de inventario conforme con el baseline decreciente.\n");
  }
}

if (process.argv[1] === __filename) {
  main();
}
