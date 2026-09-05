// @ts-check
/**
 * @fileoverview Vista accesible para diagnóstico de errores de render.
 * Presenta el diagnóstico de forma segura mediante textContent puro sin interpolar HTML.
 */

/**
 * @typedef {Object} RenderErrorDisplayData
 * @property {string} [message] - Mensaje descriptivo.
 * @property {string} [cause] - Causa clasificada del error.
 * @property {{ path: string, line?: number, column?: number }} [location] - Ubicación en template.
 */

/**
 * @typedef {Object} RenderErrorView
 * @property {(error?: RenderErrorDisplayData | null) => void} show - Muestra el error formateado.
 * @property {() => void} clear - Oculta y limpia el panel de error.
 */

/**
 * Formatea la ubicación relativa con línea y columna si están presentes.
 *
 * @param {{ path: string, line?: number, column?: number }} location
 * @returns {string}
 */
function formatLocation(location) {
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
 * @param {{ textContent: string, hidden: boolean } | null | undefined} element
 * @returns {RenderErrorView}
 */
export function createRenderErrorView(element) {
  return {
    show(error) {
      if (!element) return;

      const lines = [];
      const message = error?.message || "No se pudo renderizar el template.";
      lines.push(message);

      if (error?.cause) {
        lines.push(error.cause);
      }

      if (error?.location?.path) {
        lines.push(formatLocation(error.location));
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
