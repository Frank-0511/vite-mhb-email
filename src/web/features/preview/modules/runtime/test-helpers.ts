/**
 * @fileoverview Helpers y mocks DOM compartidos para pruebas en preview.
 */

import { mock } from "bun:test";

export interface MockElement {
  className: string;
  classList: {
    add(...classNames: string[]): void;
    remove(...classNames: string[]): void;
    contains(className: string): boolean;
    toggle(className: string, force?: boolean): void;
  };
  textContent: string;
  innerHTML: string;
  hidden: boolean;
  id: string;
  value: string;
  disabled?: boolean;
  style: Record<string, string>;
  setAttribute: (name: string, value: unknown) => void;
  getAttribute: (name: string) => string | null;
  hasAttribute: (name: string) => boolean;
  removeAttribute: (name: string) => void;
  addEventListener: (event: string, listener: () => void) => void;
  trigger: (event: string) => void;
  remove?: () => void;
  [key: string]: unknown;
}

export interface MockIframe {
  iframe: MockElement & {
    src: string;
    onload: ((event: Event) => void) | null;
    contentWindow: { document: MockDocument };
  };
  written: string[];
  mockDoc: MockDocument;
}

export interface MockDocument {
  open: () => void;
  write: (html: string) => void;
  close: () => void;
  documentElement: MockElement;
  body: MockElement;
  getElementById: (id: string) => MockElement | null;
  createElement: (tagName: string) => MockElement;
  head: { appendChild: (element: MockElement) => void };
}

/**
 * Crea un mock de elemento DOM para testing de clases y eventos.
 *
 * @param {string[]|string} [initialClasses]
 * @param {Record<string, unknown>} [attributes]
 */
export function createMockElement(
  initialClasses: string[] | string = [],
  attributes: Record<string, unknown> = {},
): MockElement {
  const classArray = Array.isArray(initialClasses)
    ? initialClasses
    : typeof initialClasses === "string" && initialClasses.trim()
      ? initialClasses.trim().split(/\s+/)
      : [];
  const classes = new Set(classArray);
  const attrs: Record<string, unknown> = { ...attributes };
  const listeners: Record<string, Array<() => void>> = {};

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
    innerHTML: "",
    hidden: attributes.hidden !== undefined ? Boolean(attributes.hidden) : false,
    id: typeof attributes.id === "string" ? attributes.id : "",
    value: typeof attributes.value === "string" ? attributes.value : "",
    focus: mock(() => {}),
    blur: mock(() => {}),
    setAttribute: mock((/** @type {string} */ name, /** @type {unknown} */ val) => {
      attrs[name] = String(val);
    }),
    getAttribute: mock((name: string): string | null => {
      const value = attrs[name];
      return value === undefined || value === null ? null : String(value);
    }),
    hasAttribute: mock((name: string): boolean => name in attrs),
    removeAttribute: mock((name: string): void => {
      delete attrs[name];
    }),
    addEventListener: mock((evt: string, fn: () => void) => {
      if (!listeners[evt]) listeners[evt] = [];
      listeners[evt].push(fn);
    }),
    trigger(evt: string): void {
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
export function createMockStorage(initialState: Record<string, string> = {}) {
  const store: Record<string, string> = { ...initialState };
  return {
    getItem: mock((key: string): string | null => store[key] ?? null),
    setItem: mock((key: string, val: string): void => {
      store[key] = String(val);
    }),
    removeItem: mock((key: string): void => {
      delete store[key];
    }),
    clear: mock((): void => {
      Object.keys(store).forEach((k) => delete store[k]);
    }),
  };
}

/**
 * Mock para un elemento iframe con contentWindow y document.
 */
export function createMockIframe(): MockIframe {
  const written: string[] = [];
  const docElement = createMockElement();
  const bodyElement = createMockElement();
  const iframeEl = createMockElement(["hidden"]);

  const mockDoc: MockDocument = {
    open: mock(() => {}),
    write: mock((html: string) => written.push(html)),
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
  const elements: Record<string, MockElement> = {
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
