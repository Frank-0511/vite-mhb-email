/**
 * @file Save and reset operations for preview
 * Handles persisting data to data.json and resetting to initial state
 */

import { queryRequired } from "../../shared/dom-helpers.js";
import { postJSON } from "../../shared/http-helpers.js";

/**
 * @typedef {Object} SaveResetConfig
 * @property {string} templateName
 * @property {Function} getEditorContent - Get current editor content
 * @property {Function} setInitialData - Update initial data in editor
 * @property {Function} resetEditor - Reset editor to initial state
 * @property {Function} resetIframe - Reset iframe to initial template
 * @property {Function} onStatusChange - Callback for status updates
 */

/**
 * Setup save button handler
 * @param {SaveResetConfig} config
 * @returns {void}
 */
export function setupSaveButton(config) {
  const { templateName, getEditorContent, setInitialData } = config;

  const saveBtn = queryRequired("btn-save", "Save-Reset Module");

  saveBtn.addEventListener("click", async () => {
    const currentContent = getEditorContent();
    let parsedData;

    try {
      parsedData =
        currentContent.json !== undefined ? currentContent.json : JSON.parse(currentContent.text);
    } catch {
      alert("No se puede guardar porque el JSON actual es inválido.");
      return;
    }

    const originalText = saveBtn.innerHTML;

    saveBtn.innerHTML = `<i data-lucide="clock" class="w-5 h-5 inline"></i> <span>Guardando...</span>`;
    saveBtn.disabled = true;

    try {
      const response = await postJSON(`/api/data?template=${templateName}`, parsedData);

      if (response.success) {
        // Update initial data in editor
        setInitialData(parsedData);

        saveBtn.innerHTML = `<i data-lucide="check-circle" class="w-5 h-5 inline"></i> <span>¡Guardado con éxito!</span>`;
        saveBtn.classList.replace("bg-sky-500", "bg-emerald-500");
        saveBtn.classList.replace("hover:bg-sky-600", "hover:bg-emerald-600");

        setTimeout(() => {
          saveBtn.innerHTML = originalText;
          saveBtn.classList.replace("bg-emerald-500", "bg-sky-500");
          saveBtn.classList.replace("hover:bg-emerald-600", "hover:bg-sky-600");
          saveBtn.disabled = false;
        }, 2500);
      } else {
        throw new Error("API devolvió success=false");
      }
    } catch (err) {
      console.error("Save error:", err);
      alert("Error de red al intentar guardar en data.json");
      saveBtn.innerHTML = originalText;
      saveBtn.disabled = false;
    }
  });
}

/**
 * Setup reset button handler
 * @param {SaveResetConfig} config
 * @returns {void}
 */
export function setupResetButton(config) {
  const { templateName, resetEditor, resetIframe } = config;

  const resetBtn = queryRequired("btn-reset", "Save-Reset Module");

  resetBtn.addEventListener("click", () => {
    if (
      confirm(
        "¿Seguro que quieres descartar los cambios no guardados? El editor volverá a los valores actuales físicos.",
      )
    ) {
      resetEditor();
      resetIframe(templateName);
    }
  });
}
