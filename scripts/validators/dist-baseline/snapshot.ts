/**
 * @fileoverview Generación y lectura de snapshots de templates HTML compilados en dist/.
 */

import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { ESP_VAR_RE, TRIPLE_STASH_RE } from "../../esp/constants.ts";
import { getProjectPaths } from "../../shared/io/paths.ts";
import { assertDistSnapshot, type DistSnapshot, type TemplateSnapshot } from "./baseline-guard.ts";

/**
 * Devuelve la ruta por defecto del archivo de baseline versionado.
 *
 * @returns {string}
 */
export function getDefaultBaselinePath(): string {
  return path.join(import.meta.dirname ?? ".", "baseline.json");
}

/**
 * Extrae y ordena alfabéticamente las variables ESP {{ var }} de un contenido HTML.
 *
 * @param {string} html
 * @returns {string[]} Lista ordenada de variables únicas
 */
export function extractEspVariablesFromHtml(html: string): string[] {
  const sanitized = html.replace(TRIPLE_STASH_RE, "");
  const vars = new Set<string>();
  for (const match of sanitized.matchAll(ESP_VAR_RE)) {
    if (match[1]) {
      vars.add(match[1]);
    }
  }
  return Array.from(vars).sort();
}

/**
 * Genera un DistSnapshot calculando el SHA-256 de los bytes crudos y las variables ESP.
 *
 * @param {string} [distDir] Directorio a escanear (por defecto el distDir del proyecto)
 * @returns {DistSnapshot}
 */
export function createDistSnapshot(distDir?: string): DistSnapshot {
  const targetDir = distDir ?? getProjectPaths(process.cwd()).distDir;
  const templates: Record<string, TemplateSnapshot> = {};

  if (!fs.existsSync(targetDir)) {
    return { version: 1, templates };
  }

  const files = fs
    .readdirSync(targetDir)
    .filter((file) => file.endsWith(".html"))
    .sort();

  for (const file of files) {
    const filePath = path.join(targetDir, file);
    const rawBytes = fs.readFileSync(filePath);
    const sha256 = createHash("sha256").update(rawBytes).digest("hex");
    const html = rawBytes.toString("utf-8");
    const espVariables = extractEspVariablesFromHtml(html);

    templates[file] = {
      sha256,
      espVariables,
    };
  }

  return {
    version: 1,
    templates,
  };
}

/**
 * Lee y valida el archivo de baseline desde disco.
 *
 * @param {string} [baselinePath] Ruta personalizada del baseline
 * @returns {DistSnapshot}
 */
export function readBaseline(baselinePath?: string): DistSnapshot {
  const filePath = baselinePath ?? getDefaultBaselinePath();
  if (!fs.existsSync(filePath)) {
    throw new Error(`Archivo de baseline no encontrado en: ${filePath}`);
  }

  const raw = fs.readFileSync(filePath, "utf-8");
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(
      `Error de sintaxis JSON en baseline (${filePath}): ${err instanceof Error ? err.message : String(err)}`,
      { cause: err },
    );
  }

  assertDistSnapshot(parsed);
  return parsed;
}

/**
 * Escribe un DistSnapshot en disco con formato JSON consistente y claves ordenadas.
 *
 * @param {DistSnapshot} snapshot Snapshot a persistir
 * @param {string} [baselinePath] Ruta del archivo de destino
 * @returns {void}
 */
export function writeBaseline(snapshot: DistSnapshot, baselinePath?: string): void {
  const filePath = baselinePath ?? getDefaultBaselinePath();
  assertDistSnapshot(snapshot);

  const sortedTemplates: Record<string, TemplateSnapshot> = {};
  for (const key of Object.keys(snapshot.templates).sort()) {
    sortedTemplates[key] = {
      sha256: snapshot.templates[key].sha256,
      espVariables: [...snapshot.templates[key].espVariables].sort(),
    };
  }

  const output: DistSnapshot = {
    version: 1,
    templates: sortedTemplates,
  };

  fs.writeFileSync(filePath, JSON.stringify(output, null, 2) + "\n", "utf-8");
}
