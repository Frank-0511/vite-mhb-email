/**
 * @fileoverview Cliente de Render API para el módulo de preview.
 * Orquesta peticiones de renderizado, invalidación de caché y debounce de cambios.
 */

import { HEADER_X_ESP_VALIDATION } from "../../../../../../scripts/shared/contracts/constants/api-routes.ts";
import { RENDER_ERROR_CODE } from "../../../../../../scripts/shared/contracts/constants/render-error.ts";
import {
  invalidateCacheRoute,
  renderTemplateRoute,
} from "../../../../../../scripts/shared/contracts/routes/api-routes.ts";
import type { Theme } from "../../../../../../scripts/shared/contracts/types/theme.ts";
import {
  createDebounceTimer,
  fetchText,
  sendRequest,
} from "../../../../shared/utils/http-helpers.ts";
import { getTemplateTheme } from "../../../../shared/utils/theme-helpers.ts";
import { parseRenderErrorResponse, RenderApiError } from "./error-parser.ts";

type ESPValidationHeader = {
  missing?: string[];
  unused?: string[];
};

type RenderAPIConfig = {
  onSuccess: (html: string) => void;
  onError: (error: RenderApiError) => void;
  onValidation?: (validation: ESPValidationHeader) => void;
  onStatusChange: (text: string, textColor: string, dotColor: string) => void;
  getTheme?: () => Theme;
};

export type EditorContent = {
  json?: Record<string, unknown>;
  text: string;
};

type RenderAPIClient = {
  render: (templateName: string, data: Record<string, unknown>) => Promise<void>;
  invalidateTemplateCache: (templateName: string) => Promise<void>;
  createDebouncedRender: (
    templateName: string,
    getEditorContent: () => EditorContent,
    debounceMs?: number,
  ) => () => void;
};

/**
 * Crea el cliente de Render API para el preview.
 *
 * @param {RenderAPIConfig} config
 * @returns {RenderAPIClient}
 */
export function createRenderAPI(config: RenderAPIConfig): RenderAPIClient {
  const { onSuccess, onError, onStatusChange, onValidation, getTheme } = config;

  /**
   * Obtiene el tema activo ('light' o 'dark').
   */
  function getCurrentTheme(): Theme {
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
  async function render(templateName: string, data: Record<string, unknown>): Promise<void> {
    onStatusChange("Actualizando...", "text-slate-500 font-medium", "bg-slate-400");

    const theme = getCurrentTheme();
    let response;
    try {
      response = await sendRequest(renderTemplateRoute(templateName, theme), {
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
          code: RENDER_ERROR_CODE.FAILED,
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

    const validationHeader = response.headers.get(HEADER_X_ESP_VALIDATION);
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
  async function invalidateTemplateCache(templateName: string): Promise<void> {
    await fetchText(invalidateCacheRoute(templateName), {
      method: "POST",
    });
  }

  /**
   * Crea una función de renderizado con debounce para actualizaciones en vivo.
   *
   * @param {string} templateName
   * @param {() => EditorContent} getEditorContent
   * @param {number} [debounceMs=300]
   * @returns {() => void}
   */
  function createDebouncedRender(
    templateName: string,
    getEditorContent: () => EditorContent,
    debounceMs = 300,
  ): () => void {
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

      // Renderizado asíncrono con debounce tras cambio en editor
      void render(templateName, data);
    }, debounceMs);
  }

  return {
    render,
    invalidateTemplateCache,
    createDebouncedRender,
  };
}
