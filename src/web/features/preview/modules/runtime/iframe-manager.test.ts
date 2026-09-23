import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { STORAGE_KEY_TEMPLATE_THEME } from "../../../../shared/utils/storage-keys.ts";
import { createIframeManager } from "./iframe-manager.ts";
import { createMockElement, createMockIframe } from "./test-helpers.ts";

describe("iframe-manager", () => {
  let storageMap: Record<string, string>;
  let mockLocalStorage: Storage;

  beforeEach(() => {
    storageMap = {};
    mockLocalStorage = {
      getItem: (key: string) => storageMap[key] ?? null,
      setItem: (key: string, val: string) => {
        storageMap[key] = String(val);
      },
      removeItem: (key: string) => {
        delete storageMap[key];
      },
      clear: () => {
        storageMap = {};
      },
      length: 0,
      key: (_index: number) => null,
    };
    globalThis.localStorage = mockLocalStorage;
  });

  afterEach(() => {
    Reflect.deleteProperty(globalThis, "localStorage");
  });

  test("updateContent escribe HTML en el documento, oculta el skeleton y muestra el iframe", () => {
    const { iframe, written } = createMockIframe();
    const skeleton = createMockElement();
    const statusLogs: string[] = [];

    const manager = createIframeManager({
      iframe: iframe as unknown as HTMLIFrameElement,
      skeleton: skeleton as unknown as HTMLElement,
      onSyncStatusChange: (text: string) => statusLogs.push(text),
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
      iframe: iframe as unknown as HTMLIFrameElement,
      skeleton: skeleton as unknown as HTMLElement,
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
      iframe: iframe as unknown as HTMLIFrameElement,
      skeleton: skeleton as unknown as HTMLElement,
      onSyncStatusChange: () => {},
    });

    manager.hideSkeleton();

    expect(skeleton.classList.contains("hidden")).toBe(true);
    expect(iframe.classList.contains("hidden")).toBe(false);
  });

  test("toggleTheme alterna el valor de template-theme en localStorage", () => {
    const { iframe } = createMockIframe();
    const manager = createIframeManager({
      iframe: iframe as unknown as HTMLIFrameElement,
      onSyncStatusChange: () => {},
    });

    expect(localStorage.getItem(STORAGE_KEY_TEMPLATE_THEME)).toBeNull();

    // Primer toggle (default 'dark' pasa a 'light')
    manager.toggleTheme("welcome");
    expect(localStorage.getItem(STORAGE_KEY_TEMPLATE_THEME)).toBe("light");

    // Segundo toggle ('light' pasa a 'dark')
    manager.toggleTheme("welcome");
    expect(localStorage.getItem(STORAGE_KEY_TEMPLATE_THEME)).toBe("dark");
  });

  test("reset reinicia el template y actualiza el estado", () => {
    const { iframe } = createMockIframe();
    const statusLogs: string[] = [];

    const manager = createIframeManager({
      iframe: iframe as unknown as HTMLIFrameElement,
      onSyncStatusChange: (text: string) => statusLogs.push(text),
    });

    manager.reset("order-confirmation");

    expect(iframe.src).toBe("/templates/order-confirmation/index.html");
    expect(statusLogs).toContain("Sincronizado");
  });
});
