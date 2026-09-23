import { postJSON } from "../../../../shared/utils/http-helpers.ts";
import type { ValidationResult } from "./copy-html-formatters.ts";
import {
  copyTextToClipboard,
  formatDownloadSuccessMessage,
  formatErrorMessage,
  formatLoadingMessage,
  formatSuccessMessage,
} from "./copy-html-formatters.ts";
import type { DownloadHtmlOptions, DownloadHtmlResult } from "./html-download.ts";
import { downloadHtml } from "./html-download.ts";

import type { ModalState, RenderModalStateOptions } from "./copy-html-view.ts";

type CopyHtmlApiResponse = {
  success: boolean;
  html?: unknown;
  error?: string;
  validation?: ValidationResult;
};

type CopyHtmlControllerOptions = {
  templateName: string;
  postJsonFn?: (url: string, body: { build: boolean }) => Promise<CopyHtmlApiResponse>;
  copyToClipboard?: (text: string) => Promise<boolean>;
  downloadHtmlFn?: (options: DownloadHtmlOptions) => DownloadHtmlResult;
  renderState?: (state: ModalState, options?: RenderModalStateOptions) => void;
};

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
}: CopyHtmlControllerOptions) {
  /** @type {ModalState} */ let currentState = "idle";
  let lastHtml = "";
  const transition = (state: ModalState, options: RenderModalStateOptions = {}): void => {
    currentState = state;
    renderState(state, options);
  };
  const requestHtml = (build: boolean): Promise<CopyHtmlApiResponse> =>
    postJsonFn(`/api/copy-html?template=${encodeURIComponent(templateName)}`, { build });
  async function retryClipboard() {
    if (await copyToClipboard(lastHtml))
      transition("success", { message: "✅ HTML copiado al portapapeles." });
    else
      transition("error", {
        message: "❌ El portapapeles sigue bloqueado. Intenta hacer click en la página primero.",
      });
  }
  async function performCopy(build: boolean): Promise<void> {
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
  async function performDownload(build: boolean): Promise<void> {
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
        return transition("error", {
          message: formatErrorMessage(
            "error" in downloadResult ? downloadResult.error : "Error desconocido",
          ),
        });
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
