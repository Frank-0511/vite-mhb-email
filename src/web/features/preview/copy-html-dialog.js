// @ts-check
import { formatErrorMessage } from "./copy-html-formatters.js";
import { createCopyHtmlModalController } from "./copy-html-controller.js";
import { renderModalState } from "./copy-html-view.js";

/** @param {Record<string, any> & { templateName: string, createController?: typeof createCopyHtmlModalController, renderState?: typeof renderModalState }} options */
export function initCopyHtmlDialog(options) {
  const doc = typeof document !== "undefined" ? document : null;
  const element = (key, id) => options[key] ?? doc?.getElementById(id) ?? null;
  const openBtn = element("openBtn", "btn-copy-html");
  const dialog = element("dialog", "dialog-copy-html");
  if (!openBtn || !dialog) return;
  const elements = {
    buildAndCopyBtn: element("buildAndCopyBtn", "btn-build-and-copy"),
    copyExistingBtn: element("copyExistingBtn", "btn-copy-existing"),
    buildAndDownloadBtn: element("buildAndDownloadBtn", "btn-build-and-download"),
    downloadExistingBtn: element("downloadExistingBtn", "btn-download-existing"),
    modalStatus: element("modalStatus", "copy-html-status"),
  };
  const renderState = options.renderState ?? renderModalState;
  const controller = (options.createController ?? createCopyHtmlModalController)({
    templateName: options.templateName,
    postJsonFn: options.postJsonFn,
    copyToClipboard: options.copyToClipboard,
    downloadHtmlFn: options.downloadHtmlFn,
    renderState: (state, renderOptions) => renderState(elements, state, renderOptions),
  });
  const bind = (button, action) =>
    button?.addEventListener("click", () =>
      action().catch((error) =>
        renderState(elements, "error", { message: formatErrorMessage(error) }),
      ),
    );
  openBtn.addEventListener("click", () => {
    controller.reset();
    dialog.showModal();
  });
  bind(elements.buildAndCopyBtn, () => controller.performCopy(true));
  bind(elements.copyExistingBtn, () => controller.performCopy(false));
  bind(elements.buildAndDownloadBtn, () => controller.performDownload(true));
  bind(elements.downloadExistingBtn, () => controller.performDownload(false));
  element("cancelBtn", "btn-copy-cancel")?.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener("close", () => controller.reset());
}
