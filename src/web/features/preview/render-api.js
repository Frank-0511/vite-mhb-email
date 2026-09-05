/**
 * @file Render API client for preview
 * Handles template rendering via /api/render endpoint
 */

import { createDebounceTimer, fetchText } from "../../shared/utils/http-helpers.js";

/**
 * Error estructurado emitido por el cliente de render API.
 */
export class RenderApiError extends Error {
  /**
   * @param {{
   *   status: number,
   *   code?: string,
   *   message: string,
   *   cause?: string,
   *   location?: { path: string, line?: number, column?: number }
   * }} options
   */
  constructor({ status, code = "RENDER_FAILED", message, cause, location }) {
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
 * @param {Pick<Response, "status"> | { status: number }} response
 * @param {string} body
 * @returns {RenderApiError}
 */
export function parseRenderErrorResponse(response, body) {
  const status = typeof response?.status === "number" ? response.status : 0;
  const defaultMessage = "No se pudo renderizar el template.";

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
        const cause = typeof err.cause === "string" ? err.cause : undefined;
        /** @type {{ path: string, line?: number, column?: number } | undefined} */
        let location;
        if (
          err.location &&
          typeof err.location === "object" &&
          typeof err.location.path === "string"
        ) {
          location = { path: err.location.path };
          if (
            typeof err.location.line === "number" &&
            Number.isInteger(err.location.line) &&
            err.location.line > 0
          ) {
            location.line = err.location.line;
          }
          if (
            typeof err.location.column === "number" &&
            Number.isInteger(err.location.column) &&
            err.location.column > 0
          ) {
            location.column = err.location.column;
          }
        }

        return new RenderApiError({
          status,
          code: "RENDER_FAILED",
          message: err.message,
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
    message: defaultMessage,
    cause: undefined,
    location: undefined,
  });
}

/**
 * @typedef {Object} RenderAPIConfig
 * @property {Function} onSuccess - Callback on successful render
 * @property {Function} onError - Callback on render error
 * @property {Function} [onValidation] - Callback with ESP validation result
 * @property {Function} onStatusChange - Callback for status updates
 * @property {Function} getTheme - Optional function to get current theme (default: get from localStorage)
 */

/**
 * Create a render API client
 * @param {RenderAPIConfig} config
 * @returns {Object} Render API
 */
export function createRenderAPI(config) {
  const { onSuccess, onError, onStatusChange, onValidation, getTheme } = config;

  /**
   * Get current template theme
   * @returns {string} 'light' or 'dark'
   */
  function getCurrentTheme() {
    if (getTheme) return getTheme();
    return localStorage.getItem("template-theme") || "light";
  }

  /**
   * Render template with given data via API
   * @param {string} templateName
   * @param {Object} data
   * @returns {Promise<void>}
   */
  async function render(templateName, data) {
    onStatusChange("Actualizando...", "text-slate-500 font-medium", "bg-slate-400");

    const theme = getCurrentTheme();
    let response;
    try {
      response = await fetch(`/api/render?template=${templateName}&theme=${theme}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } catch (networkErr) {
      console.error("Render API network error:", networkErr);
      onStatusChange("Error al renderizar", "text-red-600 font-bold", "bg-red-600");
      onError(
        new RenderApiError({
          status: 0,
          code: "RENDER_FAILED",
          message: "No se pudo conectar con el servidor de render.",
        }),
      );
      return;
    }

    if (!response.ok) {
      const body = await response.text();
      const apiError = parseRenderErrorResponse(response, body);
      console.error("Render API error:", apiError);
      onStatusChange("Error al renderizar", "text-red-600 font-bold", "bg-red-600");
      onError(apiError);
      return;
    }

    const validationHeader = response.headers.get("X-ESP-Validation");
    if (onValidation) {
      try {
        onValidation(validationHeader ? JSON.parse(validationHeader) : { missing: [], unused: [] });
      } catch {
        onValidation({ missing: [], unused: [] });
      }
    }

    onSuccess(await response.text());
  }

  /**
   * Invalida la cache del template antes de forzar un render fresco.
   *
   * @param {string} templateName
   * @returns {Promise<void>}
   */
  async function invalidateTemplateCache(templateName) {
    await fetchText(`/api/cache/invalidate?template=${templateName}`, {
      method: "POST",
    });
  }

  /**
   * Create a debounced render function
   * Useful for live preview updates as user types
   *
   * @param {string} templateName
   * @param {Function} getEditorContent - Function that returns current editor content
   * @param {number} debounceMs
   * @returns {Function} Debounced render function
   */
  function createDebouncedRender(templateName, getEditorContent, debounceMs = 300) {
    return createDebounceTimer(() => {
      const currentContent = getEditorContent();
      let data;
      try {
        data =
          currentContent.json !== undefined ? currentContent.json : JSON.parse(currentContent.text);
      } catch {
        onStatusChange("JSON Inválido...", "text-yellow-600 font-medium", "bg-yellow-500");
        return;
      }

      render(templateName, data);
    }, debounceMs);
  }

  return {
    render,
    invalidateTemplateCache,
    createDebouncedRender,
  };
}
