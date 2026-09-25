/**
 * @fileoverview CLI para actualizar el baseline de dist/ de forma explícita y justificada.
 */

import { compareSnapshots, hasBaselineDiff } from "./compare.ts";
import {
  createDistSnapshot,
  getDefaultBaselinePath,
  readBaseline,
  writeBaseline,
} from "./snapshot.ts";

export interface UpdateDistBaselineOptions {
  distDir?: string;
  baselinePath?: string;
}

/**
 * Regenera y persiste el archivo de baseline a partir del dist/ actual.
 *
 * @param {UpdateDistBaselineOptions} [options]
 * @returns {void}
 */
export function updateDistBaseline(options: UpdateDistBaselineOptions = {}): void {
  const baselinePath = options.baselinePath ?? getDefaultBaselinePath();
  const actual = createDistSnapshot(options.distDir);

  let diffSummary: string;
  try {
    const previous = readBaseline(baselinePath);
    const diff = compareSnapshots(previous, actual);
    if (!hasBaselineDiff(diff)) {
      diffSummary = "Sin cambios frente al baseline anterior.";
    } else {
      const parts: string[] = [];
      if (diff.added.length > 0) parts.push(`${diff.added.length} añadido(s)`);
      if (diff.removed.length > 0) parts.push(`${diff.removed.length} eliminado(s)`);
      if (diff.hashChanged.length > 0) parts.push(`${diff.hashChanged.length} modificado(s)`);
      if (Object.keys(diff.espLost).length > 0) {
        parts.push(`${Object.keys(diff.espLost).length} con ESP perdidas`);
      }
      if (Object.keys(diff.espAdded).length > 0) {
        parts.push(`${Object.keys(diff.espAdded).length} con ESP añadidas`);
      }
      diffSummary = `Diferencias previas: ${parts.join(", ")}`;
    }
  } catch {
    diffSummary = "No existía baseline previo válido.";
  }

  writeBaseline(actual, baselinePath);

  const templateCount = Object.keys(actual.templates).length;
  console.log(
    `✅ Baseline actualizado exitosamente en ${baselinePath} (${templateCount} templates).`,
  );
  console.log(`ℹ️  ${diffSummary}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  updateDistBaseline();
}
