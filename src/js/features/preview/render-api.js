/**
 * @file Render API client for preview
 * Handles template rendering via /api/render endpoint
 */

import { createDebounceTimer, fetchText } from "../../shared/http-helpers.js";

/**
 * @typedef {Object} RenderAPIConfig
 * @property {Function} onSuccess - Callback on successful render
 * @property {Function} onError - Callback on render error
 * @property {Function} onStatusChange - Callback for status updates
 */

/**
 * Create a render API client
 * @param {RenderAPIConfig} config
 * @returns {Object} Render API
 */
export function createRenderAPI(config) {
  const { onSuccess, onError, onStatusChange } = config;

  /**
   * Render template with given data via API
   * @param {string} templateName
   * @param {Object} data
   * @returns {Promise<void>}
   */
  async function render(templateName, data) {
    try {
      onStatusChange("Actualizando...", "text-slate-500 font-medium", "bg-slate-400");

      const html = await fetchText(`/api/render?template=${templateName}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      onSuccess(html);
    } catch (err) {
      console.error("Render API error:", err);
      onStatusChange("Error al renderizar", "text-red-600 font-bold", "bg-red-600");
      onError(err);
    }
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
    createDebouncedRender,
  };
}
