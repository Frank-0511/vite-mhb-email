import { createCopyHtmlModalController } from "./controller.ts";
import { formatErrorMessage } from "./formatters.ts";
import { renderModalState, updateExportModeView } from "./view.ts";
import "./copy-html-modal.css";

type DialogOptions = {
  templateName: string;
  [key: string]: unknown;
  createController?: typeof createCopyHtmlModalController;
  renderState?: typeof renderModalState;
  updateExportModeView?: typeof updateExportModeView;
  postJsonFn?: Parameters<typeof createCopyHtmlModalController>[0]["postJsonFn"];
  copyToClipboard?: Parameters<typeof createCopyHtmlModalController>[0]["copyToClipboard"];
  downloadHtmlFn?: Parameters<typeof createCopyHtmlModalController>[0]["downloadHtmlFn"];
};

type DialogElement = HTMLElement | HTMLInputElement;

function isCheckedElement(element: DialogElement | null | undefined): element is HTMLInputElement {
  return Boolean(element && "checked" in element);
}

/** @param {Record<string, any> & { templateName: string, createController?: typeof createCopyHtmlModalController, renderState?: typeof renderModalState, updateExportModeView?: typeof updateExportModeView }} options */
export function initCopyHtmlDialog(options: DialogOptions): void {
  const doc = typeof document !== "undefined" ? document : null;
  const element = (key: string, id: string): DialogElement | null =>
    (options[key] as DialogElement | undefined) ?? doc?.getElementById(id) ?? null;
  const openBtn = element("openBtn", "btn-copy-html");
  const dialog = element("dialog", "dialog-copy-html") as HTMLDialogElement | null;
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

  function getSelectedMode(): "copy" | "download" {
    if (isCheckedElement(elements.modeDownloadRadio) && elements.modeDownloadRadio.checked) {
      return "download";
    }
    return "copy";
  }

  function setMode(mode: "copy" | "download"): void {
    if (mode === "download") {
      if (isCheckedElement(elements.modeDownloadRadio)) elements.modeDownloadRadio.checked = true;
      if (isCheckedElement(elements.modeCopyRadio)) elements.modeCopyRadio.checked = false;
    } else {
      if (isCheckedElement(elements.modeCopyRadio)) elements.modeCopyRadio.checked = true;
      if (isCheckedElement(elements.modeDownloadRadio)) elements.modeDownloadRadio.checked = false;
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

  const bind = (button: DialogElement | null | undefined, action: () => Promise<void>): void =>
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
    if (isCheckedElement(elements.modeCopyRadio) && elements.modeCopyRadio.checked) setMode("copy");
  });
  elements.modeDownloadRadio?.addEventListener("change", () => {
    if (isCheckedElement(elements.modeDownloadRadio) && elements.modeDownloadRadio.checked)
      setMode("download");
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
  dialog.addEventListener("click", (event: MouseEvent) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener("close", () => {
    controller.reset();
    setMode("copy");
  });
}
