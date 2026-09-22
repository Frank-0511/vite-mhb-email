// @ts-check
/**
 * @fileoverview Funciones auxiliares para formateo y cálculo de tamaños en bytes.
 * Centraliza la conversión a KB/MB y constantes de umbral de tamaño de correo.
 */

/** Número de bytes contenidos en un Kilobyte (KB). */
export const BYTES_PER_KB = 1024;

/** Límite seguro recomendado de Gmail para evitar truncado ("View entire message"): 102 KB. */
export const GMAIL_MAX_SAFE_BYTES = 102 * BYTES_PER_KB;

/** Umbral de advertencia para tamaño de email: 100 KB. */
export const GMAIL_WARNING_THRESHOLD_BYTES = 100 * BYTES_PER_KB;

/**
 * Convierte un tamaño en bytes a kilobytes (KB) con precisión decimal.
 *
 * @param {number} bytes - Tamaño en bytes.
 * @param {number} [decimals=2] - Número de posiciones decimales.
 * @returns {string} Valor numérico formateado como string en KB (ej. "12.34").
 */
export function bytesToKB(bytes, decimals = 2) {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return (0).toFixed(decimals);
  }
  return (bytes / BYTES_PER_KB).toFixed(decimals);
}

/**
 * @typedef {Object} FormatBytesOptions
 * @property {number} [decimals=2] - Cantidad de cifras decimales a mostrar.
 * @property {boolean} [useKBOnly=false] - Forzar siempre la unidad KB (ideal para métricas de correo).
 * @property {boolean} [includeSpace=true] - Incluir un espacio antes de la unidad.
 */

/**
 * Formatea un tamaño en bytes con la unidad correspondiente (B, KB, MB) o siempre en KB.
 *
 * @param {number} bytes - Tamaño en bytes a formatear.
 * @param {FormatBytesOptions} [options] - Opciones de formateo.
 * @returns {string} Cadena formateada con número y unidad (ej. "12.34 KB" o "512 B").
 */
export function formatBytes(bytes, options = {}) {
  const { decimals = 2, useKBOnly = false, includeSpace = true } = options;
  const space = includeSpace ? " " : "";

  if (!Number.isFinite(bytes) || bytes < 0) {
    const unit = useKBOnly ? "KB" : "B";
    const val = useKBOnly ? (0).toFixed(decimals) : "0";
    return `${val}${space}${unit}`;
  }

  if (useKBOnly) {
    return `${(bytes / BYTES_PER_KB).toFixed(decimals)}${space}KB`;
  }

  if (bytes < BYTES_PER_KB) {
    return `${Math.round(bytes)}${space}B`;
  }

  const kb = bytes / BYTES_PER_KB;
  if (kb < BYTES_PER_KB) {
    return `${kb.toFixed(decimals)}${space}KB`;
  }

  const mb = kb / BYTES_PER_KB;
  return `${mb.toFixed(decimals)}${space}MB`;
}
