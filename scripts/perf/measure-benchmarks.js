#!/usr/bin/env node
/**
 * @fileoverview Script reproducible de medición de rendimiento (benchmarks).
 * Mide tiempos de ejecución para comandos clave del proyecto en Bun y Node.js.
 *
 * Uso:
 *   bun scripts/perf/measure-benchmarks.js
 *   bun scripts/perf/measure-benchmarks.js --iterations=5 --warmup=1
 *   bun scripts/perf/measure-benchmarks.js --json
 */

import { execSync, spawnSync } from "child_process";
import os from "os";
import path from "path";
import { performance } from "perf_hooks";

/**
 * @typedef {Object} BenchmarkResult
 * @property {string} name
 * @property {string} runtime
 * @property {string} command
 * @property {number} iterations
 * @property {number} minMs
 * @property {number} maxMs
 * @property {number} medianMs
 * @property {number} meanMs
 * @property {number[]} samples
 */

/**
 * @typedef {Object} EnvironmentInfo
 * @property {string} os
 * @property {string} arch
 * @property {string} cpuModel
 * @property {string} nodeVersion
 * @property {string} bunVersion
 * @property {string} gitCommit
 * @property {string} timestamp
 */

/**
 * Calcula estadísticas numéricas sobre un conjunto de muestras.
 *
 * @param {number[]} samples - Muestras numéricas en milisegundos.
 * @returns {{ minMs: number, maxMs: number, medianMs: number, meanMs: number }}
 */
export function computeStats(samples) {
  if (!samples || samples.length === 0) {
    return { minMs: 0, maxMs: 0, medianMs: 0, meanMs: 0 };
  }

  const sorted = [...samples].sort((a, b) => a - b);
  const minMs = Math.round(sorted[0]);
  const maxMs = Math.round(sorted[sorted.length - 1]);
  const sum = sorted.reduce((acc, val) => acc + val, 0);
  const meanMs = Math.round(sum / sorted.length);

  const mid = Math.floor(sorted.length / 2);
  const medianMs =
    sorted.length % 2 !== 0
      ? Math.round(sorted[mid])
      : Math.round((sorted[mid - 1] + sorted[mid]) / 2);

  return { minMs, maxMs, medianMs, meanMs };
}

/**
 * Obtiene la información del entorno actual de ejecución.
 *
 * @returns {EnvironmentInfo}
 */
