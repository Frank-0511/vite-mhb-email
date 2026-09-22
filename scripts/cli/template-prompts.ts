/**
 * @fileoverview Selección interactiva de templates compilados en dist/.
 */

import fs from "fs-extra";
import path from "node:path";
import type { Interface } from "readline";
import { c, paint } from "../shared/index.ts";

/**
 * Lista los templates compilados desde dist/ y permite seleccionar uno interactivamente.
 */
export function askSelectTemplate(rl: Interface): Promise<string | null> {
  const distPath = path.join(process.cwd(), "dist");

  if (!fs.existsSync(distPath)) {
    console.log(
      paint(c.red + c.bold, "  ❌ Error:") +
        paint(c.dim, " No existe la carpeta dist/.\n") +
        paint(c.cyan, "     Primero ejecutá 'yarn build'.\n"),
    );
    return Promise.resolve(null);
  }

  const templateFiles = fs
    .readdirSync(distPath, { withFileTypes: true })
    .filter((dirent) => dirent.isFile() && dirent.name.endsWith(".html"))
    .map((dirent) => dirent.name.replace(".html", ""))
    .sort();

  if (templateFiles.length === 0) {
    console.log(
      paint(c.red + c.bold, "  ❌ Error:") +
        paint(c.dim, " No hay templates compilados en dist/.\n"),
    );
    return Promise.resolve(null);
  }

  console.log(paint(c.green + c.bold, "\n  📸 Seleccionar template\n"));
  console.log(paint(c.white + c.bold, "  Templates disponibles:\n"));

  for (let i = 0; i < templateFiles.length; i++) {
    const num = paint(c.green + c.bold, `  [${i + 1}]`);
    console.log(`  ${num}  ${templateFiles[i]}`);
  }

  return new Promise((resolve) => {
    rl.question(paint(c.cyan + c.bold, "\n  → Selecciona el número del template: "), (answer) => {
      const idx = parseInt(answer, 10) - 1;
      if (idx >= 0 && idx < templateFiles.length) {
        resolve(templateFiles[idx]);
      } else {
        console.log(paint(c.red, "  ❌ Selección inválida.\n"));
        resolve(null);
      }
    });
  });
}
