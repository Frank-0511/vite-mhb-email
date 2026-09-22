// @ts-check
/**
 * @fileoverview Cliente de Render API para el módulo de preview.
 * Orquesta peticiones de renderizado, invalidación de caché y debounce de cambios.
 */

import {
  createDebounceTimer,
  fetchText,
  sendRequest,
} from "../../../../shared/utils/http-helpers.js";
import { getTemplateTheme } from "../../../../shared/utils/theme-helpers.js";
import { parseRenderErrorResponse, RenderApiError } from "./render-error-parser.js";

export { parseRenderErrorResponse, RenderApiError };

/**
 * @typedef {Object} ESPValidationHeader
 * @property {string[]} [missing] - Lista de variables ESP requeridas no provistas.
 * @property {string[]} [unused] - Lista de variables provistas no usadas.
 */

/**
 * @typedef {Object} RenderAPIConfig
 * @property {(html: string) => void} onSuccess - Callback al completar el render exitoso.
 * @property {(error: RenderApiError) => void} onError - Callback ante error de render o red.
 * @property {(validation: ESPValidationHeader) => void} [onValidation] - Callback con el resultado de variables ESP.
 * @property {(text: string, textColor: string, dotColor: string) => void} onStatusChange - Callback para actualizar el estado visual de sincronización.
 * @property {() => string} [getTheme] - Función opcional para obtener el tema actual ('light' | 'dark').
 */

/**
 * @typedef {Object} RenderAPIClient
 * @property {(templateName: string, data: Record<string, unknown>) => Promise<void>} render
 * @property {(templateName: string) => Promise<void>} invalidateTemplateCache
 * @property {(templateName: string, getEditorContent: () => { json?: Record<string, unknown>, text: string }, debounceMs?: number) => () => void} createDebouncedRender
 */

/**
 * Crea el cliente de Render API para el preview.
 *
 * @param {RenderAPIConfig} config
 * @returns {RenderAPIClient}
 */
export function createRenderAPI(config) {
  const { onSuccess, onError, onStatusChange, onValidation, getTheme } = config;

  /**
   * Obtiene el tema activo ('light' o 'dark').
   *
   * @returns {string}
   */
  function getCurrentTheme() {
    if (getTheme) return getTheme();
    return getTemplateTheme();
  }

  /**
   * Renderiza el template con los datos provistos a través del endpoint `/api/render`.
   *
   * @param {string} templateName
   * @param {Record<string, unknown>} data
   * @returns {Promise<void>}
   */
  async function render(templateName, data) {
    onStatusChange("Actualizando...", "text-slate-500 font-medium", "bg-slate-400");

    const theme = getCurrentTheme();
    let response;
    try {
      response = await sendRequest(`/api/render?template=${templateName}&theme=${theme}`, {
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
   * Crea una función de renderizado con debounce para actualizaciones en vivo.
   *
   * @param {string} templateName
   * @param {() => { json?: Record<string, unknown>, text: string }} getEditorContent
   * @param {number} [debounceMs=300]
   * @returns {() => void}
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
