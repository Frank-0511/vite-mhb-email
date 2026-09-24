#!/usr/bin/env node

/**
 * @fileoverview Entry point para exportar templates como imágenes PNG.
 *
 * Genera PNG automáticamente con el navegador gestionado por Puppeteer.
 *
 * Uso:
 *   bun run export:screenshot nombre-template
 */

import fs from "fs-extra";
import path from "node:path";
import { exportScreenshot } from "./main.ts";
import { c, paint } from "../shared/index.ts";
import { assertValidTemplateName } from "../shared/index.ts";

const templateName = process.argv[2];

// ─── Validaciones ────────────────────────────────────────────────────────────

try {
  assertValidTemplateName(templateName);
} catch {
  console.error(
    paint(c.red + c.bold, "❌ Error:") +
      paint(c.dim, " El nombre del template debe usar solo minúsculas, números y guiones.\n") +
      paint(c.cyan, "   Uso: bun run export:screenshot nombre-template\n"),
  );
  process.exit(1);
}

// Validado por assertValidTemplateName
const validatedTemplateName = templateName as string;

const htmlPath = path.join(process.cwd(), "dist", `${validatedTemplateName}.html`);

if (!fs.existsSync(htmlPath)) {
  console.error(
    paint(c.red + c.bold, "❌ Error:") +
      paint(c.dim, ` El template "${validatedTemplateName}" no existe en dist.\n`) +
      paint(c.cyan, "   Asegúrate de hacer 'bun run build' primero.\n"),
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
if (fs.existsSync(dataPath)) {
  templateData = fs.readJsonSync(dataPath) as Record<string, unknown>;
}

// ─── Ejecutar ────────────────────────────────────────────────────────────────

exportScreenshot(htmlPath, validatedTemplateName, templateData).catch((err) => {
  const errorMsg = err instanceof Error ? err.message : String(err);
  console.error(paint(c.red + c.bold, "❌ Error:"), errorMsg);
  process.exit(1);
});
