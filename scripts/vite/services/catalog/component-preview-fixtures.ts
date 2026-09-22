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
 * @param rowsInput Valor suministrado para las filas.
 * @returns Array de filas normalizado.
 */
export function normalizeRows(rowsInput: unknown): Array<Record<string, unknown>> {
  const defaultRows = [
    { label: "Monto", value: "$10.000" },
    { label: "Fecha", value: "25/05/2026" },
  ];
  if (Array.isArray(rowsInput)) return rowsInput as Array<Record<string, unknown>>;
  if (typeof rowsInput === "string") {
    try {
      const parsed = JSON.parse(rowsInput);
      if (Array.isArray(parsed)) return parsed as Array<Record<string, unknown>>;
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
 * @param normalizedProps Props enviadas por el editor o cliente.
 * @returns Objeto de datos con valores por defecto aplicados.
 */
export function buildHandlebarsData(
  normalizedProps: Record<string, unknown>,
): Record<string, unknown> {
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
