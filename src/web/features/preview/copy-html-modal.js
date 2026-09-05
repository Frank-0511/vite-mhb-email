// @ts-check
/**
 * @file copy-html-modal.js
 * Maneja el modal <dialog> para "Copiar HTML" en la página de preview.
 *
 * Flujo:
 *  1. El usuario hace click en #btn-copy-html → se abre el modal.
 *  2. El usuario elige "Buildear y copiar" o "Copiar HTML existente".
 *  3. El módulo llama POST /api/copy-html?template=<name> con { build: true/false }.
 *  4. Si la respuesta es exitosa:
 *     a. Intenta copiar el HTML al portapapeles con navigator.clipboard.writeText.
 *     b. Si el clipboard falla (foco/permisos), guarda el HTML y muestra un botón
 *        "Copiar ahora" para reintentar sin volver a buildear.
 *  5. El modal muestra estados: idle, loading, success, clipboard-error, error.
 *  6. El usuario puede cerrar el modal con el botón "Cancelar" o la tecla Escape.
 */

import { postJSON } from "../../shared/utils/http-helpers.js";
import {
  copyTextToClipboard,
  formatErrorMessage,
  formatLoadingMessage,
  formatSuccessMessage,
} from "./copy-html-formatters.js";
import { renderModalState } from "./copy-html-view.js";
import "./copy-html-modal.css";

// Re-exportar contratos públicos para compatibilidad total con consumidores
export {
  copyTextToClipboard,
  formatErrorMessage,
  formatLoadingMessage,
  formatSuccessMessage,
  formatValidation,
} from "./copy-html-formatters.js";
export { renderModalState } from "./copy-html-view.js";

/**
 * @typedef {import("./copy-html-view.js").ModalState} ModalState
 * @typedef {import("./copy-html-view.js").ModalElements} ModalElements
 * @typedef {import("./copy-html-view.js").RenderModalStateOptions} RenderModalStateOptions
 * @typedef {import("./copy-html-formatters.js").ValidationResult} ValidationResult
 */

/**
 * @typedef {Object} CopyHtmlApiResponse
 * @property {boolean} success
 * @property {string} [html]
 * @property {string} [error]
 * @property {ValidationResult} [validation]
 */

/**
 * @typedef {Object} ControllerDeps
 * @property {string} templateName
 * @property {(url: string, body: { build: boolean }) => Promise<CopyHtmlApiResponse>} [postJsonFn]
 * @property {(text: string) => Promise<boolean>} [copyToClipboard]
 * @property {(state: ModalState, options?: RenderModalStateOptions) => void} [renderState]
 */

/**
 * Crea el controlador desacoplado del modal de copia de HTML.
 *
 * @param {ControllerDeps} deps
 */
export function createCopyHtmlModalController({
  templateName,
  postJsonFn = postJSON,
  copyToClipboard = copyTextToClipboard,
  renderState = () => {},
}) {
  /** @type {ModalState} */
  let currentState = "idle";
  /** @type {string} */
  let lastHtml = "";

  /**
   * Actualiza el estado local y notifica al renderizador.
   *
   * @param {ModalState} state
   * @param {RenderModalStateOptions} [options]
   */
  function transition(state, options = {}) {
    currentState = state;
    renderState(state, options);
  }

  /**
   * Reintenta copiar el HTML ya obtenido al portapapeles sin volver a invocar la API.
   *
   * @returns {Promise<void>}
   */
  async function retryClipboard() {
    const ok = await copyToClipboard(lastHtml);
    if (ok) {
      transition("success", { message: "✅ HTML copiado al portapapeles." });
    } else {
      transition("error", {
        message: "❌ El portapapeles sigue bloqueado. Intenta hacer click en la página primero.",
      });
    }
  }

  /**
   * Ejecuta la lógica de copia: llama a la API y copia al portapapeles.
   *
   * @param {boolean} build - true para buildear primero; false para usar dist existente.
   * @returns {Promise<void>}
   */
  async function performCopy(build) {
    transition("loading", { message: formatLoadingMessage(build) });

    try {
      const result = await postJsonFn(
        `/api/copy-html?template=${encodeURIComponent(templateName)}`,
        { build },
      );

      if (!result.success) {
        transition("error", {
          message: formatErrorMessage(result.error ?? "Error desconocido"),
        });
        return;
      }

      const html = typeof result.html === "string" ? result.html : "";
      lastHtml = html;

      const ok = await copyToClipboard(html);
      if (ok) {
        transition("success", {
          message: formatSuccessMessage(build, result.validation),
        });
      } else {
        transition("clipboard-error", {
          onRetry: () => {
            retryClipboard().catch((err) => {
              transition("error", { message: formatErrorMessage(err) });
            });
          },
        });
      }
    } catch (err) {
      transition("error", { message: formatErrorMessage(err) });
    }
  }

  /**
   * Restablece el modal a su estado inicial.
   */
  function reset() {
    lastHtml = "";
    transition("idle");
  }

  return {
    getState: () => currentState,
    getLastHtml: () => lastHtml,
    performCopy,
    retryClipboard,
    reset,
  };
}

