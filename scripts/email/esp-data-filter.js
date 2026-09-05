// @ts-check
/**
 * @fileoverview Filtrado y normalización de claves del objeto de datos `data.json`.
 */

import { FRONTMATTER_METADATA_KEYS } from "./esp-constants.js";
import { frontmatterKeys } from "./esp-frontmatter.js";

/**
 * Extrae y filtra las claves de primer nivel del objeto `data` que son
 * candidatas a variables ESP comparables.
 *
 * Exclusiones:
 *   - Valores que son objetos o arrays (estructuras anidadas/metadata).
 *   - Claves reservadas de metadatos del frontmatter (`title`, `previewText`, etc.).
 *   - Claves declaradas en el frontmatter del template `source`.
 *
 * @param {unknown} data Objeto JSON con los datos del template.
 * @param {string} [source] Contenido del template fuente para identificar metadatos.
 * @returns {string[]} Lista de nombres de claves filtradas.
 */
export function filterDataKeys(data, source = "") {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return [];
  }

  const record = /** @type {Record<string, unknown>} */ (data);
  const metadataKeys = frontmatterKeys(source);

  return Object.keys(record).filter((key) => {
    const value = record[key];
    // Las claves cuyo valor es un objeto o array (configuración, metadata, listas)
    // no son candidatas a "unused": no se referencian como escalares ESP directos.
    const isPrimitive = value === null || typeof value !== "object";
    return isPrimitive && !FRONTMATTER_METADATA_KEYS.has(key) && !metadataKeys.has(key);
  });
}
