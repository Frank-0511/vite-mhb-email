// @ts-check
/**
 * @fileoverview Controlador del estado visual del preview (sincronización, variables ESP y errores).
 */

import { queryRequired, querySafe } from "../../../../shared/utils/dom-helpers.js";
import { createRenderErrorView } from "../render/render-error-view.js";

/**
 * @typedef {Object} ESPValidationData
 * @property {string[]} [missing] - Variables ESP requeridas faltantes.
 * @property {string[]} [unused] - Variables de datos provistas no utilizadas.
 */

/**
 * @typedef {Object} PreviewStatusElements
 * @property {any} [syncStatus] - Elemento DOM para el estado de sincronización.
 * @property {any} [espStatus] - Elemento DOM para el aviso de variables ESP.
 * @property {import("../render/render-error-view.js").RenderErrorView} [renderErrorView] - Vista accesible de errores de render.
 */

/**
 * @typedef {Object} PreviewStatusController
 * @property {(text: string, textColor: string, dotColor: string) => void} sync - Actualiza el indicador de sincronización.
 * @property {(result?: ESPValidationData | null) => void} esp - Actualiza el aviso de validación de variables ESP.
 * @property {(html: string, iframeManager?: { updateContent: (content: string) => void }) => void} renderSuccess - Aplica render exitoso y limpia errores.
 * @property {(error: unknown) => void} renderError - Muestra un error estructurado de render.
 */

/**
 * Actualiza de forma segura el contenido del indicador de estado sin interpolar HTML externo.
 *
 * @param {any} element
 * @param {string} text
 * @param {string} textColor
 * @param {string} dotColor
 */
function updateSyncStatusElement(element, text, textColor, dotColor) {
  if (!element) return;

  const isHidden =
    element.classList && typeof element.classList.contains === "function"
      ? element.classList.contains("hidden")
      : typeof element.className === "string" && element.className.includes("hidden");

  element.className = `text-sm flex items-center gap-1 ${textColor}${isHidden ? " hidden" : ""}`;

  if (
    typeof document !== "undefined" &&
    typeof document.createElement === "function" &&
    typeof element.append === "function"
  ) {
    element.textContent = "";
    const dot = document.createElement("span");
    dot.className = `w-2 h-2 rounded-full ${dotColor}`;
    element.append(dot, document.createTextNode(` ${text}`));
  } else {
    element.innerHTML = `<span class="w-2 h-2 rounded-full ${dotColor}"></span> ${text}`;
  }
}

/**
 * Devuelve un resumen legible con pluralización para una cantidad de variables.
 *
 * @param {number} count
 * @param {string} singular
 * @param {string} plural
 * @returns {string}
 */
function formatCount(count, singular, plural) {
  return `${count} ${count === 1 ? singular : plural}`;
}

/**
 * Crea el controlador de estado visual para sincronización, variables ESP y errores de render.
 *
 * @param {PreviewStatusElements} [elements]
 * @returns {PreviewStatusController}
 */
export function createPreviewStatus(elements) {
  const syncStatus = elements?.syncStatus ?? queryRequired("sync-status", "Preview Module");
  const espStatus =
    elements?.espStatus !== undefined ? elements.espStatus : querySafe("esp-validation-status");
  const errorView =
    elements?.renderErrorView ?? createRenderErrorView(querySafe("preview-render-error"));

  return {
    sync(text, textColor, dotColor) {
      updateSyncStatusElement(syncStatus, text, textColor, dotColor);
    },

    esp(result) {
      if (!espStatus) return;

      const missing = Array.isArray(result?.missing) ? result.missing : [];
      const unused = Array.isArray(result?.unused) ? result.unused : [];
      const messages = [];
      const details = [];

      if (missing.length > 0) {
        messages.push(
          `⚠️ ${formatCount(missing.length, "variable faltante", "variables faltantes")}`,
        );
        details.push(`Faltantes: ${missing.join(", ")}`);
      }
      if (unused.length > 0) {
        messages.push(`ⓘ ${formatCount(unused.length, "clave sin usar", "claves sin usar")}`);
        details.push(`Sin uso: ${unused.join(", ")}`);
      }

      espStatus.textContent = messages.join(" · ");
      espStatus.className =
        messages.length > 0
          ? `esp-validation-status visible ${missing.length > 0 ? "warning" : "info"}`
          : "esp-validation-status";
      if (typeof espStatus.setAttribute === "function") {
        const accessibleMessages = messages
          .map((message) => message.replace(/^(?:⚠️|ⓘ)\s*/, ""))
          .join(". ");

        espStatus.setAttribute("aria-hidden", messages.length > 0 ? "false" : "true");
        espStatus.setAttribute("data-details", details.join(" · "));
        espStatus.setAttribute(
          "aria-label",
          messages.length > 0 ? `${accessibleMessages}. ${details.join(". ")}` : "",
        );
      }
    },

    renderSuccess(html, iframeManager) {
      errorView.clear();
      if (iframeManager && typeof iframeManager.updateContent === "function") {
        iframeManager.updateContent(html);
      }
    },

    renderError(error) {
      errorView.show(error);
    },
  };
}
