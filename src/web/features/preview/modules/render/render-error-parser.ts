/**
 * @fileoverview Parser y modelo de errores estructurados para la API de render de preview.
 * Garantiza un allowlist estricto sin reflejar cuerpos HTML arbitrarios ni datos sensibles.
 */

import {
  RENDER_ERROR_CODE,
  RENDER_ERROR_MESSAGE,
  SAFE_RENDER_LOCATION_PATH,
} from "../../../../../../scripts/shared/contracts/constants/render-error.ts";
import {
  isRenderErrorCode,
  isSafeRenderCause,
} from "../../../../../../scripts/shared/contracts/guards/render-error.ts";
import type {
  RenderErrorCode,
  RenderErrorLocation,
} from "../../../../../../scripts/shared/contracts/types/render-error.ts";

type RenderApiErrorOptions = {
  status: number;
  code?: RenderErrorCode;
  message: string;
  cause?: string;
  location?: RenderErrorLocation;
};

/**
 * Valida que una ubicación recibida de la API mantenga el formato relativo y
 * controlado del contrato de render.
 *
 * @param {unknown} location
 * @returns {RenderErrorLocation | undefined}
 */
export function parseSafeRenderLocation(location: unknown): RenderErrorLocation | undefined {
  if (
    !location ||
    typeof location !== "object" ||
    !("path" in location) ||
    typeof location.path !== "string" ||
    !SAFE_RENDER_LOCATION_PATH.test(location.path)
  ) {
    return undefined;
  }

  const safeLocation: RenderErrorLocation = { path: location.path };
  if (
    "line" in location &&
    typeof location.line === "number" &&
    Number.isInteger(location.line) &&
    location.line > 0
  ) {
    safeLocation.line = location.line;
  }
  if (
    "column" in location &&
    typeof location.column === "number" &&
    Number.isInteger(location.column) &&
    location.column > 0
  ) {
    safeLocation.column = location.column;
  }

  return safeLocation;
}

/**
 * Error estructurado emitido por el cliente de render API.
 */
export class RenderApiError extends Error {
  status: number;
  code: RenderErrorCode;
  cause: string | undefined;
  location: RenderErrorLocation | undefined;

  /**
   * @param {RenderApiErrorOptions} options
   */
  constructor({
    status,
    code = RENDER_ERROR_CODE.FAILED,
    message,
    cause,
    location,
  }: RenderApiErrorOptions) {
    super(message);
    this.name = "RenderApiError";
    this.status = status;
    this.code = isRenderErrorCode(code) ? code : RENDER_ERROR_CODE.FAILED;
    this.cause = cause;
    this.location = location;
  }
}

/**
 * Parsea y valida una respuesta HTTP no exitosa con allowlist estricto.
 * Nunca refleja cuerpos arbitrarios, HTML ni statusText externos.
 *
 * @param {unknown} response
 * @param {string} body
 * @returns {RenderApiError}
 */
export function parseRenderErrorResponse(response: unknown, body: string): RenderApiError {
  const status =
    response &&
    typeof response === "object" &&
    "status" in response &&
    typeof response.status === "number"
      ? response.status
      : 0;

  if (status === 422 && typeof body === "string") {
    try {
      const parsed = JSON.parse(body);
      if (
        parsed &&
        typeof parsed === "object" &&
        parsed.success === false &&
        parsed.error &&
        typeof parsed.error === "object" &&
        parsed.error.version === 1 &&
        parsed.error.code === RENDER_ERROR_CODE.FAILED &&
        typeof parsed.error.message === "string"
      ) {
        const err = parsed.error;
        const message = err.message === RENDER_ERROR_MESSAGE ? err.message : RENDER_ERROR_MESSAGE;
        const cause = isSafeRenderCause(err.cause) ? err.cause : undefined;
        const location = parseSafeRenderLocation(err.location);

        return new RenderApiError({
          status,
          code: RENDER_ERROR_CODE.FAILED,
          message,
          cause,
          location,
        });
      }
    } catch {
      // JSON malformado; procede al fallback seguro
    }
  }

  return new RenderApiError({
    status,
    code: RENDER_ERROR_CODE.FAILED,
    message: RENDER_ERROR_MESSAGE,
    cause: undefined,
    location: undefined,
  });
}
