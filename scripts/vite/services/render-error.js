// @ts-check
/**
 * @fileoverview Normalizador seguro de errores para renderizado de templates.
 * Transforma excepciones internas en contratos estructurados sin exponer
 * detalles sensibles (rutas absolutas, stacks, secretos o datos de preview).
 */

import { isAbsolute, relative, resolve, sep } from "node:path";
import { isPathInside } from "../../shared/path-safety.js";

export const RENDER_ERROR_VERSION = 1;

/**
 * @typedef {Object} RenderErrorLocation
 * @property {string} path - Ruta relativa al directorio de templates.
 * @property {number} [line] - Número de línea entero positivo.
 * @property {number} [column] - Número de columna entero positivo.
 */

/**
 * @typedef {Object} NormalizedRenderError
 * @property {number} version - Versión del esquema de error (1).
 * @property {string} code - Código de error de render ("RENDER_FAILED").
 * @property {string} message - Mensaje base amigable para el usuario.
 * @property {string} [cause] - Clasificación segura y controlada de la causa.
 * @property {RenderErrorLocation} [location] - Ubicación segura dentro de templates.
 */

/**
 * Normaliza una excepción de render en un objeto seguro bajo el esquema v1.
 *
 * @param {unknown} error - Error o excepción capturada durante el render.
 * @param {{ templatesRoot: string }} options - Directorio raíz de templates.
 * @returns {NormalizedRenderError} Error normalizado seguro para responder al cliente.
 */
export function normalizeRenderError(error, { templatesRoot }) {
  /** @type {string} */
  let cause = "Fallo de compilación.";

  if (error instanceof SyntaxError) {
    cause = "El template contiene sintaxis inválida.";
  } else if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    /** @type {{ code?: unknown }} */ (error).code === "ENOENT"
  ) {
    cause = "Fuente requerida no encontrada.";
  }

  /** @type {NormalizedRenderError} */
  const result = {
    version: RENDER_ERROR_VERSION,
    code: "RENDER_FAILED",
    message: "No se pudo renderizar el template.",
    cause,
  };

  if (error && typeof error === "object") {
    const errorObj = /** @type {Record<string, unknown>} */ (error);
    const rawPath = typeof errorObj.path === "string" ? errorObj.path : undefined;

    if (rawPath && typeof templatesRoot === "string") {
      const resolvedPath = isAbsolute(rawPath) ? resolve(rawPath) : resolve(templatesRoot, rawPath);

      if (isPathInside(templatesRoot, resolvedPath)) {
        const relativePath = relative(templatesRoot, resolvedPath).split(sep).join("/");
        /** @type {RenderErrorLocation} */
        const location = { path: relativePath };

        if (
          typeof errorObj.line === "number" &&
          Number.isInteger(errorObj.line) &&
          errorObj.line > 0
        ) {
          location.line = errorObj.line;
        }

        if (
          typeof errorObj.column === "number" &&
          Number.isInteger(errorObj.column) &&
          errorObj.column > 0
        ) {
          location.column = errorObj.column;
        }

        result.location = location;
      }
    }
  }

  return result;
}
