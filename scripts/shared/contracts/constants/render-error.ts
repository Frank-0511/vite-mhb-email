/**
 * @fileoverview Constantes y códigos de error para el renderizado de templates.
 * Módulo hoja aislado: sin dependencias ni imports ascendentes.
 */

export const RENDER_ERROR_VERSION = 1;

export const RENDER_ERROR_CODE = {
  FAILED: "RENDER_FAILED",
} as const;

export const RENDER_ERROR_MESSAGE = "No se pudo renderizar el template.";

export const SAFE_RENDER_CAUSE = {
  SYNTAX: "El template contiene sintaxis inválida.",
  NOT_FOUND: "Fuente requerida no encontrada.",
  COMPILATION: "Fallo de compilación.",
} as const;

export const SAFE_RENDER_LOCATION_PATH = /^[a-z0-9][a-z0-9._-]*(?:\/[a-z0-9][a-z0-9._-]*)*$/;
