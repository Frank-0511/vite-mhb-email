#!/usr/bin/env node
/**
 * @fileoverview Control determinista de inventario para la migración gradual a TypeScript.
 *
 * Clasifica los archivos JavaScript, MJS y TypeScript propios por capa (MHB-30 a MHB-34)
 * y valida que el recuento de archivos JS/MJS no supere el baseline versionado decreciente
 * o alcance cero en modo estricto respetando la allowlist cerrada de MHB-42.
 *
 * Uso:
 *   bun scripts/inventory/check-migration-inventory.ts [--require-zero]
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { BaselineData } from "./parser.ts";
import { collectProjectFiles, matchesLayer } from "./parser.ts";
import type { InventoryResults, LayerResult } from "./reporter.ts";
import { formatInventoryReport } from "./reporter.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../..");

/**
 * Allowlist cerrada aprobada en MHB-42:
 * 1. eslint.config.js (excepción obligatoria por jiti >= 2.2.0 en ESLint 10.11)
 * 2. maizzle.config.js (wrapper de 1 línea a maizzle.config.ts para maizzle build)
 */
export const CLOSED_JS_ALLOWLIST = new Set<string>(["eslint.config.js", "maizzle.config.js"]);

/**
 * Opciones para la verificación de inventario.
 */
export interface CheckInventoryOptions {
  requireZero?: boolean;
}

/**
 * Analiza el inventario del repositorio contra el baseline especificado.
 */
export function checkInventory(
  rootDir: string,
  baselineData: BaselineData,
  options: CheckInventoryOptions = {},
): InventoryResults {
  const requireZero = Boolean(options.requireZero);
  const { jsFiles, tsFiles } = collectProjectFiles(rootDir);
  const layers = baselineData.layers;

  const assignedJs = new Set<string>();
  const assignedTs = new Set<string>();

  const layerResults: LayerResult[] = Object.entries(layers).map(([key, config]) => {
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

    const unallowedLayerJs = layerJs.filter((file) => !CLOSED_JS_ALLOWLIST.has(file));
    const passed = requireZero
      ? unallowedLayerJs.length === 0
      : layerJs.length <= config.baselineJsCount;

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
  const unallowedTotalJs = jsFiles.filter((file) => !CLOSED_JS_ALLOWLIST.has(file));

  const allPassed =
    layerResults.every((layer) => layer.passed) &&
    (requireZero ? unallowedTotalJs.length === 0 : totalCurrentJs <= totalBaselineJs) &&
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

export function main(): void {
  const requireZero =
    process.argv.includes("--require-zero") || process.argv.includes("--strict-zero");
  const baselinePath = path.join(__dirname, "inventory-baseline.json");
  const baselineData = JSON.parse(readFileSync(baselinePath, "utf8")) as BaselineData;

  const results = checkInventory(projectRoot, baselineData, { requireZero });
  const report = formatInventoryReport(results);

  console.log(`\n${report}\n`);

  if (!results.allPassed) {
    if (requireZero) {
      console.error(
        "❌ Cierre estricto fallido: aún quedan archivos JS/MJS propios fuera de la allowlist cerrada pendientes de migrar a TypeScript.",
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
