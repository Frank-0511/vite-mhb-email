/**
 * @fileoverview Verificación de coherencia entre dist/esp-manifest.json y el baseline versionado.
 */

import { isEspManifest } from "../../esp/manifest/guard.ts";
import type { EspManifestTemplate } from "../../esp/manifest/types.ts";
import type { DistSnapshot } from "./baseline-guard.ts";

/**
 * Compara los datos del manifiesto ESP contra el baseline persistido de dist/.
 *
 * @param manifestRaw Contenido deserializado o desconocido del manifiesto.
 * @param baseline Snapshot oficial de referencia de templates y variables ESP.
 * @returns Lista de discrepancias detectadas (vacía si todo es coherente).
 */
export function compareManifestWithBaseline(
  manifestRaw: unknown,
  baseline: DistSnapshot,
): string[] {
  if (!isEspManifest(manifestRaw)) {
    return ["El contenido del manifiesto no cumple el contrato EspManifest válido."];
  }

  const errors: string[] = [];
  const baselineFiles = new Set(Object.keys(baseline.templates));

  const manifestByFile = new Map<string, { key: string; template: EspManifestTemplate }>();
  for (const [key, template] of Object.entries(manifestRaw.templates)) {
    manifestByFile.set(template.file, { key, template });
  }

  for (const baselineFile of baselineFiles) {
    if (!manifestByFile.has(baselineFile)) {
      errors.push(
        `Plantilla "${baselineFile}" presente en baseline pero no encontrada en el manifiesto.`,
      );
    }
  }

  for (const [file, { key, template }] of manifestByFile.entries()) {
    if (!baselineFiles.has(file)) {
      errors.push(
        `Plantilla "${file}" (${key}) presente en manifiesto pero no registrada en baseline.`,
      );
      continue;
    }

    const baselineEntry = baseline.templates[file];
    const sortedRequired = [...template.requiredVariables].sort();
    const sortedBaseline = [...baselineEntry.espVariables].sort();

    if (JSON.stringify(sortedRequired) !== JSON.stringify(sortedBaseline)) {
      errors.push(
        `Plantilla "${file}": requiredVariables del manifiesto (${sortedRequired.join(", ")}) no coincide con espVariables del baseline (${sortedBaseline.join(", ")}).`,
      );
    }

    const tagKeys = Object.keys(template.legacy.tags).sort();
    if (JSON.stringify(tagKeys) !== JSON.stringify(sortedRequired)) {
      errors.push(
        `Plantilla "${file}": las claves de legacy.tags no coinciden con requiredVariables.`,
      );
    }
  }

  return errors;
}
