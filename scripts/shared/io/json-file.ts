/**
 * @fileoverview Lectura y escritura síncrona de archivos JSON.
 */

import { readFileSync, writeFileSync } from "node:fs";

/**
 * Lee y parsea un archivo JSON. El resultado cruza un límite externo: el
 * consumidor debe validarlo (type guard) o asumir su forma explícitamente.
 *
 * @param filePath - Ruta del archivo JSON.
 * @returns Contenido parseado.
 * @throws Si el archivo no existe o no es JSON válido.
 */
export function readJsonFile(filePath: string): unknown {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

/**
 * Serializa un valor como JSON con sangría de 2 espacios y salto de línea final.
 *
 * @param filePath - Ruta del archivo destino.
 * @param data - Valor serializable a JSON.
 */
export function writeJsonFile(filePath: string, data: unknown): void {
  writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}
