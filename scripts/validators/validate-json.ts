/**
 * @fileoverview Valida que todos los data.json de los templates sean JSON válido.
 * Sale con código 1 si algún archivo tiene errores de sintaxis.
 */

import { globSync } from "glob";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export function validateJsonFiles(customFiles?: string[]): boolean {
  let files = customFiles ?? process.argv.slice(2);
  if (files.length === 0) {
    files = globSync("src/emails/templates/*/data.json");
  }

  if (files.length === 0) {
    console.log("validate-json: no se encontraron archivos data.json.");
    return true;
  }

  let hasErrors = false;

  for (const file of files) {
    try {
      const raw = readFileSync(resolve(file), "utf-8");
      JSON.parse(raw);
    } catch (err: unknown) {
      const message = err instanceof SyntaxError ? err.message : String(err);
      console.error(`  ❌ ${file}: ${message}`);
      hasErrors = true;
    }
  }

  if (hasErrors) {
    console.error("\n  ❌ Algunos data.json tienen errores de sintaxis.\n");
    return false;
  }

  console.log(
    `✅ ${files.length} archivo${files.length !== 1 ? "s" : ""} data.json validado${files.length !== 1 ? "s" : ""}.`,
  );
  return true;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const success = validateJsonFiles();
  if (!success) {
    process.exit(1);
  }
}
