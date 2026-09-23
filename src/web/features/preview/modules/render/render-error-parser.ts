/**
 * @fileoverview Parser y modelo de errores estructurados para la API de render de preview.
 * Garantiza un allowlist estricto sin reflejar cuerpos HTML arbitrarios ni datos sensibles.
 */

export const RENDER_ERROR_MESSAGE = "No se pudo renderizar el template.";

export const SAFE_RENDER_CAUSES = new Set([
  "El template contiene sintaxis inválida.",
  "Fuente requerida no encontrada.",
  "Fallo de compilación.",
]);

export const SAFE_RENDER_LOCATION_PATH = /^[a-z0-9][a-z0-9._-]*(?:\/[a-z0-9][a-z0-9._-]*)*$/;

export type SafeRenderLocation = {
  path: string;
  line?: number;
  column?: number;
};

type RenderApiErrorOptions = {
  status: number;
  code?: string;
  message: string;
  cause?: string;
  location?: SafeRenderLocation;
};

/**
 * Valida que una ubicación recibida de la API mantenga el formato relativo y
 * controlado del contrato de render.
 *
 * @param {unknown} location
 * @returns {SafeRenderLocation | undefined}
 */
export function parseSafeRenderLocation(location: unknown): SafeRenderLocation | undefined {
  if (
    !location ||
    typeof location !== "object" ||
    !("path" in location) ||
    typeof location.path !== "string" ||
    !SAFE_RENDER_LOCATION_PATH.test(location.path)
  ) {
    return undefined;
  }

  const safeLocation: SafeRenderLocation = { path: location.path };
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
  code: string;
  cause: string | undefined;
  location: SafeRenderLocation | undefined;

  /**
   * @param {RenderApiErrorOptions} options
   */
  constructor({ status, code = "RENDER_FAILED", message, cause, location }: RenderApiErrorOptions) {
    super(message);
    this.name = "RenderApiError";
    this.status = status;
    this.code = code;
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
        parsed.error.code === "RENDER_FAILED" &&
        typeof parsed.error.message === "string"
      ) {
        const err = parsed.error;
        const message = err.message === RENDER_ERROR_MESSAGE ? err.message : RENDER_ERROR_MESSAGE;
        const cause =
          typeof err.cause === "string" && SAFE_RENDER_CAUSES.has(err.cause)
            ? err.cause
            : undefined;
        const location = parseSafeRenderLocation(err.location);

        return new RenderApiError({
          status,
          code: "RENDER_FAILED",
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
    code: "RENDER_FAILED",
    message: RENDER_ERROR_MESSAGE,
    cause: undefined,
    location: undefined,
  });
}
