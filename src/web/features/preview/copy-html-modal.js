/**
 * @file copy-html-modal.js
 * Maneja el modal <dialog> para "Copiar HTML" en la página de preview.
 *
 * Flujo:
 *  1. El usuario hace click en #btn-copy-html → se abre el modal.
 *  2. El usuario elige "Buildear y copiar" o "Copiar HTML existente".
 *  3. El módulo llama POST /api/copy-html?template=<name> con { build: true/false }.
 *  4. Si la respuesta es exitosa:
 *     a. Intenta copiar el HTML al portapapeles con navigator.clipboard.writeText.
 *     b. Si el clipboard falla (foco/permisos), guarda el HTML y muestra un botón
 *        "Copiar ahora" para reintentar sin volver a buildear.
 *  5. El modal muestra estados: idle, loading, success, clipboard-error, error.
 *  6. El usuario puede cerrar el modal con el botón "Cancelar" o la tecla Escape.
 */

import { postJSON } from "../../shared/utils/http-helpers.js";

/**
 * @typedef {"idle" | "loading" | "success" | "clipboard-error" | "error"} ModalState
 */

/**
 * Inicializa el modal de "Copiar HTML" y conecta todos los listeners.
 *
 * @param {{ templateName: string }} options
 * @returns {void}
 */
export function initCopyHtmlModal({ templateName }) {
  const openBtn = document.getElementById("btn-copy-html");
  const dialog = /** @type {HTMLDialogElement | null} */ (
    document.getElementById("dialog-copy-html")
  );

  if (!openBtn || !dialog) {
    console.warn("[copy-html-modal] Required elements not found.");
    return;
  }

  const buildAndCopyBtn = document.getElementById("btn-build-and-copy");
  const copyExistingBtn = document.getElementById("btn-copy-existing");
  const cancelBtn = document.getElementById("btn-copy-cancel");
  const modalStatus = document.getElementById("copy-html-status");

  /** HTML más reciente recibido desde la API (para reintentar clipboard sin rebuild). */
  let lastHtml = "";

  /**
   * Intenta copiar texto al portapapeles.
   * Devuelve true si tuvo éxito, false si el navegador rechazó el acceso.
   *
   * @param {string} html
   * @returns {Promise<boolean>}
   */
  async function tryClipboard(html) {
    try {
      await navigator.clipboard.writeText(html);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Aplica el estado visual del modal.
   *
   * @param {ModalState} state
   * @param {string} [message] - Texto adicional para los estados success/error.
   */
  function setState(state, message = "") {
    if (!buildAndCopyBtn || !copyExistingBtn || !modalStatus) return;

    modalStatus.className = "copy-html-status";

    switch (state) {
      case "idle":
        buildAndCopyBtn.removeAttribute("disabled");
        copyExistingBtn.removeAttribute("disabled");
        modalStatus.textContent = "";
        modalStatus.className = "copy-html-status hidden";
        break;

      case "loading":
        buildAndCopyBtn.setAttribute("disabled", "");
        copyExistingBtn.setAttribute("disabled", "");
        modalStatus.textContent = message || "Procesando…";
        modalStatus.className = "copy-html-status loading";
        break;

      case "success":
        buildAndCopyBtn.removeAttribute("disabled");
        copyExistingBtn.removeAttribute("disabled");
        modalStatus.textContent = message || "✅ HTML copiado al portapapeles.";
        modalStatus.className = "copy-html-status success";
        break;

      case "clipboard-error":
        // El HTML se obtuvo correctamente pero el clipboard fue rechazado.
        // Mostramos un botón para reintentar el clipboard sin volver a buildear.
        buildAndCopyBtn.removeAttribute("disabled");
        copyExistingBtn.removeAttribute("disabled");
        modalStatus.className = "copy-html-status error";
        modalStatus.innerHTML = `
          <span>⚠️ No se pudo acceder al portapapeles (el foco del navegador fue interrumpido).</span>
          <button
            id="btn-retry-clipboard"
            type="button"
            style="margin-top:8px;display:block;width:100%;padding:8px 12px;background:#0ea5e9;color:#fff;border:none;border-radius:6px;font-size:0.8125rem;font-weight:600;cursor:pointer;"
          >Copiar ahora</button>`;

        // El botón de reintento copia el HTML ya recibido sin volver a la API.
        {
          const retryBtn = document.getElementById("btn-retry-clipboard");
          if (retryBtn) {
            retryBtn.addEventListener("click", () => {
              tryClipboard(lastHtml).then((ok) => {
                if (ok) {
                  setState("success", "✅ HTML copiado al portapapeles.");
                } else {
                  setState(
                    "error",
                    "❌ El portapapeles sigue bloqueado. Intenta hacer click en la página primero.",
                  );
                }
              });
            });
          }
        }
        break;

      case "error":
        buildAndCopyBtn.removeAttribute("disabled");
        copyExistingBtn.removeAttribute("disabled");
        modalStatus.textContent = message || "❌ Ocurrió un error.";
        modalStatus.className = "copy-html-status error";
        break;
    }
  }

  /**
   * Ejecuta la lógica de copia: llama a la API y copia al clipboard.
   *
   * @param {boolean} build - true para buildear primero; false para usar dist existente.
   * @returns {Promise<void>}
   */
  async function performCopy(build) {
    setState("loading", build ? "Buildeando template…" : "Leyendo HTML…");

    try {
      const result = await postJSON(`/api/copy-html?template=${encodeURIComponent(templateName)}`, {
        build,
      });

      if (!result.success) {
        setState("error", `❌ ${result.error ?? "Error desconocido"}`);
        return;
      }

      // Guardar el HTML para reintentos de clipboard sin rebuild.
      lastHtml = result.html;

      const ok = await tryClipboard(result.html);
      if (ok) {
        setState(
          "success",
          build
            ? "✅ Build completado. HTML copiado al portapapeles."
            : "✅ HTML copiado al portapapeles.",
        );
      } else {
        // El modal está abierto pero el navegador bloqueó el clipboard.
        setState("clipboard-error");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setState("error", `❌ ${message}`);
    }
  }

  // Abrir el modal
  openBtn.addEventListener("click", () => {
    setState("idle");
    dialog.showModal();
  });

  // Botón "Buildear y copiar"
  if (buildAndCopyBtn) {
    buildAndCopyBtn.addEventListener("click", () => {
      performCopy(true).catch((err) => {
        const message = err instanceof Error ? err.message : String(err);
        setState("error", `❌ ${message}`);
      });
    });
  }

  // Botón "Copiar HTML existente"
  if (copyExistingBtn) {
    copyExistingBtn.addEventListener("click", () => {
      performCopy(false).catch((err) => {
        const message = err instanceof Error ? err.message : String(err);
        setState("error", `❌ ${message}`);
      });
    });
  }

  // Botón "Cancelar"
  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      dialog.close();
    });
  }

  // Cerrar al hacer click fuera del dialog (en el backdrop)
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) {
      dialog.close();
    }
  });

  // Restaurar al cerrar
  dialog.addEventListener("close", () => {
    lastHtml = "";
    setState("idle");
  });
}
