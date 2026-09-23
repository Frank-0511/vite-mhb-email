#!/usr/bin/env node
/**
 * @fileoverview Script reproducible de medición de rendimiento (benchmarks).
 * Mide tiempos de ejecución para comandos clave del proyecto en Bun y Node.js.
 *
 * Uso:
 *   bun scripts/perf/measure-benchmarks.ts
 *   bun scripts/perf/measure-benchmarks.ts --iterations=5 --warmup=1
 *   bun scripts/perf/measure-benchmarks.ts --json
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import { formatMarkdownTable } from "./benchmark-formatter.ts";
import type { BenchmarkResult, BenchmarkSpec } from "./benchmark-runner.ts";
import { getEnvironmentInfo, runBenchmark } from "./benchmark-runner.ts";

export interface MainBenchmarkOptions {
  iterations?: number;
  warmup?: number;
  json?: boolean;
}

/**
 * Tareas estándar de benchmark para MHB-13.
 */
export const BENCHMARK_TASKS: BenchmarkSpec[] = [
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
    command: "bun scripts/validators/validate-email-html.ts",
  },
  {
    name: "Email Validator",
    runtime: "Node.js",
    command: "node scripts/validators/validate-email-html.ts",
  },
  {
    name: "Unit Test Suite",
    runtime: "Bun",
    command: "bun test",
  },
];

/**
 * Ejecuta la suite estándar de benchmarks para MHB-13.
 */
export function main(options: MainBenchmarkOptions = {}): void {
  const iterations = options.iterations ?? 5;
  const warmup = options.warmup ?? 1;
  const jsonOutput = options.json ?? false;

  const env = getEnvironmentInfo();

  if (!jsonOutput) {
    console.log(`\n⏱️  Ejecutando benchmarks (${iterations} iteraciones, ${warmup} warmup)...`);
    console.log(
      `   Entorno: ${env.os} (${env.arch}) | Bun ${env.bunVersion} | Node ${env.nodeVersion}\n`,
    );
  }

  const results: BenchmarkResult[] = [];

  for (const task of BENCHMARK_TASKS) {
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
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

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
