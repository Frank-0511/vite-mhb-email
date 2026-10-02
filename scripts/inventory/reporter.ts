/**
 * @fileoverview Formateo y reporte visual del estado del inventario de migración.
 */

/**
 * Resultado del análisis de una capa individual.
 */
export interface LayerResult {
  key: string;
  name: string;
  targetTask: string;
  baselineJs: number;
  currentJs: number;
  currentTs: number;
  passed: boolean;
  jsFiles: string[];
  tsFiles: string[];
}

/**
 * Resultados consolidados del análisis de inventario global.
 */
export interface InventoryResults {
  layerResults: LayerResult[];
  totalBaselineJs: number;
  totalCurrentJs: number;
  totalCurrentTs: number;
  requireZero?: boolean;
  allPassed: boolean;
  unassignedFiles: string[];
}

/**
 * Genera un reporte formateado en texto / markdown a partir de los resultados.
 */
export function formatInventoryReport(results: InventoryResults): string {
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

  if (results.requireZero && !results.allPassed) {
    lines.push(
      `\n❌ Modo estricto activo (--require-zero): se detectaron archivos JS/MJS pendientes fuera de la allowlist cerrada.`,
    );
  } else if (results.requireZero && results.allPassed) {
    lines.push(
      `\n✅ Modo estricto activo (--require-zero): repositorio migrado a TypeScript con allowlist cerrada (eslint.config.js, maizzle.config.js).`,
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
