/**
 * @fileoverview Normalizador seguro de errores para renderizado de templates.
 * Transforma excepciones internas en contratos estructurados sin exponer
 * detalles sensibles (rutas absolutas, stacks, secretos o datos de preview).
 */

import { isAbsolute, relative, resolve, sep } from "node:path";
import { isPathInside } from "../../../shared/index.ts";

export const RENDER_ERROR_VERSION = 1;

export interface RenderErrorLocation {
  path: string;
  line?: number;
  column?: number;
}

export interface NormalizedRenderError {
  version: number;
  code: string;
  message: string;
  cause?: string;
  location?: RenderErrorLocation;
}

export interface NormalizeRenderErrorOptions {
  templatesRoot: string;
}

/**
 * Normaliza una excepción de render en un objeto seguro bajo el esquema v1.
 *
 * @param error Error o excepción capturada durante el render.
 * @param options Opciones que incluyen el directorio raíz de templates.
 * @returns Error normalizado seguro para responder al cliente.
 */
export function normalizeRenderError(
  error: unknown,
  { templatesRoot }: NormalizeRenderErrorOptions,
): NormalizedRenderError {
  let cause = "Fallo de compilación.";

  if (error instanceof SyntaxError) {
    cause = "El template contiene sintaxis inválida.";
  } else if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code?: unknown }).code === "ENOENT"
  ) {
    cause = "Fuente requerida no encontrada.";
  }

  const result: NormalizedRenderError = {
    version: RENDER_ERROR_VERSION,
    code: "RENDER_FAILED",
    message: "No se pudo renderizar el template.",
    cause,
  };

  if (error && typeof error === "object") {
    const errorObj = error as Record<string, unknown>;
    const rawPath = typeof errorObj.path === "string" ? errorObj.path : undefined;

    if (rawPath && typeof templatesRoot === "string") {
      const resolvedPath = isAbsolute(rawPath) ? resolve(rawPath) : resolve(templatesRoot, rawPath);

      if (isPathInside(templatesRoot, resolvedPath)) {
        const relativePath = relative(templatesRoot, resolvedPath).split(sep).join("/");
        const location: RenderErrorLocation = { path: relativePath };

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
