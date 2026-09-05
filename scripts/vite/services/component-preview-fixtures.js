// @ts-check
/**
 * @fileoverview Normalización de props y fixtures mock para el preview de componentes.
 *
 * Provee valores por defecto coherentes para componentes que esperan campos estándar
 * (como botones, teléfonos de contacto o filas de tablas) cuando no se suministran
 * en el estado del editor.
 */

/**
 * Normaliza el input `rows` (array, JSON string u otro) a un array usable.
 *
 * @param {unknown} rowsInput
 * @returns {Array<Record<string, unknown>>}
 */
export function normalizeRows(rowsInput) {
  const defaultRows = [
    { label: "Monto", value: "$10.000" },
    { label: "Fecha", value: "25/05/2026" },
  ];
  if (Array.isArray(rowsInput)) return rowsInput;
  if (typeof rowsInput === "string") {
    try {
      const parsed = JSON.parse(rowsInput);
      if (Array.isArray(parsed)) return /** @type {Array<Record<string, unknown>>} */ (parsed);
    } catch {
      // Ignorar JSON inválido; se usan los defaults.
    }
  }
  return defaultRows;
}

/**
 * Compone los datos finales para Handlebars, mezclando props del usuario con
 * defaults consistentes con los parciales existentes.
 *
 * @param {Record<string, unknown>} normalizedProps
 * @returns {Record<string, unknown>}
 */
export function buildHandlebarsData(normalizedProps) {
  return {
    ...normalizedProps,
    title: normalizedProps.title || "Bienvenido a Mi Empresa",
    subtitle: normalizedProps.subtitle || "Descubre todo lo que podemos hacer por ti",
    buttonText: normalizedProps.buttonText || normalizedProps["button-text"] || "Explorar ahora",
    buttonUrl: normalizedProps.buttonUrl || normalizedProps["button-url"] || "https://ejemplo.com",
    showButton: normalizedProps.showButton !== false && normalizedProps["show-button"] !== "false",

    callCenterNumber:
      normalizedProps.callCenterNumber ||
      normalizedProps["call-center-number"] ||
      "+56 2 1234 5678",
    noReplayEmail:
      normalizedProps.noReplayEmail ||
      normalizedProps.noReplyEmail ||
      normalizedProps["no-reply-email"] ||
      "no-reply@ejemplo.com",

    rows: normalizeRows(normalizedProps.rows),
  };
}
