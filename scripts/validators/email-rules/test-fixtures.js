// @ts-check
/**
 * @fileoverview Fixtures compartidos por los tests de reglas de compatibilidad.
 *
 * Cada regla tiene su test hermano en `rules/<regla>.test.js`; `rules.test.js`
 * conserva las comprobaciones del registro. Ambos niveles reutilizan estos
 * helpers para no duplicar el armado de contextos temporales.
 */

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { rules } from "./rules/index.js";

/**
 * HTML mínimo que ninguna regla debe reportar: sirve de caso positivo común.
 * @type {string}
 */
export const cleanHtml =
  '<!doctype html><html><head><meta charset="utf-8"></head><body><a href="https://example.com/unsubscribe">Unsubscribe</a><img src="x" width="1" height="1" alt="x"></body></html>';

/** @type {string[]} */
const temporaryDirectories = [];

/**
 * Crea un contexto de regla apoyado en un proyecto temporal aislado.
 * Registrar `cleanupContexts` en un `afterEach` para borrarlo.
 *
 * @returns {{ projectRoot: string, filePath: string }}
 */
export function createContext() {
  const projectRoot = mkdtempSync(join(tmpdir(), "email-validation-"));
  temporaryDirectories.push(projectRoot);
  return { projectRoot, filePath: join(projectRoot, "dist", "example.html") };
}

/** Borra los proyectos temporales creados por `createContext`. */
export function cleanupContexts() {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
}

/**
 * Escribe un template fuente (y opcionalmente su `data.json`) para las reglas
 * que leen disco, y apunta el contexto al HTML compilado correspondiente.
 *
 * @param {{ projectRoot: string, filePath: string }} context
 * @param {string} templateName
 * @param {string} source
 * @param {Record<string, unknown>} [data]
 */
export function writeTemplateSource(context, templateName, source, data) {
  const templateRoot = join(context.projectRoot, "src", "emails", "templates", templateName);
  mkdirSync(templateRoot, { recursive: true });
  writeFileSync(join(templateRoot, "index.html"), source, "utf8");
  if (data !== undefined) {
    writeFileSync(join(templateRoot, "data.json"), JSON.stringify(data), "utf8");
  }
  context.filePath = join(context.projectRoot, "dist", `${templateName}.html`);
}

/**
 * Escribe un archivo suelto dentro del template indicado, sin pasar por JSON.
 *
 * @param {{ projectRoot: string }} context
 * @param {string} templateName
 * @param {string} fileName
 * @param {string} content
 */
export function writeTemplateFile(context, templateName, fileName, content) {
  const templateRoot = join(context.projectRoot, "src", "emails", "templates", templateName);
  mkdirSync(templateRoot, { recursive: true });
  writeFileSync(join(templateRoot, fileName), content, "utf8");
}

/**
 * Obtiene una regla del registro real y falla explícitamente si no está.
 *
 * @param {string} ruleId
 * @returns {import("./context.js").Rule}
 */
export function ruleById(ruleId) {
  const rule = rules.find((candidate) => candidate.id === ruleId);
  if (!rule) throw new Error(`Regla no registrada: ${ruleId}`);
  return rule;
}