/**
 * Inicializa el modal de "Copiar HTML" y conecta todos los listeners.
 *
 * @param {{
 *   templateName: string,
 *   openBtn?: HTMLElement | null,
 *   dialog?: HTMLDialogElement | null,
 *   buildAndCopyBtn?: HTMLElement | null,
 *   copyExistingBtn?: HTMLElement | null,
 *   cancelBtn?: HTMLElement | null,
 *   modalStatus?: HTMLElement | null,
 *   postJsonFn?: (url: string, body: { build: boolean }) => Promise<any>,
 *   copyToClipboard?: (text: string) => Promise<boolean>,
 * }} options
 * @returns {void}
 */
export function initCopyHtmlModal({
  templateName,
  openBtn = typeof document !== "undefined" ? document.getElementById("btn-copy-html") : null,
  dialog = typeof document !== "undefined"
    ? /** @type {HTMLDialogElement | null} */ (document.getElementById("dialog-copy-html"))
    : null,
  buildAndCopyBtn = typeof document !== "undefined"
    ? document.getElementById("btn-build-and-copy")
    : null,
  copyExistingBtn = typeof document !== "undefined"
    ? document.getElementById("btn-copy-existing")
    : null,
  cancelBtn = typeof document !== "undefined" ? document.getElementById("btn-copy-cancel") : null,
  modalStatus = typeof document !== "undefined"
    ? document.getElementById("copy-html-status")
    : null,
  postJsonFn,
  copyToClipboard,
}) {
  if (!openBtn || !dialog) {
    console.warn("[copy-html-modal] Required elements not found.");
    return;
  }

  const elements = { buildAndCopyBtn, copyExistingBtn, modalStatus };

  const controller = createCopyHtmlModalController({
    templateName,
    postJsonFn,
    copyToClipboard,
    renderState: (state, options) => renderModalState(elements, state, options),
  });

  // Abrir el modal
  openBtn.addEventListener("click", () => {
    controller.reset();
    dialog.showModal();
  });

  // Botón "Buildear y copiar"
  if (buildAndCopyBtn) {
    buildAndCopyBtn.addEventListener("click", () => {
      controller.performCopy(true).catch((err) => {
        renderModalState(elements, "error", { message: formatErrorMessage(err) });
      });
    });
  }

  // Botón "Copiar HTML existente"
  if (copyExistingBtn) {
    copyExistingBtn.addEventListener("click", () => {
      controller.performCopy(false).catch((err) => {
        renderModalState(elements, "error", { message: formatErrorMessage(err) });
      });
    });
  }

  // Botón "Cancelar"
  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      dialog.close();
    });
  }

  // Cerrar al hacer click fuera del dialog (en el backdrop)
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) {
      dialog.close();
    }
  });

  // Restaurar al cerrar
  dialog.addEventListener("close", () => {
    controller.reset();
  });
}
