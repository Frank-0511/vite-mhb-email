// @ts-check
import { postJSON } from "../../shared/utils/http-helpers.js";
import {
  copyTextToClipboard,
  formatDownloadSuccessMessage,
  formatErrorMessage,
  formatLoadingMessage,
  formatSuccessMessage,
} from "./copy-html-formatters.js";
import { downloadHtml } from "./html-download.js";

/** @typedef {import("./copy-html-view.js").ModalState} ModalState */
/** @typedef {import("./copy-html-view.js").RenderModalStateOptions} RenderModalStateOptions */
/** @typedef {import("./copy-html-formatters.js").ValidationResult} ValidationResult */
/** @typedef {import("./html-download.js").DownloadHtmlOptions} DownloadHtmlOptions */
/** @typedef {import("./html-download.js").DownloadHtmlResult} DownloadHtmlResult */
/** @typedef {{ success: boolean, html?: string, error?: string, validation?: ValidationResult }} CopyHtmlApiResponse */

/**
 * Crea el controlador puro de copia y descarga del HTML final.
 * @param {{ templateName: string, postJsonFn?: (url: string, body: { build: boolean }) => Promise<CopyHtmlApiResponse>, copyToClipboard?: (text: string) => Promise<boolean>, downloadHtmlFn?: (options: DownloadHtmlOptions) => DownloadHtmlResult, renderState?: (state: ModalState, options?: RenderModalStateOptions) => void }} deps
 */
export function createCopyHtmlModalController({
  templateName,
  postJsonFn = postJSON,
  copyToClipboard = copyTextToClipboard,
  downloadHtmlFn = downloadHtml,
  renderState = () => {},
}) {
  /** @type {ModalState} */ let currentState = "idle";
  let lastHtml = "";
  const transition = (state, options = {}) => {
    currentState = state;
    renderState(state, options);
  };
  const requestHtml = (build) =>
    postJsonFn(`/api/copy-html?template=${encodeURIComponent(templateName)}`, { build });
  async function retryClipboard() {
    if (await copyToClipboard(lastHtml))
      transition("success", { message: "✅ HTML copiado al portapapeles." });
    else
      transition("error", {
        message: "❌ El portapapeles sigue bloqueado. Intenta hacer click en la página primero.",
      });
  }
  async function performCopy(build) {
    transition("loading", { message: formatLoadingMessage(build) });
    try {
      const result = await requestHtml(build);
      if (!result.success)
        return transition("error", {
          message: formatErrorMessage(result.error ?? "Error desconocido"),
        });
      lastHtml = typeof result.html === "string" ? result.html : "";
      if (await copyToClipboard(lastHtml))
        transition("success", { message: formatSuccessMessage(build, result.validation) });
      else
        transition("clipboard-error", {
          onRetry: () =>
            retryClipboard().catch((error) =>
              transition("error", { message: formatErrorMessage(error) }),
            ),
        });
    } catch (error) {
      transition("error", { message: formatErrorMessage(error) });
    }
  }
  async function performDownload(build) {
    transition("loading", { message: formatLoadingMessage(build) });
    try {
      const result = await requestHtml(build);
      if (!result.success)
        return transition("error", {
          message: formatErrorMessage(result.error ?? "Error desconocido"),
        });
      if (typeof result.html !== "string")
        return transition("error", {
          message: formatErrorMessage("Respuesta inválida: falta el contenido HTML"),
        });
      const downloadResult = downloadHtmlFn({ templateName, html: result.html });
      if (!downloadResult.ok)
        return transition("error", { message: formatErrorMessage(downloadResult.error) });
      transition("success", { message: formatDownloadSuccessMessage(build, result.validation) });
    } catch (error) {
      transition("error", { message: formatErrorMessage(error) });
    }
  }
  return {
    getState: () => currentState,
    getLastHtml: () => lastHtml,
    performCopy,
    performDownload,
    retryClipboard,
    reset() {
      lastHtml = "";
      transition("idle");
    },
  };
}
