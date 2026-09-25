/**
 * @fileoverview Comparación y formateo de diferencias entre DistSnapshots.
 */

import type { DistSnapshot } from "./baseline-guard.ts";

export interface BaselineDiff {
  added: string[];
  removed: string[];
  hashChanged: string[];
  espLost: Record<string, string[]>;
  espAdded: Record<string, string[]>;
}

/**
 * Compara dos snapshots y genera el diff detallado de templates, hashes y variables ESP.
 *
 * @param {DistSnapshot} baseline Snapshot de referencia versionado
 * @param {DistSnapshot} actual Snapshot actual extraído de dist/
 * @returns {BaselineDiff}
 */
export function compareSnapshots(baseline: DistSnapshot, actual: DistSnapshot): BaselineDiff {
  const baselineKeys = Object.keys(baseline.templates).sort();
  const actualKeys = Object.keys(actual.templates).sort();

  const baselineSet = new Set(baselineKeys);
  const actualSet = new Set(actualKeys);

  const added = actualKeys.filter((k) => !baselineSet.has(k));
  const removed = baselineKeys.filter((k) => !actualSet.has(k));

  const hashChanged: string[] = [];
  const espLost: Record<string, string[]> = {};
  const espAdded: Record<string, string[]> = {};

  const commonTemplates = baselineKeys.filter((k) => actualSet.has(k));

  for (const template of commonTemplates) {
    const baseEntry = baseline.templates[template];
    const actualEntry = actual.templates[template];

    if (baseEntry.sha256 !== actualEntry.sha256) {
      hashChanged.push(template);
    }

    const baseEspSet = new Set(baseEntry.espVariables);
    const actualEspSet = new Set(actualEntry.espVariables);

    const lost = baseEntry.espVariables.filter((v) => !actualEspSet.has(v)).sort();
    const addedEsp = actualEntry.espVariables.filter((v) => !baseEspSet.has(v)).sort();

    if (lost.length > 0) {
      espLost[template] = lost;
    }
    if (addedEsp.length > 0) {
      espAdded[template] = addedEsp;
    }
  }

  return {
    added,
    removed,
    hashChanged,
    espLost,
    espAdded,
  };
}

/**
 * Determina si el diff contiene alguna discrepancia con respecto al baseline.
 *
 * @param {BaselineDiff} diff
 * @returns {boolean}
 */
export function hasBaselineDiff(diff: BaselineDiff): boolean {
  return (
    diff.added.length > 0 ||
    diff.removed.length > 0 ||
    diff.hashChanged.length > 0 ||
    Object.keys(diff.espLost).length > 0 ||
    Object.keys(diff.espAdded).length > 0
  );
}

/**
 * Formatea el diff en un reporte de consola claro y accionable.
 *
 * @param {BaselineDiff} diff
 * @returns {string}
 */
export function formatBaselineDiff(diff: BaselineDiff): string {
  if (!hasBaselineDiff(diff)) {
    return "✅ dist/ coincide exactamente con el baseline.";
  }

  const lines: string[] = ["❌ Se detectaron diferencias frente al baseline de dist/:"];

  for (const template of diff.removed) {
    lines.push(
      `  ❌ [eliminado] ${template}: template presente en el baseline pero no encontrado en dist/`,
    );
  }

  for (const template of diff.added) {
    lines.push(`  ❌ [añadido] ${template}: template no registrado en el baseline`);
  }

  for (const template of diff.hashChanged) {
    lines.push(
      `  ❌ [hash-modificado] ${template}: el contenido HTML cambió (hash SHA-256 no coincide)`,
    );
  }

  for (const [template, vars] of Object.entries(diff.espLost)) {
    const formattedVars = vars.map((v) => `{{ ${v} }}`).join(", ");
    lines.push(`  ❌ [esp-perdida] ${template}: variable(s) ESP eliminada(s): ${formattedVars}`);
  }

  for (const [template, vars] of Object.entries(diff.espAdded)) {
    const formattedVars = vars.map((v) => `{{ ${v} }}`).join(", ");
    lines.push(`  ⚠️  [esp-nueva] ${template}: variable(s) ESP añadida(s): ${formattedVars}`);
  }

  lines.push("");
  lines.push(
    "💡 Si el cambio es intencional y el ID lo autoriza (MHB-44/MHB-38), ejecutar `bun run update:dist-baseline` y justificar por template en STATUS.md.",
  );

  return lines.join("\n");
}
