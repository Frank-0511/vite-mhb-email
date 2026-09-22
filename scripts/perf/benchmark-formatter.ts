/**
 * @fileoverview Formateador de resultados de benchmark en tablas Markdown.
 */

import type { BenchmarkResult, EnvironmentInfo } from "./benchmark-runner.ts";

/**
 * Formatea los resultados en una tabla Markdown contextualizada.
 */
export function formatMarkdownTable(env: EnvironmentInfo, results: BenchmarkResult[]): string {
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
