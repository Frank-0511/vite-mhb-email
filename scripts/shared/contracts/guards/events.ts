/**
 * @fileoverview Type guards para eventos de preview y HMR.
 * Módulo hoja aislado: sin dependencias ni imports ascendentes.
 */

import type { ThemeChangedEventDetail } from "../types/events.ts";

export function isThemeChangedEventDetail(value: unknown): value is ThemeChangedEventDetail {
  return (
    typeof value === "object" &&
    value !== null &&
    "isDark" in value &&
    typeof (value as { isDark: unknown }).isDark === "boolean"
  );
}
