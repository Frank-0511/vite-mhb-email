/**
 * @fileoverview Capa de renderizado y manipulación segura del DOM para el modal de copiar HTML.
 */

/**
 * @typedef {"idle" | "loading" | "success" | "clipboard-error" | "error"} ModalState
 */
export type ModalState = "idle" | "loading" | "success" | "clipboard-error" | "error";

/**
 * @typedef {Object} ModalElements
 * @property {HTMLElement | null} [buildActionBtn]
 * @property {HTMLElement | null} [existingActionBtn]
 * @property {HTMLInputElement | null} [modeCopyRadio]
 * @property {HTMLInputElement | null} [modeDownloadRadio]
 * @property {HTMLElement | null} [textExportBuild]
 * @property {HTMLElement | null} [descExportBuild]
 * @property {HTMLElement | null} [textExportExisting]
 * @property {HTMLElement | null} [descExportExisting]
 * @property {HTMLElement | null} [templateChip]
 * @property {HTMLElement | null} [actionsSub]
 * @property {HTMLElement | null} [iconExportExistingCopy]
 * @property {HTMLElement | null} [iconExportExistingDownload]
 * @property {HTMLElement | null} [buildAndCopyBtn]
 * @property {HTMLElement | null} [copyExistingBtn]
 * @property {HTMLElement | null} [buildAndDownloadBtn]
 * @property {HTMLElement | null} [downloadExistingBtn]
 * @property {HTMLElement | null} [modalStatus]
 */
export type ModalElements = {
  [key: string]: HTMLElement | HTMLInputElement | null | undefined;
};

/**
 * @typedef {Object} RenderModalStateOptions
 * @property {string} [message]
 * @property {() => void} [onRetry]
 * @property {Document} [doc]
 */
export type RenderModalStateOptions = {
  message?: string;
  onRetry?: () => void;
  doc?: Document;
};

/**
 * Habilita o deshabilita los botones y controles de acción del modal.
 *
 * @param {ModalElements} elements
 * @param {boolean} disabled
 */
function setActionButtonsDisabled(elements: ModalElements, disabled: boolean): void {
  const controls = [
    elements.buildActionBtn,
    elements.existingActionBtn,
    elements.modeCopyRadio,
    elements.modeDownloadRadio,
    elements.buildAndCopyBtn,
    elements.copyExistingBtn,
    elements.buildAndDownloadBtn,
    elements.downloadExistingBtn,
  ];

  for (const ctrl of controls) {
    if (ctrl) {
      if (disabled) {
        ctrl.setAttribute("disabled", "");
      } else {
        ctrl.removeAttribute("disabled");
      }
    }
  }
}

/**
 * Actualiza las etiquetas e iconos de los botones según el modo de exportación seleccionado.
 *
 * @param {ModalElements} elements
 * @param {"copy" | "download"} mode
 * @returns {void}
 */
export function updateExportModeView(elements: ModalElements, mode: "copy" | "download"): void {
  const isCopy = mode === "copy";
  if (elements.actionsSub) {
    elements.actionsSub.textContent = isCopy
      ? "Acciones para copiar al portapapeles:"
      : "Acciones para descargar archivo .html:";
  }
  if (elements.textExportBuild) {
    elements.textExportBuild.textContent = isCopy ? "Compilar y copiar" : "Compilar y descargar";
  }
  if (elements.descExportBuild) {
    elements.descExportBuild.textContent = isCopy
      ? "Compila con Maizzle e inyecta los estilos y variables actuales del preview."
      : "Compila con Maizzle y genera el archivo .html para descarga directa.";
  }
  if (elements.textExportExisting) {
    elements.textExportExisting.textContent = isCopy
      ? "Copiar versión en disco"
      : "Descargar versión en disco";
  }
  if (elements.descExportExisting) {
    elements.descExportExisting.textContent = isCopy
      ? "Usa el último HTML generado en dist/ sin volver a compilar."
      : "Descarga el último HTML generado en dist/ sin volver a compilar.";
  }
  const iconCopy =
    elements.iconExportExistingCopy ||
    (typeof document !== "undefined" ? document.getElementById("icon-export-existing-copy") : null);
  const iconDownload =
    elements.iconExportExistingDownload ||
    (typeof document !== "undefined"
      ? document.getElementById("icon-export-existing-download")
      : null);

  if (iconCopy) {
    iconCopy.style.display = isCopy ? "" : "none";
  }
  if (iconDownload) {
    iconDownload.style.display = isCopy ? "none" : "";
  }
}

/**
 * Aplica el estado visual y de accesibilidad a los elementos del modal.
 * Utiliza construcción DOM segura para evitar interpolación no confiable con innerHTML.
 *
 * @param {ModalElements} elements
 * @param {ModalState} state
 * @param {RenderModalStateOptions} [options]
 * @returns {void}
 */
export function renderModalState(
  elements: ModalElements,
  state: ModalState,
  options: RenderModalStateOptions = {},
): void {
  const hasActionButtons =
    (elements.buildActionBtn && elements.existingActionBtn) ||
    (elements.buildAndCopyBtn && elements.copyExistingBtn);
  const modalStatus = elements.modalStatus;
  if (!hasActionButtons || !modalStatus) return;

  const message = options.message || "";
  const activeDocument = options.doc || (typeof document !== "undefined" ? document : null);

  switch (state) {
    case "idle":
      setActionButtonsDisabled(elements, false);
      modalStatus.textContent = "";
      modalStatus.className = "copy-html-status hidden";
      break;

    case "loading":
      setActionButtonsDisabled(elements, true);
      modalStatus.textContent = message || "Procesando…";
      modalStatus.className = "copy-html-status loading";
      break;

    case "success":
      setActionButtonsDisabled(elements, false);
      modalStatus.textContent = message || "✅ HTML copiado al portapapeles.";
      modalStatus.className = "copy-html-status success";
      break;

    case "clipboard-error": {
      setActionButtonsDisabled(elements, false);
      modalStatus.className = "copy-html-status error";
      modalStatus.textContent = "";

      if (!activeDocument) break;

      // Construcción DOM estática y segura, sin innerHTML ni concatenación arbitraria
      const span = activeDocument.createElement("span");
      span.textContent =
        "⚠️ No se pudo acceder al portapapeles (el foco del navegador fue interrumpido).";

      const retryBtn = activeDocument.createElement("button");
      retryBtn.id = "btn-retry-clipboard";
      retryBtn.type = "button";
      retryBtn.style.marginTop = "8px";
      retryBtn.style.display = "block";
      retryBtn.style.width = "100%";
      retryBtn.style.padding = "8px 12px";
      retryBtn.style.background = "#0ea5e9";
      retryBtn.style.color = "#fff";
      retryBtn.style.border = "none";
      retryBtn.style.borderRadius = "6px";
      retryBtn.style.fontSize = "0.8125rem";
      retryBtn.style.fontWeight = "600";
      retryBtn.style.cursor = "pointer";
      retryBtn.textContent = "Copiar ahora";

      if (typeof options.onRetry === "function") {
        retryBtn.addEventListener("click", options.onRetry);
      }

      if (typeof modalStatus.replaceChildren === "function") {
        modalStatus.replaceChildren(span, retryBtn);
      } else {
        modalStatus.textContent = "";
        modalStatus.appendChild(span);
        modalStatus.appendChild(retryBtn);
      }
      break;
    }

    case "error":
      setActionButtonsDisabled(elements, false);
      modalStatus.textContent = message || "❌ Ocurrió un error.";
      modalStatus.className = "copy-html-status error";
      break;
  }
}
