/**
 * @fileoverview Punto de entrada y barrel puro del módulo copy-html.
 */

import "./copy-html-modal.css";

export { createCopyHtmlModalController } from "./copy-html-controller.ts";
export { initCopyHtmlDialog as initCopyHtmlModal } from "./copy-html-dialog.ts";
export {
  copyTextToClipboard,
  formatDownloadSuccessMessage,
  formatErrorMessage,
  formatLoadingMessage,
  formatSuccessMessage,
  formatValidation,
} from "./copy-html-formatters.ts";
export { renderModalState, updateExportModeView } from "./copy-html-view.ts";
export { downloadHtml, isSafeDownloadTemplateName } from "./html-download.ts";
