#!/usr/bin/env node

/**
 * @fileoverview Entry point para exportar templates como imágenes PNG.
 *
 * Genera PNG automáticamente usando wkhtmltoimage, puppeteer, o PDF + ImageMagick.
 *
 * Uso:
 *   yarn export-screenshot nombre-template
 */

import fs from "fs-extra";
import path from "node:path";
import { exportScreenshot } from "./exporters/index.js";
import { c, paint } from "./shared/console.js";

const templateName = process.argv[2];

// ─── Validaciones ────────────────────────────────────────────────────────────

if (!templateName) {
  console.error(
    paint(c.red + c.bold, "❌ Error:") +
      paint(c.dim, " Especifica el nombre del template.\n") +
      paint(c.cyan, "   Uso: yarn export-screenshot nombre-template\n"),
  );
  process.exit(1);
}

const htmlPath = path.join(process.cwd(), "dist", `${templateName}.html`);

if (!fs.existsSync(htmlPath)) {
  console.error(
    paint(c.red + c.bold, "❌ Error:") +
      paint(c.dim, ` El template "${templateName}" no existe en dist.\n`) +
      paint(c.cyan, "   Asegúrate de hacer 'yarn build' primero.\n"),
  );
  process.exit(1);
}

// ─── Obtener datos del template ──────────────────────────────────────────────

const dataPath = path.join(process.cwd(), "src/emails/templates", templateName, "data.json");

let templateData = {};
if (fs.existsSync(dataPath)) {
  templateData = fs.readJsonSync(dataPath);
}

// ─── Ejecutar ────────────────────────────────────────────────────────────────

exportScreenshot(htmlPath, templateName, templateData).catch((err) => {
  const errorMsg = err instanceof Error ? err.message : String(err);
  console.error(paint(c.red + c.bold, "❌ Error:"), errorMsg);
  process.exit(1);
});
