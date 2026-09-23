/**
 * @file Save and reset operations for preview
 * Handles persisting data to data.json and resetting to initial state
 */

import { queryRequired } from "../../../../shared/utils/dom-helpers.ts";
import { postJSON } from "../../../../shared/utils/http-helpers.ts";
import type { EditorContent } from "./editor.ts";

type SaveResetConfig = {
  templateName: string;
  getEditorContent?: () => EditorContent;
  setInitialData?: (data: Record<string, unknown>) => void;
  resetEditor?: () => void;
  resetIframe?: (templateName: string) => void;
  onStatusChange?: (text: string, textColor: string, dotColor: string) => void;
};

/**
 * @typedef {Object} SaveResetConfig
 * @property {string} templateName
 * @property {Function} [getEditorContent] - Get current editor content
 * @property {Function} [setInitialData] - Update initial data in editor
 * @property {Function} [resetEditor] - Reset editor to initial state
 * @property {Function} [resetIframe] - Reset iframe to initial template
 * @property {Function} [onStatusChange] - Callback for status updates
 */

/**
 * Setup save button handler
 * @param {SaveResetConfig} config
 * @returns {void}
 */
export function setupSaveButton(config: SaveResetConfig): void {
  const {
    templateName,
    getEditorContent = (): EditorContent => ({ text: "{}" }),
    setInitialData = (_data: Record<string, unknown>): void => {},
  } = config;

  const saveBtn = queryRequired("btn-save", "Save-Reset Module") as HTMLButtonElement;

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
      const response = await postJSON<{ success: boolean }>(
        `/api/data?template=${templateName}`,
        parsedData,
      );

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
export function setupResetButton(config: SaveResetConfig): void {
  const { templateName, resetEditor, resetIframe } = config;
  if (!resetEditor || !resetIframe) return;

  const resetBtn = queryRequired("btn-reset", "Save-Reset Module") as HTMLButtonElement;

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
