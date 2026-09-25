/**
 * @fileoverview CLI y validador para contrastar dist/ contra el baseline versionado.
 */

import { compareSnapshots, formatBaselineDiff, hasBaselineDiff } from "./compare.ts";
import { createDistSnapshot, readBaseline } from "./snapshot.ts";

export interface CheckDistBaselineOptions {
  distDir?: string;
  baselinePath?: string;
}

export interface CheckDistBaselineResult {
  success: boolean;
  message: string;
}

/**
 * Compara los templates compilados en dist/ contra el baseline persistido.
 *
 * @param {CheckDistBaselineOptions} [options]
 * @returns {CheckDistBaselineResult}
 */
export function checkDistBaseline(options: CheckDistBaselineOptions = {}): CheckDistBaselineResult {
  try {
    const baseline = readBaseline(options.baselinePath);
    const actual = createDistSnapshot(options.distDir);
    const diff = compareSnapshots(baseline, actual);
    const message = formatBaselineDiff(diff);
    const success = !hasBaselineDiff(diff);

    return { success, message };
  } catch (err: unknown) {
    const errorMessage = `❌ Error al verificar baseline: ${err instanceof Error ? err.message : String(err)}`;
    return { success: false, message: errorMessage };
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = checkDistBaseline();
  if (result.success) {
    console.log(result.message);
    process.exit(0);
  } else {
    console.error(result.message);
    process.exit(1);
  }
}
