// @ts-check
/**
 * @fileoverview Helpers y mocks DOM compartidos para pruebas en preview.
 */

import { mock } from "bun:test";

/**
 * Crea un mock de elemento DOM para testing de clases y eventos.
 *
 * @param {string[]|string} [initialClasses]
 * @param {Record<string, unknown>} [attributes]
 */
export function createMockElement(initialClasses = [], attributes = {}) {
  const classArray = Array.isArray(initialClasses)
    ? initialClasses
    : typeof initialClasses === "string" && initialClasses.trim()
      ? initialClasses.trim().split(/\s+/)
      : [];
  const classes = new Set(classArray);
  const attrs = { ...attributes };
  /** @type {Record<string, Function[]>} */
  const listeners = {};

  return {
    get className() {
      return Array.from(classes).join(" ");
    },
    set className(val) {
      classes.clear();
      if (typeof val === "string" && val.trim()) {
        val
          .trim()
          .split(/\s+/)
          .forEach((c) => classes.add(c));
      }
    },
    classList: {
      add: mock((/** @type {string[]} */ ...clsList) => {
        clsList.forEach((cls) => classes.add(cls));
      }),
      remove: mock((/** @type {string[]} */ ...clsList) => {
        clsList.forEach((cls) => classes.delete(cls));
      }),
      contains: mock((/** @type {string} */ cls) => classes.has(cls)),
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
    textContent: "",
    innerHTML: undefined,
    hidden: attributes.hidden !== undefined ? Boolean(attributes.hidden) : false,
    id: typeof attributes.id === "string" ? attributes.id : "",
    value: typeof attributes.value === "string" ? attributes.value : "",
    focus: mock(() => {}),
    blur: mock(() => {}),
    setAttribute: mock((/** @type {string} */ name, /** @type {unknown} */ val) => {
      attrs[name] = String(val);
    }),
    getAttribute: mock((/** @type {string} */ name) => attrs[name] ?? null),
    hasAttribute: mock((/** @type {string} */ name) => name in attrs),
    removeAttribute: mock((/** @type {string} */ name) => {
      delete attrs[name];
    }),
    addEventListener: mock((/** @type {string} */ evt, /** @type {Function} */ fn) => {
      if (!listeners[evt]) listeners[evt] = [];
      listeners[evt].push(fn);
    }),
    trigger(evt) {
      listeners[evt]?.forEach((fn) => fn());
    },
    style: {},
  };
}

/**
 * Crea un almacenamiento simulado (SessionStorage mock).
 *
 * @param {Record<string, string>} [initialState]
 */
export function createMockStorage(initialState = {}) {
  const store = { ...initialState };
  return {
    getItem: mock((/** @type {string} */ key) => store[key] ?? null),
    setItem: mock((/** @type {string} */ key, /** @type {string} */ val) => {
      store[key] = String(val);
    }),
    removeItem: mock((/** @type {string} */ key) => {
      delete store[key];
    }),
    clear: mock(() => {
      Object.keys(store).forEach((k) => delete store[k]);
    }),
  };
}

/**
 * Mock para un elemento iframe con contentWindow y document.
 */
export function createMockIframe() {
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

/**
 * Crea conjunto de elementos simulados para viewport controls.
 *
 * @param {boolean} [includeIndicator=true]
 */
export function createViewportMockElements(includeIndicator = true) {
  /** @type {Record<string, any>} */
  const elements = {
    "viewport-desktop": createMockElement(),
    "viewport-mobile": createMockElement(),
    "viewport-custom": createMockElement(),
    "viewport-custom-input-wrap": createMockElement(),
    "viewport-custom-input": createMockElement([], { value: "600" }),
    "preview-frame": createMockElement(),
  };
  if (includeIndicator) {
    elements["viewport-width-indicator"] = createMockElement();
  }
  return elements;
}
