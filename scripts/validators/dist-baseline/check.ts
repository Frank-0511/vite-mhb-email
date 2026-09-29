/**
 * @fileoverview CLI y validador para contrastar dist/ contra el baseline versionado.
 */

import fs from "node:fs";
import path from "node:path";
import { ESP_MANIFEST_FILENAME } from "../../shared/contracts/constants/esp-contract.ts";
import { getProjectPaths } from "../../shared/io/paths.ts";
import { compareSnapshots, formatBaselineDiff, hasBaselineDiff } from "./compare.ts";
import { compareManifestWithBaseline } from "./manifest-check.ts";
import { createDistSnapshot, readBaseline } from "./snapshot.ts";

export interface CheckDistBaselineOptions {
  distDir?: string;
  baselinePath?: string;
  manifestPath?: string;
}

export interface CheckDistBaselineResult {
  success: boolean;
  message: string;
}

/**
 * Compara los templates compilados en dist/ y el manifiesto ESP contra el baseline persistido.
 *
 * @param {CheckDistBaselineOptions} [options]
 * @returns {CheckDistBaselineResult}
 */
export function checkDistBaseline(options: CheckDistBaselineOptions = {}): CheckDistBaselineResult {
  try {
    const baseline = readBaseline(options.baselinePath);
    const actual = createDistSnapshot(options.distDir);
    const diff = compareSnapshots(baseline, actual);
    const diffFailed = hasBaselineDiff(diff);
    const message = formatBaselineDiff(diff);

    const distDir = options.distDir ?? getProjectPaths(process.cwd()).distDir;
    const manifestPath = options.manifestPath ?? path.join(distDir, ESP_MANIFEST_FILENAME);

    if (!fs.existsSync(manifestPath)) {
      const missingError = "❌ Falta dist/esp-manifest.json; ejecuta `bun run build`";
      const finalMessage = diffFailed ? `${message}\n${missingError}` : missingError;
      return { success: false, message: finalMessage };
    }

    let manifestRaw: unknown;
    try {
      manifestRaw = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    } catch {
      manifestRaw = null;
    }

    const manifestErrors = compareManifestWithBaseline(manifestRaw, baseline);
    if (manifestErrors.length > 0) {
      const manifestMsg = [
        "❌ Se detectaron discrepancias en esp-manifest.json frente al baseline:",
        ...manifestErrors.map((err) => `  ❌ ${err}`),
      ].join("\n");
      const finalMessage = diffFailed ? `${message}\n${manifestMsg}` : manifestMsg;
      return { success: false, message: finalMessage };
    }

    if (diffFailed) {
      return { success: false, message };
    }

    return { success: true, message };
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
