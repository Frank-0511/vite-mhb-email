/**
 * @fileoverview Sanitización y filtrado de datos de ejemplo para el manifiesto ESP.
 */

import {
  SENSITIVE_EXAMPLE_KEY_RE,
  SENSITIVE_EXAMPLE_VALUE_RE,
} from "../../shared/contracts/constants/esp-contract.ts";

/**
 * Construye y sanea el mapa de datos de ejemplo a partir de data.json y las variables requeridas.
 * Reemplaza posibles datos personales o tokens por placeholders <clave> y ordena las claves.
 *
 * @param keys Variables requeridas o intencionales del template.
 * @param data Contenido cargado desde data.json.
 * @returns Diccionario ordenado de datos de ejemplo saneados como strings.
 */
export function buildExampleData(keys: readonly string[], data: unknown): Record<string, string> {
  if (data === null || typeof data !== "object" || Array.isArray(data)) {
    return {};
  }

  const record = data as Record<string, unknown>;
  const sortedKeys = Array.from(new Set(keys)).sort();
  const result: Record<string, string> = {};

  for (const key of sortedKeys) {
    if (!Object.prototype.hasOwnProperty.call(record, key)) {
      continue;
    }

    const value = record[key];
    if (value === null || value === undefined || typeof value === "object") {
      continue;
    }

    if (typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean") {
      continue;
    }

    if (SENSITIVE_EXAMPLE_KEY_RE.test(key)) {
      result[key] = `<${key}>`;
    } else if (typeof value === "string" && SENSITIVE_EXAMPLE_VALUE_RE.test(value)) {
      result[key] = `<${key}>`;
    } else {
      result[key] = String(value);
    }
  }

  return result;
}
