// @ts-check

/**
 * @fileoverview Valida que todos los data.json de los templates sean JSON válido.
 * Sale con código 1 si algún archivo tiene errores de sintaxis.
 */

import fs from "node:fs";
import path from "node:path";
import { globSync } from "glob";

let files = process.argv.slice(2);
if (files.length === 0) {
  files = globSync("src/templates/*/data.json");
}

if (files.length === 0) {
  console.log("validate-json: no se encontraron archivos data.json.");
  process.exit(0);
}

let hasErrors = false;

for (const file of files) {
  try {
    const raw = fs.readFileSync(path.resolve(file), "utf-8");
    JSON.parse(raw);
    console.log(`  ✅ ${file}`);
  } catch (err) {
    const message = err instanceof SyntaxError ? err.message : String(err);
    console.error(`  ❌ ${file}: ${message}`);
    hasErrors = true;
  }
}

if (hasErrors) {
  console.error("\n  ❌ Algunos data.json tienen errores de sintaxis.\n");
  process.exit(1);
} else {
  console.log("\n  ✅ Todos los data.json son válidos.\n");
}
