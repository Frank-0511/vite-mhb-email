#!/usr/bin/env node

/**
 * @fileoverview Entry point para exportar templates como imágenes PNG.
 *
 * Genera PNG automáticamente con el navegador gestionado por Puppeteer.
 *
 * Uso:
 *   node scripts/export/screenshot.ts nombre-template (o la opción [7] de `<pm> run cli`)
 */

import { existsSync } from "node:fs";
import path from "node:path";
import { formatRunCommand } from "../shared/env/detect-pm.ts";
import { exportScreenshot } from "./main.ts";
import { assertValidTemplateName, c, paint, readJsonFile } from "../shared/index.ts";

const templateName = process.argv[2];

// ─── Validaciones ────────────────────────────────────────────────────────────

try {
  assertValidTemplateName(templateName);
} catch {
  console.error(
    paint(c.red + c.bold, "❌ Error:") +
      paint(c.dim, " El nombre del template debe usar solo minúsculas, números y guiones.\n") +
      paint(c.cyan, `   Uso: node scripts/export/screenshot.ts nombre-template\n`),
  );
  process.exit(1);
}

// Validado por assertValidTemplateName
const validatedTemplateName = templateName as string;

const htmlPath = path.join(process.cwd(), "dist", `${validatedTemplateName}.html`);

if (!existsSync(htmlPath)) {
  console.error(
    paint(c.red + c.bold, "❌ Error:") +
      paint(c.dim, ` El template "${validatedTemplateName}" no existe en dist.\n`) +
      paint(c.cyan, `   Asegúrate de hacer '${formatRunCommand("build")}' primero.\n`),
  );
  process.exit(1);
}

// ─── Obtener datos del template ──────────────────────────────────────────────

const dataPath = path.join(
  process.cwd(),
  "src/emails/templates",
  validatedTemplateName,
  "data.json",
);

let templateData: Record<string, unknown> = {};
if (existsSync(dataPath)) {
  templateData = readJsonFile(dataPath) as Record<string, unknown>;
}

// ─── Ejecutar ────────────────────────────────────────────────────────────────

exportScreenshot(htmlPath, validatedTemplateName, templateData).catch((err) => {
  const errorMsg = err instanceof Error ? err.message : String(err);
  console.error(paint(c.red + c.bold, "❌ Error:"), errorMsg);
  process.exit(1);
});
