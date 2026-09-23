/**
 * @fileoverview Controlador del estado visual del preview (sincronización, variables ESP y errores).
 */

import { queryRequired, querySafe } from "../../../../shared/utils/dom-helpers.ts";
import { createRenderErrorView } from "../render/render-error-view.ts";

type ESPValidationData = {
  missing?: string[];
  unused?: string[];
};

type StatusElement = {
  className: string;
  classList?: { contains: (className: string) => boolean };
  textContent: string | null;
  innerHTML: string;
  append?: (...nodes: unknown[]) => void;
  setAttribute?: (name: string, value: string) => void;
};

type PreviewStatusElements = {
  syncStatus?: StatusElement;
  espStatus?: StatusElement | null;
  renderErrorView?: { show: (error?: unknown) => void; clear: () => void };
};

type PreviewStatusController = {
  sync: (text: string, textColor: string, dotColor: string) => void;
  esp: (result?: ESPValidationData | null) => void;
  renderSuccess: (
    html: string,
    iframeManager?: { updateContent: (content: string) => void },
  ) => void;
  renderError: (error: unknown) => void;
};

/**
 * Actualiza de forma segura el contenido del indicador de estado sin interpolar HTML externo.
 *
 * @param {any} element
 * @param {string} text
 * @param {string} textColor
 * @param {string} dotColor
 */
function updateSyncStatusElement(
  element: StatusElement | HTMLElement | null | undefined,
  text: string,
  textColor: string,
  dotColor: string,
): void {
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
function formatCount(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

/**
 * Crea el controlador de estado visual para sincronización, variables ESP y errores de render.
 *
 * @param {PreviewStatusElements} [elements]
 * @returns {PreviewStatusController}
 */
export function createPreviewStatus(elements?: PreviewStatusElements): PreviewStatusController {
  const syncStatus = elements?.syncStatus ?? queryRequired("sync-status", "Preview Module");
  const espStatus =
    elements?.espStatus !== undefined ? elements.espStatus : querySafe("esp-validation-status");
  const errorView =
    elements?.renderErrorView ?? createRenderErrorView(querySafe("preview-render-error"));

  return {
    sync(text: string, textColor: string, dotColor: string): void {
      updateSyncStatusElement(syncStatus, text, textColor, dotColor);
    },

    esp(result?: ESPValidationData | null): void {
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

    renderSuccess(
      html: string,
      iframeManager?: { updateContent: (content: string) => void },
    ): void {
      errorView.clear();
      if (iframeManager && typeof iframeManager.updateContent === "function") {
        iframeManager.updateContent(html);
      }
    },

    renderError(error: unknown): void {
      errorView.show(error);
    },
  };
}
