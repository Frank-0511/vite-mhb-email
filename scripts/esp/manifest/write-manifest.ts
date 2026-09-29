/**
 * @fileoverview Generación y persistencia del archivo dist/esp-manifest.json.
 */

import fs from "node:fs";
import path from "node:path";
import { ESP_MANIFEST_FILENAME } from "../../shared/contracts/constants/esp-contract.ts";
import { getProjectPaths } from "../../shared/io/paths.ts";
import { buildEspManifest } from "./build-manifest.ts";

/**
 * Genera el manifiesto de variables ESP y lo escribe en dist/esp-manifest.json con formato determinista.
 *
 * @param rootDir Directorio raíz del proyecto (por defecto process.cwd()).
 * @returns Ruta absoluta del archivo generado.
 */
export function writeEspManifest(rootDir: string = process.cwd()): string {
  const manifest = buildEspManifest(rootDir);
  const paths = getProjectPaths(rootDir);
  const targetPath = path.join(paths.distDir, ESP_MANIFEST_FILENAME);

  fs.writeFileSync(targetPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  return targetPath;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const writtenPath = writeEspManifest();
    console.log(`✅ Manifiesto ESP generado exitosamente en ${writtenPath}`);
  } catch (error) {
    console.error(
      `Error generando manifiesto ESP: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
  }
}
