// @ts-check
/**
 * @fileoverview Utilidades compartidas para los scripts del CLI.
 * Centraliza colores ANSI, carga del .env, helpers de prompt y listado de templates.
 */

import Handlebars from "handlebars";
import fs from "node:fs";
import path from "node:path";

// ─── Colores ANSI ─────────────────────────────────────────────────────────────

export const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  white: "\x1b[37m",
  bgCyan: "\x1b[46m",
  bgBlue: "\x1b[44m",
};

/** @param {string} color @param {string} text */
export const paint = (color, text) => `${color}${text}${c.reset}`;

// ─── Carga del .env ───────────────────────────────────────────────────────────

/**
 * Lee el archivo `.env` de la raíz del proyecto y carga las variables en
 * `process.env`. No sobreescribe variables ya definidas en el entorno.
 * Termina el proceso con código 1 si el archivo no existe.
 */
export function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env");

  if (!fs.existsSync(envPath)) {
    console.error(
      paint(c.red + c.bold, "\n  ❌ No se encontró el archivo .env en la raíz del proyecto."),
    );
    console.error(paint(c.dim, "     Copiá .env.example → .env y completá tus credenciales.\n"));
    process.exit(1);
  }

  const raw = fs.readFileSync(envPath, "utf-8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed
      .slice(eqIdx + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
    if (key && !(key in process.env)) process.env[key] = val;
  }
}

/**
 * Chequea si el `.env` existe sin terminar el proceso.
 * @returns {{ exists: boolean, missing: string[] }}
 *   `missing` contiene las claves de `requiredKeys` que no están configuradas.
 * @param {string[]} requiredKeys
 */
export function checkEnv(requiredKeys = []) {
  const envPath = path.resolve(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return { exists: false, missing: requiredKeys };

  loadEnv();

  // Valores placeholder del .env.example — se consideran "no configurados"
  const PLACEHOLDERS = new Set([
    "your_api_token_here",
    "your_inbox_id_here",
    "tu@gmail.com",
    "xxxx xxxx xxxx xxxx",
    "tu@outlook.com",
    "tu@icloud.com",
  ]);

  const missing = requiredKeys.filter((k) => {
    const val = process.env[k];
    return !val || PLACEHOLDERS.has(val);
  });

  return { exists: true, missing };
}

// ─── Helpers de prompt ───────────────────────────────────────────────────────

/**
 * Muestra una pregunta al usuario y devuelve su respuesta.
 * Si el usuario no escribe nada, devuelve `defaultValue`.
 *
 * @param {import('readline').Interface} rl
 * @param {string} question
 * @param {string} [defaultValue]
 * @returns {Promise<string>}
 */
export function prompt(rl, question, defaultValue = "") {
  const hint = defaultValue ? paint(c.dim, ` (${defaultValue})`) : "";
  return new Promise((resolve) => {
    rl.question(`  ${question}${hint}: `, (answer) => {
      const val = answer.trim();
      resolve(val !== "" ? val : defaultValue);
    });
  });
}

/**
 * Muestra una lista numerada y espera que el usuario elija un ítem válido.
 *
 * @param {import('readline').Interface} rl
 * @param {string[]} items
 * @returns {Promise<string>}
 */
export async function pickFromList(rl, items) {
  items.forEach((item, i) => {
    console.log(`  ${paint(c.cyan + c.bold, `[${i + 1}]`)} ${paint(c.cyan, item)}`);
  });
  console.log();

  while (true) {
    const raw = await prompt(rl, paint(c.cyan + c.bold, "→ Elegí un número"));
    const idx = parseInt(raw, 10) - 1;
    if (!isNaN(idx) && idx >= 0 && idx < items.length) return items[idx];
    console.log(paint(c.red, `  ❌ Opción inválida. Ingresá un número entre 1 y ${items.length}.`));
  }
}

// ─── Templates buildeados ────────────────────────────────────────────────────

/**
 * Devuelve los archivos `.html` disponibles en `dist/`, ordenados.
 * @returns {string[]}
 */
export function getBuiltTemplates() {
  const distDir = path.resolve(process.cwd(), "dist");
  if (!fs.existsSync(distDir)) return [];
  return fs
    .readdirSync(distDir)
    .filter((f) => f.endsWith(".html"))
    .sort();
}

/**
 * Lee el HTML de un template buildeado.
 * @param {string} filename  nombre de archivo (ej. "welcome.html")
 * @returns {string}
 */
export function readBuiltTemplate(filename) {
  return fs.readFileSync(path.resolve(process.cwd(), "dist", filename), "utf-8");
}

// ─── Handlebars: cargar datos y aplicar variables ──────────────────────────────

/**
 * Carga el data.json correspondiente a un template.
 * @param {string} templateName - Nombre del template (ej: "welcome.html")
 * @returns {Object} Datos del template o objeto vacío si no existe
 */
export function getTemplateData(templateName) {
  try {
    const baseName = templateName.replace(".html", "");
    const dataPath = path.resolve(process.cwd(), "src/emails/templates", baseName, "data.json");
    const content = fs.readFileSync(dataPath, "utf-8");
    return JSON.parse(content);
  } catch {
    // Silenciosamente ignorar si no existe el archivo
    return {};
  }
}

/**
 * Procesa variables Handlebars en el HTML usando un objeto de datos.
 * Requiere la librería `handlebars`.
 * @param {string} html - HTML con variables Handlebars
 * @param {Object} data - Datos para reemplazar
 * @returns {string} HTML procesado
 */
export function applyHandlebars(html, data) {
  try {
    const template = Handlebars.compile(html);
    return template(data);
  } catch {
    // Si hay error, devolver el HTML sin procesar
    return html;
  }
}