export function getEnvironmentInfo() {
  let gitCommit = "unknown";
  try {
    gitCommit = execSync("git rev-parse --short HEAD", {
      encoding: "utf-8",
    }).trim();
  } catch {
    // Ignore git error if outside repository
  }

  let bunVersion = "unknown";
  try {
    bunVersion = execSync("bun -v", { encoding: "utf-8" }).trim();
  } catch {
    // Ignore bun error if not in PATH
  }

  const cpus = os.cpus();
  const cpuModel = cpus.length > 0 ? cpus[0].model : "Unknown CPU";

  return {
    os: `${os.type()} ${os.release()}`,
    arch: os.arch(),
    cpuModel,
    nodeVersion: process.version,
    bunVersion,
    gitCommit,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Ejecuta un comando y mide su duración en milisegundos.
 *
 * @param {string} command - Comando a ejecutar.
 * @param {Object} [options]
 * @param {string} [options.cwd]
 * @param {Record<string, string>} [options.env]
 * @returns {number} Duración en milisegundos.
 */
export function measureExecution(command, options = {}) {
  const projectRoot = process.cwd();
  const nodeBin = path.join(projectRoot, "node_modules", ".bin");
  const currentPath = process.env.PATH || "";
  const extendedPath = `${nodeBin}${path.delimiter}${currentPath}`;

  const env = {
    ...process.env,
    ...options.env,
    PATH: extendedPath,
  };

  const start = performance.now();
  const result = spawnSync(command, {
    shell: true,
    cwd: options.cwd || projectRoot,
    env,
    stdio: "ignore",
  });
  const end = performance.now();

  if (result.status !== 0) {
    throw new Error(
      `Comando falló con código ${result.status}: ${command}\n${result.stderr ? result.stderr.toString() : ""}`,
    );
  }

  return end - start;
}

/**
 * Ejecuta una suite de benchmark con repeticiones y calentamiento.
 *
 * @param {Object} spec
 * @param {string} spec.name
 * @param {string} spec.runtime
 * @param {string} spec.command
 * @param {number} [iterations=5]
 * @param {number} [warmup=1]
 * @returns {BenchmarkResult}
 */
export function runBenchmark(spec, iterations = 5, warmup = 1) {
  // Warmup iterations (not recorded)
  for (let w = 0; w < warmup; w++) {
    measureExecution(spec.command);
  }

  const samples = [];
  for (let i = 0; i < iterations; i++) {
    const duration = measureExecution(spec.command);
    samples.push(duration);
  }

  const { minMs, maxMs, medianMs, meanMs } = computeStats(samples);

  return {
    name: spec.name,
    runtime: spec.runtime,
    command: spec.command,
    iterations,
    minMs,
    maxMs,
    medianMs,
    meanMs,
    samples,
  };
}

/**
 * Formatea los resultados en una tabla Markdown contextualizada.
 *
 * @param {EnvironmentInfo} env
 * @param {BenchmarkResult[]} results
 * @returns {string}
 */
export function formatMarkdownTable(env, results) {
  const lines = [
    `### Mediciones de Rendimiento (Benchmark)`,
    ``,
    `- **Entorno:** ${env.os} (${env.arch})`,
    `- **CPU:** ${env.cpuModel}`,
    `- **Versiones:** Bun ${env.bunVersion} | Node.js ${env.nodeVersion}`,
    `- **Commit:** \`${env.gitCommit}\` | **Fecha:** ${env.timestamp}`,
    ``,
    `| Tarea / Comando | Runtime | Comando Ejecutado | Repeticiones | Mediana (ms) | Rango [Min - Max] (ms) |`,
    `| :--- | :--- | :--- | :---: | :---: | :---: |`,
  ];

  for (const r of results) {
    const range = `[${r.minMs} - ${r.maxMs}]`;
    lines.push(
      `| **${r.name}** | ${r.runtime} | \`${r.command}\` | ${r.iterations} | ${r.medianMs} ms | ${range} ms |`,
    );
  }

  return lines.join("\n");
}

/**
 * Ejecuta la suite estándar de benchmarks para MHB-13.
 *
 * @param {Object} [options]
 * @param {number} [options.iterations=5]
 * @param {number} [options.warmup=1]
 * @param {boolean} [options.json=false]
 * @returns {void}
 */
export function main(options = {}) {
  const iterations = options.iterations ?? 5;
  const warmup = options.warmup ?? 1;
  const jsonOutput = options.json ?? false;

  const env = getEnvironmentInfo();

  /** @type {Array<{ name: string, runtime: string, command: string }>} */
  const benchmarkTasks = [
    {
      name: "Typecheck (tsc)",
      runtime: "Bun",
      command: "bun ./node_modules/typescript/bin/tsc --noEmit",
    },
    {
      name: "Typecheck (tsc)",
      runtime: "Node.js",
      command: "node ./node_modules/typescript/bin/tsc --noEmit",
    },
    {
      name: "Build Pipeline (Maizzle)",
      runtime: "Bun",
      command: "bun scripts/build/build.ts",
    },
    {
      name: "Build Pipeline (Maizzle)",
      runtime: "Node.js",
      command: "node scripts/build/build.ts",
    },
    {
      name: "Email Validator",
      runtime: "Bun",
      command: "bun scripts/validators/validate-email-html.js",
    },
    {
      name: "Email Validator",
      runtime: "Node.js",
      command: "node scripts/validators/validate-email-html.js",
    },
    {
      name: "Unit Test Suite",
      runtime: "Bun",
      command: "bun test",
    },
  ];

  if (!jsonOutput) {
    console.log(`\n⏱️  Ejecutando benchmarks (${iterations} iteraciones, ${warmup} warmup)...`);
    console.log(
      `   Entorno: ${env.os} (${env.arch}) | Bun ${env.bunVersion} | Node ${env.nodeVersion}\n`,
    );
  }

  /** @type {BenchmarkResult[]} */
  const results = [];

  for (const task of benchmarkTasks) {
    if (!jsonOutput) {
      process.stdout.write(`   • Midiendo ${task.name} (${task.runtime})... `);
    }
    const res = runBenchmark(task, iterations, warmup);
    results.push(res);
    if (!jsonOutput) {
      console.log(`mediana: ${res.medianMs} ms [${res.minMs} - ${res.maxMs} ms]`);
    }
  }

  if (jsonOutput) {
    console.log(JSON.stringify({ environment: env, results }, null, 2));
  } else {
    console.log("\n" + formatMarkdownTable(env, results) + "\n");
  }
}

// Ejecución directa de CLI
const isDirectRun =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);

if (isDirectRun) {
  const args = process.argv.slice(2);
  let iterations = 5;
  let warmup = 1;
  let json = false;

  for (const arg of args) {
    if (arg.startsWith("--iterations=")) {
      iterations = parseInt(arg.split("=")[1], 10) || 5;
    } else if (arg.startsWith("--warmup=")) {
      warmup = parseInt(arg.split("=")[1], 10) || 0;
    } else if (arg === "--json") {
      json = true;
    }
  }

  try {
    main({ iterations, warmup, json });
  } catch (err) {
    console.error("Error en benchmark:", err);
    process.exit(1);
  }
}
