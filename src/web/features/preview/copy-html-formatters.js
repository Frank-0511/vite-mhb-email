// @ts-check
/**
 * @fileoverview Funciones de formateo y utilidades de portapapeles para el modal de copiar HTML.
 */

/**
 * @typedef {Object} ValidationResult
 * @property {string[]} [missing]
 * @property {string[]} [unused]
 */

/**
 * Formatea el resultado ESP devuelto por el build selectivo.
 *
 * @param {ValidationResult | null | undefined} validation
 * @returns {string}
 */
export function formatValidation(validation) {
  if (!validation || typeof validation !== "object") return "";
  const messages = [];
  if (Array.isArray(validation.missing) && validation.missing.length > 0) {
    messages.push(`⚠️ Variables faltantes: ${validation.missing.join(", ")}`);
  }
  if (Array.isArray(validation.unused) && validation.unused.length > 0) {
    messages.push(`ℹ️ Claves sin uso: ${validation.unused.join(", ")}`);
  }
  return messages.length > 0 ? ` ${messages.join(" · ")}` : "";
}

/**
 * Devuelve el mensaje visual correspondiente al estado de carga.
 *
 * @param {boolean} build
 * @returns {string}
 */
export function formatLoadingMessage(build) {
  return build ? "Buildeando template…" : "Leyendo HTML…";
}

/**
 * Devuelve el mensaje de confirmación tras una copia exitosa.
 *
 * @param {boolean} build
 * @param {ValidationResult | null | undefined} [validation]
 * @returns {string}
 */
export function formatSuccessMessage(build, validation) {
  if (build) {
    const validationMessage = formatValidation(validation);
    return `✅ Build completado. HTML copiado al portapapeles.${validationMessage}`;
  }
  return "✅ HTML copiado al portapapeles.";
}

/**
 * Normaliza y formatea un error ocurrido durante la operación.
 *
 * @param {unknown} err
 * @returns {string}
 */
export function formatErrorMessage(err) {
  const message =
    err instanceof Error
      ? err.message
      : typeof err === "string" && err.trim().length > 0
        ? err
        : "Ocurrió un error.";
  return `❌ ${message}`;
}

/**
 * Intenta copiar texto al portapapeles de forma segura.
 * Devuelve true si tuvo éxito, false si el navegador rechazó el acceso o no está soportado.
 *
 * @param {string} text
 * @param {{ writeText: (val: string) => Promise<void> } | undefined} [clipboard]
 * @returns {Promise<boolean>}
 */
export async function copyTextToClipboard(
  text,
  clipboard = typeof navigator !== "undefined" ? navigator.clipboard : undefined,
) {
  if (!clipboard || typeof clipboard.writeText !== "function") {
    return false;
  }
  try {
    await clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
