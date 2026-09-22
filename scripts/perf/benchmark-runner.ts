/**
 * @fileoverview Lógica de medición y cálculo estadístico para benchmarks.
 */

import { execSync, spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { performance } from "node:perf_hooks";

export interface BenchmarkStats {
  minMs: number;
  maxMs: number;
  medianMs: number;
  meanMs: number;
}

export interface BenchmarkResult extends BenchmarkStats {
  name: string;
  runtime: string;
  command: string;
  iterations: number;
  samples: number[];
}

export interface EnvironmentInfo {
  os: string;
  arch: string;
  cpuModel: string;
  nodeVersion: string;
  bunVersion: string;
  gitCommit: string;
  timestamp: string;
}

export interface BenchmarkSpec {
  name: string;
  runtime: string;
  command: string;
}

export interface MeasureExecutionOptions {
  cwd?: string;
  env?: Record<string, string>;
}

/**
 * Calcula estadísticas numéricas sobre un conjunto de muestras.
 */
export function computeStats(samples: number[]): BenchmarkStats {
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
 */
export function getEnvironmentInfo(): EnvironmentInfo {
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
 */
export function measureExecution(command: string, options: MeasureExecutionOptions = {}): number {
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
 */
export function runBenchmark(spec: BenchmarkSpec, iterations = 5, warmup = 1): BenchmarkResult {
  // Warmup iterations (not recorded)
  for (let w = 0; w < warmup; w++) {
    measureExecution(spec.command);
  }

  const samples: number[] = [];
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
