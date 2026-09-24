/**
 * @fileoverview Normalizador seguro de errores para renderizado de templates.
 * Transforma excepciones internas en contratos estructurados sin exponer
 * detalles sensibles (rutas absolutas, stacks, secretos o datos de preview).
 */

import { isAbsolute, relative, resolve, sep } from "node:path";
import {
  RENDER_ERROR_CODE,
  RENDER_ERROR_MESSAGE,
  RENDER_ERROR_VERSION,
  SAFE_RENDER_CAUSE,
} from "../../../shared/contracts/constants/render-error.ts";
import type {
  RenderErrorLocation,
  RenderErrorPayload,
} from "../../../shared/contracts/types/render-error.ts";
import { isPathInside } from "../../../shared/index.ts";

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
): RenderErrorPayload {
  let cause: string = SAFE_RENDER_CAUSE.COMPILATION;

  if (error instanceof SyntaxError) {
    cause = SAFE_RENDER_CAUSE.SYNTAX;
  } else if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code?: unknown }).code === "ENOENT"
  ) {
    cause = SAFE_RENDER_CAUSE.NOT_FOUND;
  }

  const result: RenderErrorPayload = {
    version: RENDER_ERROR_VERSION,
    code: RENDER_ERROR_CODE.FAILED,
    message: RENDER_ERROR_MESSAGE,
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
