// @ts-check
/** @fileoverview Fachada compatible del diálogo de copia y descarga de HTML. */
import "./copy-html-modal.css";

export { createCopyHtmlModalController } from "./copy-html-controller.js";
export { initCopyHtmlDialog as initCopyHtmlModal } from "./copy-html-dialog.js";
export {
  copyTextToClipboard,
  formatDownloadSuccessMessage,
  formatErrorMessage,
  formatLoadingMessage,
  formatSuccessMessage,
  formatValidation,
} from "./copy-html-formatters.js";
export { renderModalState } from "./copy-html-view.js";
export { downloadHtml, isSafeDownloadTemplateName } from "./html-download.js";
