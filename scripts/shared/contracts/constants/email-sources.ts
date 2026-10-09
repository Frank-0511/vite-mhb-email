/**
 * @fileoverview Fuentes de email (relativas a la raíz del proyecto) cuyo cambio
 * recarga el preview e invalida su caché. Módulo hoja: sin dependencias.
 */

export const EMAIL_SOURCE_PATHS = [
  "src/emails/templates",
  "src/emails/layouts",
  "src/emails/partials",
  "src/emails/styles",
  "maizzle.config.js",
  "maizzle.config.ts",
  "tailwind.email.config.ts",
] as const;
