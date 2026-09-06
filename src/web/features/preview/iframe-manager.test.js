// @ts-check
import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { createIframeManager } from "./iframe-manager.js";

/**
 * Mock DOM para simular un elemento con classList.
 * @param {string[]} [initialClasses]
 */
function createMockElement(initialClasses = []) {
  const classes = new Set(initialClasses);
  return {
    classList: {
      add: mock((/** @type {string} */ cls) => classes.add(cls)),
      remove: mock((/** @type {string} */ cls) => classes.delete(cls)),
      contains: (/** @type {string} */ cls) => classes.has(cls),
      toggle: mock((/** @type {string} */ cls, /** @type {boolean} */ force) => {
        if (force !== undefined) {
          if (force) classes.add(cls);
          else classes.delete(cls);
        } else if (classes.has(cls)) {
          classes.delete(cls);
        } else {
          classes.add(cls);
        }
      }),
    },
    style: {},
  };
}

/**
 * Mock para un elemento iframe con contentWindow y document.
 */
function createMockIframe() {
  /** @type {string[]} */
  const written = [];
  const docElement = createMockElement();
  const bodyElement = createMockElement();
  const iframeEl = createMockElement(["hidden"]);

  const mockDoc = {
    open: mock(() => {}),
    write: mock((/** @type {string} */ html) => written.push(html)),
    close: mock(() => {}),
    documentElement: docElement,
    body: bodyElement,
    getElementById: mock(() => null),
    createElement: mock(() => createMockElement()),
    head: {
      appendChild: mock(() => {}),
    },
  };

  return {
    iframe: {
      ...iframeEl,
      src: "",
      onload: null,
      contentWindow: {
        document: mockDoc,
      },
    },
    written,
    mockDoc,
  };
}

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
