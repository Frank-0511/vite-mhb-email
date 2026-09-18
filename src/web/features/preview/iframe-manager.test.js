// @ts-check
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { createIframeManager } from "./iframe-manager.js";
import { createMockElement, createMockIframe } from "./test-helpers.js";

describe("iframe-manager", () => {
  /** @type {Record<string, string>} */
  let storageMap;
  /** @type {Storage} */
  let mockLocalStorage;

  beforeEach(() => {
    storageMap = {};
    mockLocalStorage = /** @type {Storage} */ ({
      getItem: (key) => storageMap[key] ?? null,
      setItem: (key, val) => {
        storageMap[key] = String(val);
      },
      removeItem: (key) => {
        delete storageMap[key];
      },
      clear: () => {
        storageMap = {};
      },
      length: 0,
      key: () => null,
    });
    // @ts-ignore
    globalThis.localStorage = mockLocalStorage;
  });

  afterEach(() => {
    // @ts-ignore
    delete globalThis.localStorage;
  });

  test("updateContent escribe HTML en el documento, oculta el skeleton y muestra el iframe", () => {
    const { iframe, written } = createMockIframe();
    const skeleton = createMockElement();
    /** @type {string[]} */
    const statusLogs = [];

    const manager = createIframeManager({
      iframe: /** @type {any} */ (iframe),
      skeleton: /** @type {any} */ (skeleton),
      onSyncStatusChange: (text) => statusLogs.push(text),
    });

    manager.updateContent("<h1>Email Render</h1>");

    expect(written).toEqual(["<h1>Email Render</h1>"]);
    expect(skeleton.classList.contains("hidden")).toBe(true);
    expect(iframe.classList.contains("hidden")).toBe(false);
    expect(statusLogs).toContain("Sincronizado");
  });

  test("loadTemplate asigna la ruta de template, oculta el skeleton y ejecuta onload", () => {
    const { iframe } = createMockIframe();
    const skeleton = createMockElement();

    const manager = createIframeManager({
      iframe: /** @type {any} */ (iframe),
      skeleton: /** @type {any} */ (skeleton),
      onSyncStatusChange: () => {},
    });

    manager.loadTemplate("welcome");

    expect(iframe.src).toBe("/templates/welcome/index.html");
    expect(skeleton.classList.contains("hidden")).toBe(true);
    expect(iframe.classList.contains("hidden")).toBe(false);

    // Simular evento onload del iframe
    if (typeof iframe.onload === "function") {
      iframe.onload(new Event("load"));
    }

    expect(iframe.contentWindow.document.body.style.padding).toBe("32px 0");
  });

  test("hideSkeleton puede invocarse independientemente", () => {
    const { iframe } = createMockIframe();
    const skeleton = createMockElement();

    const manager = createIframeManager({
      iframe: /** @type {any} */ (iframe),
      skeleton: /** @type {any} */ (skeleton),
      onSyncStatusChange: () => {},
    });

    manager.hideSkeleton();

    expect(skeleton.classList.contains("hidden")).toBe(true);
    expect(iframe.classList.contains("hidden")).toBe(false);
  });

  test("toggleTheme alterna el valor de template-theme en localStorage", () => {
    const { iframe } = createMockIframe();
    const manager = createIframeManager({
      iframe: /** @type {any} */ (iframe),
      onSyncStatusChange: () => {},
    });

    expect(localStorage.getItem("template-theme")).toBeNull();

    // Primer toggle (default 'dark' pasa a 'light')
    manager.toggleTheme("welcome");
    expect(localStorage.getItem("template-theme")).toBe("light");

    // Segundo toggle ('light' pasa a 'dark')
    manager.toggleTheme("welcome");
    expect(localStorage.getItem("template-theme")).toBe("dark");
  });

  test("reset reinicia el template y actualiza el estado", () => {
    const { iframe } = createMockIframe();
    /** @type {string[]} */
    const statusLogs = [];

    const manager = createIframeManager({
      iframe: /** @type {any} */ (iframe),
      onSyncStatusChange: (text) => statusLogs.push(text),
    });

    manager.reset("order-confirmation");

    expect(iframe.src).toBe("/templates/order-confirmation/index.html");
    expect(statusLogs).toContain("Sincronizado");
  });
});
