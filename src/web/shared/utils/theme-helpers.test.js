// @ts-check
import { describe, expect, test } from "bun:test";
import { STORAGE_KEY_APP_THEME, STORAGE_KEY_TEMPLATE_THEME } from "./storage-keys.js";
import {
  getAppTheme,
  getTemplateTheme,
  isTemplateThemeDark,
  setAppTheme,
  setTemplateTheme,
  toggleTemplateTheme,
} from "./theme-helpers.js";

/**
 * Crea un mock simple compatible con Storage.
 *
 * @param {Record<string, string>} [initial]
 * @returns {Storage}
 */
function createMockStorage(initial = {}) {
  const store = new Map(Object.entries(initial));
  return /** @type {Storage} */ ({
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, val) => store.set(key, String(val)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
    key: (index) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  });
}

describe("theme-helpers (gestión de temas web)", () => {
  test("getTemplateTheme devuelve 'dark' por defecto cuando no hay nada almacenado", () => {
    const storage = createMockStorage();
    expect(getTemplateTheme(storage)).toBe("dark");
    expect(isTemplateThemeDark(storage)).toBe(true);
  });

  test("getTemplateTheme respeta 'light' y 'dark' almacenados", () => {
    const storage = createMockStorage({ [STORAGE_KEY_TEMPLATE_THEME]: "light" });
    expect(getTemplateTheme(storage)).toBe("light");
    expect(isTemplateThemeDark(storage)).toBe(false);

    storage.setItem(STORAGE_KEY_TEMPLATE_THEME, "dark");
    expect(getTemplateTheme(storage)).toBe("dark");
    expect(isTemplateThemeDark(storage)).toBe(true);
  });

  test("getTemplateTheme con almacenamiento nulo devuelve 'dark'", () => {
    expect(getTemplateTheme(null)).toBe("dark");
    expect(isTemplateThemeDark(null)).toBe(true);
  });

  test("setTemplateTheme persiste el tema indicado", () => {
    const storage = createMockStorage();
    setTemplateTheme("light", storage);
    expect(storage.getItem(STORAGE_KEY_TEMPLATE_THEME)).toBe("light");

    setTemplateTheme("dark", storage);
    expect(storage.getItem(STORAGE_KEY_TEMPLATE_THEME)).toBe("dark");
  });

  test("toggleTemplateTheme alterna entre 'dark' y 'light' y persiste el cambio", () => {
    const storage = createMockStorage();

    // Estado inicial vacío (default dark) -> toggle pasa a light
    const firstToggle = toggleTemplateTheme(storage);
    expect(firstToggle).toBe("light");
    expect(storage.getItem(STORAGE_KEY_TEMPLATE_THEME)).toBe("light");

    // Segundo toggle -> pasa a dark
    const secondToggle = toggleTemplateTheme(storage);
    expect(secondToggle).toBe("dark");
    expect(storage.getItem(STORAGE_KEY_TEMPLATE_THEME)).toBe("dark");
  });

  test("getAppTheme y setAppTheme gestionan STORAGE_KEY_APP_THEME", () => {
    const storage = createMockStorage();
    expect(getAppTheme(storage)).toBe("dark");

    setAppTheme("light", storage);
    expect(storage.getItem(STORAGE_KEY_APP_THEME)).toBe("light");
    expect(getAppTheme(storage)).toBe("light");

    setAppTheme("dark", storage);
    expect(storage.getItem(STORAGE_KEY_APP_THEME)).toBe("dark");
    expect(getAppTheme(storage)).toBe("dark");
  });
});
