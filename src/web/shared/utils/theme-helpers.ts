/**
 * @file Helpers para gestión y persistencia de temas (template y aplicación)
 * Centraliza la resolución, lectura con fallback seguro y persistencia.
 */

import { THEME } from "../../../../scripts/shared/contracts/constants/theme.ts";
import { isTheme } from "../../../../scripts/shared/contracts/guards/theme.ts";
import type { Theme } from "../../../../scripts/shared/contracts/types/theme.ts";
import { STORAGE_KEY_APP_THEME, STORAGE_KEY_TEMPLATE_THEME } from "./storage-keys.ts";

/**
 * Obtiene el almacenamiento disponible (localStorage o null en entornos no DOM).
 *
 * @param {Storage | null} [customStorage]
 * @returns {Storage | null}
 */
function getStorage(customStorage?: Storage | null): Storage | null {
  if (customStorage !== undefined) return customStorage;
  return typeof localStorage !== "undefined" ? localStorage : null;
}

/**
 * Obtiene el tema activo de la plantilla de email ('light' o 'dark').
 * Por defecto es 'dark' si no está definido en almacenamiento.
 *
 * @param {Storage | null} [customStorage]
 * @returns {Theme}
 */
export function getTemplateTheme(customStorage?: Storage | null): Theme {
  const storage = getStorage(customStorage);
  if (!storage) return THEME.DARK;
  const stored = storage.getItem(STORAGE_KEY_TEMPLATE_THEME);
  return isTheme(stored) ? stored : THEME.DARK;
}

/**
 * Comprueba si el tema de la plantilla es oscuro ('dark').
 *
 * @param {Storage | null} [customStorage]
 * @returns {boolean}
 */
export function isTemplateThemeDark(customStorage?: Storage | null): boolean {
  return getTemplateTheme(customStorage) === THEME.DARK;
}

/**
 * Guarda el tema de la plantilla en el almacenamiento.
 *
 * @param {Theme} theme
 * @param {Storage | null} [customStorage]
 * @returns {void}
 */
export function setTemplateTheme(theme: Theme, customStorage?: Storage | null): void {
  const storage = getStorage(customStorage);
  if (!storage) return;
  storage.setItem(STORAGE_KEY_TEMPLATE_THEME, isTheme(theme) ? theme : THEME.DARK);
}

/**
 * Alterna el tema de la plantilla entre 'dark' y 'light', lo persiste y devuelve el nuevo valor.
 *
 * @param {Storage | null} [customStorage]
 * @returns {Theme}
 */
export function toggleTemplateTheme(customStorage?: Storage | null): Theme {
  const nextTheme: Theme = isTemplateThemeDark(customStorage) ? THEME.LIGHT : THEME.DARK;
  setTemplateTheme(nextTheme, customStorage);
  return nextTheme;
}

/**
 * Obtiene el tema activo de la aplicación ('light' o 'dark').
 *
 * @param {Storage | null} [customStorage]
 * @returns {Theme}
 */
export function getAppTheme(customStorage?: Storage | null): Theme {
  const storage = getStorage(customStorage);
  if (!storage) return THEME.DARK;
  const stored = storage.getItem(STORAGE_KEY_APP_THEME);
  return isTheme(stored) ? stored : THEME.DARK;
}

/**
 * Guarda el tema de la aplicación en el almacenamiento.
 *
 * @param {Theme} theme
 * @param {Storage | null} [customStorage]
 * @returns {void}
 */
export function setAppTheme(theme: Theme, customStorage?: Storage | null): void {
  const storage = getStorage(customStorage);
  if (!storage) return;
  storage.setItem(STORAGE_KEY_APP_THEME, isTheme(theme) ? theme : THEME.DARK);
}
