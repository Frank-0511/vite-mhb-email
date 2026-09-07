// @ts-check
import { formatErrorMessage } from "./copy-html-formatters.js";
import { createCopyHtmlModalController } from "./copy-html-controller.js";
import { renderModalState, updateExportModeView } from "./copy-html-view.js";

/** @param {Record<string, any> & { templateName: string, createController?: typeof createCopyHtmlModalController, renderState?: typeof renderModalState, updateExportModeView?: typeof updateExportModeView }} options */
export function initCopyHtmlDialog(options) {
  const doc = typeof document !== "undefined" ? document : null;
  const element = (key, id) => options[key] ?? doc?.getElementById(id) ?? null;
  const openBtn = element("openBtn", "btn-copy-html");
  const dialog = element("dialog", "dialog-copy-html");
  if (!openBtn || !dialog) return;

  const elements = {
    // Nuevos controles unificados
    buildActionBtn: element("buildActionBtn", "btn-export-build"),
    existingActionBtn: element("existingActionBtn", "btn-export-existing"),
    modeCopyRadio: element("modeCopyRadio", "export-mode-copy"),
    modeDownloadRadio: element("modeDownloadRadio", "export-mode-download"),
    textExportBuild: element("textExportBuild", "text-export-build"),
    descExportBuild: element("descExportBuild", "desc-export-build"),
    textExportExisting: element("textExportExisting", "text-export-existing"),
    descExportExisting: element("descExportExisting", "desc-export-existing"),
    templateChip: element("templateChip", "copy-html-template-chip"),
    actionsSub: element("actionsSub", "copy-html-actions-sub"),
    iconExportExistingCopy: element("iconExportExistingCopy", "icon-export-existing-copy"),
    iconExportExistingDownload: element(
      "iconExportExistingDownload",
      "icon-export-existing-download",
    ),

    // Controles anteriores (mantenidos para retrocompatibilidad con tests)
    buildAndCopyBtn: element("buildAndCopyBtn", "btn-build-and-copy"),
    copyExistingBtn: element("copyExistingBtn", "btn-copy-existing"),
    buildAndDownloadBtn: element("buildAndDownloadBtn", "btn-build-and-download"),
    downloadExistingBtn: element("downloadExistingBtn", "btn-download-existing"),
    modalStatus: element("modalStatus", "copy-html-status"),
  };

  const renderState = options.renderState ?? renderModalState;
  const updateModeView = options.updateExportModeView ?? updateExportModeView;

  function getSelectedMode() {
    if (elements.modeDownloadRadio && elements.modeDownloadRadio.checked) {
      return "download";
    }
    return "copy";
  }

  function setMode(mode) {
    if (mode === "download") {
      if (elements.modeDownloadRadio) elements.modeDownloadRadio.checked = true;
      if (elements.modeCopyRadio) elements.modeCopyRadio.checked = false;
    } else {
      if (elements.modeCopyRadio) elements.modeCopyRadio.checked = true;
      if (elements.modeDownloadRadio) elements.modeDownloadRadio.checked = false;
    }
    updateModeView(elements, mode);
  }

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

  const updateChip = () => {
    if (elements.templateChip && options.templateName) {
      elements.templateChip.textContent = `${options.templateName}.html`;
    }
  };
  updateChip();

  openBtn.addEventListener("click", () => {
    controller.reset();
    setMode("copy");
    updateChip();
    dialog.showModal();
  });

  // Eventos de selección de modo
  elements.modeCopyRadio?.addEventListener("change", () => {
    if (elements.modeCopyRadio.checked) setMode("copy");
  });
  elements.modeDownloadRadio?.addEventListener("change", () => {
    if (elements.modeDownloadRadio.checked) setMode("download");
  });

  // Botones de acción dinámica según el modo activo
  bind(elements.buildActionBtn, () => {
    const mode = getSelectedMode();
    return mode === "download" ? controller.performDownload(true) : controller.performCopy(true);
  });
  bind(elements.existingActionBtn, () => {
    const mode = getSelectedMode();
    return mode === "download" ? controller.performDownload(false) : controller.performCopy(false);
  });

  // Botones heredados (compatibilidad)
  bind(elements.buildAndCopyBtn, () => controller.performCopy(true));
  bind(elements.copyExistingBtn, () => controller.performCopy(false));
  bind(elements.buildAndDownloadBtn, () => controller.performDownload(true));
  bind(elements.downloadExistingBtn, () => controller.performDownload(false));

  element("cancelBtn", "btn-copy-cancel")?.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener("close", () => {
    controller.reset();
    setMode("copy");
  });
}
