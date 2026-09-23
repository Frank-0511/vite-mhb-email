/**
 * @fileoverview Punto de entrada y barrel puro del módulo copy-html.
 */

import "./copy-html-modal.css";

export { createCopyHtmlModalController } from "./controller.ts";
export { initCopyHtmlDialog as initCopyHtmlModal } from "./dialog.ts";
export {
  copyTextToClipboard,
  formatDownloadSuccessMessage,
  formatErrorMessage,
  formatLoadingMessage,
  formatSuccessMessage,
  formatValidation,
} from "./formatters.ts";
export { renderModalState, updateExportModeView } from "./view.ts";
export { downloadHtml, isSafeDownloadTemplateName } from "./html-download.ts";
