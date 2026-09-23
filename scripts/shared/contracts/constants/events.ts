/**
 * @fileoverview Nombres de eventos personalizados compartidos entre preview y Vite HMR.
 * Módulo hoja aislado: sin dependencias ni imports ascendentes.
 */

export const EVENTS = {
  EMAIL_SOURCE_CHANGED: "email-source-changed",
  THEME_CHANGED: "theme-changed",
} as const;
