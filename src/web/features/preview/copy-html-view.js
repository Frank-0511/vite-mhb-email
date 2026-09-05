// @ts-check
/**
 * @fileoverview Capa de renderizado y manipulación segura del DOM para el modal de copiar HTML.
 */

/**
 * @typedef {"idle" | "loading" | "success" | "clipboard-error" | "error"} ModalState
 */

/**
 * @typedef {Object} ModalElements
 * @property {HTMLElement | null} [buildAndCopyBtn]
 * @property {HTMLElement | null} [copyExistingBtn]
 * @property {HTMLElement | null} [buildAndDownloadBtn]
 * @property {HTMLElement | null} [downloadExistingBtn]
 * @property {HTMLElement | null} [modalStatus]
 */

/**
 * @typedef {Object} RenderModalStateOptions
 * @property {string} [message]
 * @property {() => void} [onRetry]
 * @property {Document} [doc]
 */

/**
 * Habilita o deshabilita los botones de acción del modal.
 *
 * @param {ModalElements} elements
 * @param {boolean} disabled
 */
function setActionButtonsDisabled(elements, disabled) {
  const buttons = [
    elements.buildAndCopyBtn,
    elements.copyExistingBtn,
    elements.buildAndDownloadBtn,
    elements.downloadExistingBtn,
  ];

  for (const btn of buttons) {
    if (btn) {
      if (disabled) {
        btn.setAttribute("disabled", "");
      } else {
        btn.removeAttribute("disabled");
      }
    }
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
export function renderModalState(elements, state, options = {}) {
  const { buildAndCopyBtn, copyExistingBtn, modalStatus } = elements;
  if (!buildAndCopyBtn || !copyExistingBtn || !modalStatus) return;

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
