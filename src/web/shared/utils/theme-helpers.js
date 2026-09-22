// @ts-check
/**
 * @file Helpers para gestión y persistencia de temas (template y aplicación)
 * Centraliza la resolución, lectura con fallback seguro y persistencia.
 */

import { STORAGE_KEY_APP_THEME, STORAGE_KEY_TEMPLATE_THEME } from "./storage-keys.js";

/**
 * Obtiene el almacenamiento disponible (localStorage o null en entornos no DOM).
 *
 * @param {Storage | null} [customStorage]
 * @returns {Storage | null}
 */
function getStorage(customStorage) {
  if (customStorage !== undefined) return customStorage;
  return typeof localStorage !== "undefined" ? localStorage : null;
}

/**
 * Obtiene el tema activo de la plantilla de email ('light' o 'dark').
 * Por defecto es 'dark' si no está definido en almacenamiento.
 *
 * @param {Storage | null} [customStorage]
 * @returns {"dark" | "light"}
 */
export function getTemplateTheme(customStorage) {
  const storage = getStorage(customStorage);
  if (!storage) return "dark";
  const stored = storage.getItem(STORAGE_KEY_TEMPLATE_THEME);
  return stored === "light" ? "light" : "dark";
}

/**
 * Comprueba si el tema de la plantilla es oscuro ('dark').
 *
 * @param {Storage | null} [customStorage]
 * @returns {boolean}
 */
export function isTemplateThemeDark(customStorage) {
  return getTemplateTheme(customStorage) === "dark";
}

/**
 * Guarda el tema de la plantilla en el almacenamiento.
 *
 * @param {"dark" | "light"} theme
 * @param {Storage | null} [customStorage]
 * @returns {void}
 */
export function setTemplateTheme(theme, customStorage) {
  const storage = getStorage(customStorage);
  if (!storage) return;
  storage.setItem(STORAGE_KEY_TEMPLATE_THEME, theme === "light" ? "light" : "dark");
}

/**
 * Alterna el tema de la plantilla entre 'dark' y 'light', lo persiste y devuelve el nuevo valor.
 *
 * @param {Storage | null} [customStorage]
 * @returns {"dark" | "light"}
 */
export function toggleTemplateTheme(customStorage) {
  const nextTheme = isTemplateThemeDark(customStorage) ? "light" : "dark";
  setTemplateTheme(nextTheme, customStorage);
  return nextTheme;
}

/**
 * Obtiene el tema activo de la aplicación ('light' o 'dark').
 *
 * @param {Storage | null} [customStorage]
 * @returns {"dark" | "light"}
 */
export function getAppTheme(customStorage) {
  const storage = getStorage(customStorage);
  if (!storage) return "dark";
  const stored = storage.getItem(STORAGE_KEY_APP_THEME);
  return stored === "light" ? "light" : "dark";
}

/**
 * Guarda el tema de la aplicación en el almacenamiento.
 *
 * @param {"dark" | "light"} theme
 * @param {Storage | null} [customStorage]
 * @returns {void}
 */
export function setAppTheme(theme, customStorage) {
  const storage = getStorage(customStorage);
  if (!storage) return;
  storage.setItem(STORAGE_KEY_APP_THEME, theme === "light" ? "light" : "dark");
}
