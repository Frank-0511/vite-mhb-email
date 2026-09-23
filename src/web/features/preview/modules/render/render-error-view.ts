/**
 * @fileoverview Vista accesible para diagnóstico de errores de render.
 * Presenta el diagnóstico de forma segura mediante textContent puro sin interpolar HTML.
 */

import { RENDER_ERROR_MESSAGE } from "../../../../../../scripts/shared/contracts/constants/render-error.ts";

type RenderErrorDisplayData = {
  message?: string;
  cause?: string;
  location?: { path: string; line?: number; column?: number };
};

export type RenderErrorView = {
  show: (error?: unknown) => void;
  clear: () => void;
};

/**
 * Formatea la ubicación relativa con línea y columna si están presentes.
 *
 * @param {{ path: string, line?: number, column?: number }} location
 * @returns {string}
 */
function formatLocation(location: { path: string; line?: number; column?: number }): string {
  let result = location.path;
  if (typeof location.line === "number") {
    result += `:${location.line}`;
    if (typeof location.column === "number") {
      result += `:${location.column}`;
    }
  }
  return result;
}

/**
 * Crea una vista accesible para el contenedor de errores de render.
 *
 * @param {HTMLElement | { textContent: string, hidden: boolean } | null | undefined} element
 * @returns {RenderErrorView}
 */
export function createRenderErrorView(
  element: HTMLElement | { textContent: string; hidden: boolean } | null | undefined,
): RenderErrorView {
  return {
    show(error?: unknown) {
      if (!element) return;

      const lines = [];
      const displayError = error as RenderErrorDisplayData | null | undefined;
      const message = displayError?.message || RENDER_ERROR_MESSAGE;
      lines.push(message);

      if (displayError?.cause) {
        lines.push(displayError.cause);
      }

      if (displayError?.location?.path) {
        lines.push(formatLocation(displayError.location));
      }

      element.textContent = lines.join("\n");
      element.hidden = false;
    },

    clear() {
      if (!element) return;
      element.textContent = "";
      element.hidden = true;
    },
  };
}
