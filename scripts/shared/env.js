// @ts-check
/**
 * @fileoverview Gestión de variables de entorno desde .env
 */

import fs from "node:fs";
import path from "node:path";
import { c, paint } from "./console.js";

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
 * @param {string[]} [requiredKeys=[]]
 * @returns {{ exists: boolean, missing: string[] }}
 *   `missing` contiene las claves de `requiredKeys` que no están configuradas.
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
