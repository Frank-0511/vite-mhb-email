// @ts-check
import { beforeEach, describe, expect, mock, test } from "bun:test";

import { createMockElement, createMockStorage } from "../runtime/test-helpers.js";
import {
  initViewModeControls,
  setupViewModeControls,
  VIEW_MODE_KEY,
  VIEW_MODE_RENDER,
  VIEW_MODE_SOURCE,
} from "./view-mode-controls.js";

describe("view-mode-controls (MHB-17)", () => {
  /** @type {ReturnType<typeof createMockStorage>} */
  let mockStorage;
  /** @type {ReturnType<typeof createMockElement>} */
  let renderBtn;
  /** @type {ReturnType<typeof createMockElement>} */
  let sourceBtn;
  /** @type {ReturnType<typeof createMockElement>} */
  let iframe;
  /** @type {ReturnType<typeof createMockElement>} */
  let sourceContainer;
  /** @type {ReturnType<typeof createMockElement>} */
  let sourceCode;
  /** @type {ReturnType<typeof createMockElement>} */
  let skeleton;

  beforeEach(() => {
    mockStorage = createMockStorage();
    renderBtn = createMockElement(["px-2"], { "aria-pressed": "false" });
    sourceBtn = createMockElement(["px-2"], { "aria-pressed": "false" });
    iframe = createMockElement([]);
    sourceContainer = createMockElement(["hidden"]);
    sourceCode = createMockElement();
    skeleton = createMockElement(["hidden"]);
  });

  function createDefaultElements(overrides = {}) {
    return {
      renderBtn: /** @type {any} */ (renderBtn),
      sourceBtn: /** @type {any} */ (sourceBtn),
      iframe: /** @type {any} */ (iframe),
      sourceContainer: /** @type {any} */ (sourceContainer),
      sourceCode: /** @type {any} */ (sourceCode),
      skeleton: /** @type {any} */ (skeleton),
      ...overrides,
    };
  }

  /**
   * @param {Record<string, any>} [overrides]
   * @param {import("./view-mode-controls.js").ViewModeStorage | any} [storage]
   */
  function initDefault(overrides = {}, storage = mockStorage) {
    return initViewModeControls(createDefaultElements(overrides), storage);
  }

  test("inicia por defecto en modo render cuando el almacenamiento de sesión está vacío", () => {
    const controller = initDefault();

    expect(controller.getViewMode()).toBe(VIEW_MODE_RENDER);
    expect(renderBtn.getAttribute("aria-pressed")).toBe("true");
    expect(sourceBtn.getAttribute("aria-pressed")).toBe("false");
    expect(renderBtn.classList.contains("bg-sky-500")).toBe(true);
    expect(sourceBtn.classList.contains("bg-sky-500")).toBe(false);
    expect(iframe.classList.contains("hidden")).toBe(false);
    expect(sourceContainer.classList.contains("hidden")).toBe(true);
  });

  test("restaura modo source si fue previamente guardado en la sesión activa", () => {
    mockStorage.setItem(VIEW_MODE_KEY, VIEW_MODE_SOURCE);

    const controller = initDefault();

    expect(controller.getViewMode()).toBe(VIEW_MODE_SOURCE);
    expect(renderBtn.getAttribute("aria-pressed")).toBe("false");
    expect(sourceBtn.getAttribute("aria-pressed")).toBe("true");
    expect(sourceBtn.classList.contains("bg-sky-500")).toBe(true);
    expect(renderBtn.classList.contains("bg-sky-500")).toBe(false);
    expect(iframe.classList.contains("hidden")).toBe(true);
    expect(sourceContainer.classList.contains("hidden")).toBe(false);
  });

  test("alterna al hacer clic en los botones y persiste en sessionStorage", () => {
    const controller = initDefault();

    // Clic en botón Código Fuente
    sourceBtn.trigger("click");

    expect(controller.getViewMode()).toBe(VIEW_MODE_SOURCE);
    expect(mockStorage.setItem).toHaveBeenCalledWith(VIEW_MODE_KEY, VIEW_MODE_SOURCE);
    expect(iframe.classList.contains("hidden")).toBe(true);
    expect(sourceContainer.classList.contains("hidden")).toBe(false);
    expect(sourceBtn.getAttribute("aria-pressed")).toBe("true");
    expect(renderBtn.getAttribute("aria-pressed")).toBe("false");

    // Clic de vuelta en botón Render
    renderBtn.trigger("click");

    expect(controller.getViewMode()).toBe(VIEW_MODE_RENDER);
    expect(mockStorage.setItem).toHaveBeenCalledWith(VIEW_MODE_KEY, VIEW_MODE_RENDER);
    expect(iframe.classList.contains("hidden")).toBe(false);
    expect(sourceContainer.classList.contains("hidden")).toBe(true);
    expect(renderBtn.getAttribute("aria-pressed")).toBe("true");
    expect(sourceBtn.getAttribute("aria-pressed")).toBe("false");
  });

  test("updateSourceHtml sanitiza y escapa código HTML sin evaluarlo ni ejecutar scripts", () => {
    const controller = initDefault();

    const maliciousHtml =
      '<!doctype html><html><body onload="alert(1)"><script>alert("xss")</script><a href="javascript:void(0)">Link</a></body></html>';

    controller.updateSourceHtml(maliciousHtml);

    expect(controller.getSourceHtml()).toBe(maliciousHtml);
    // El elemento <code> recibe el texto directamente mediante textContent
    expect(sourceCode.textContent).toBe(maliciousHtml);
  });

  test("no recompila ni invoca peticiones al alternar entre vistas", () => {
    const originalFetch = globalThis.fetch;
    const mockFetch = mock(() => Promise.resolve(new Response("")));
    globalThis.fetch = mockFetch;

    try {
      const controller = initDefault();

      controller.updateSourceHtml("<div>Compiled Template</div>");

      // Alternar varias veces
      controller.applyViewMode(VIEW_MODE_SOURCE);
      controller.applyViewMode(VIEW_MODE_RENDER);
      controller.applyViewMode(VIEW_MODE_SOURCE);

      // Ninguna petición de red/recompilación debe haberse disparado
      expect(mockFetch).not.toHaveBeenCalled();
      // El HTML en memoria se mantiene intacto
      expect(controller.getSourceHtml()).toBe("<div>Compiled Template</div>");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  test("no revela iframe ni código si el skeleton inicial está todavía activo", () => {
    // Skeleton activo (no tiene 'hidden')
    skeleton = createMockElement([]);

    const controller = initDefault();

    controller.applyViewMode(VIEW_MODE_SOURCE);

    // Ni iframe ni sourceContainer deben quitar 'hidden' mientras el skeleton esté visible
    expect(sourceContainer.classList.contains("hidden")).toBe(true);
  });

  test("se degrada con seguridad ante excepciones de storage", () => {
    const errorStorage = {
      getItem: () => {
        throw new Error("SecurityError: Access is denied for this document");
      },
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
      removeItem: () => {},
      clear: () => {},
    };

    expect(() => {
      const controller = initDefault({}, errorStorage);

      // No debe lanzar excepción al cambiar de modo
      controller.applyViewMode(VIEW_MODE_SOURCE);
      expect(controller.getViewMode()).toBe(VIEW_MODE_SOURCE);
    }).not.toThrow();
  });

  test("aplica clase is-source-mode a previewFrame y data-view-mode en shell al alternar a source", () => {
    const previewFrame = createMockElement([]);
    const shell = createMockElement([]);

    const controller = initDefault({
      previewFrame: /** @type {any} */ (previewFrame),
      shell: /** @type {any} */ (shell),
    });

    expect(previewFrame.classList.contains("is-source-mode")).toBe(false);
    expect(shell.getAttribute("data-view-mode")).toBe("render");

    controller.applyViewMode(VIEW_MODE_SOURCE);

    expect(previewFrame.classList.contains("is-source-mode")).toBe(true);
    expect(shell.getAttribute("data-view-mode")).toBe("source");

    controller.applyViewMode(VIEW_MODE_RENDER);

    expect(previewFrame.classList.contains("is-source-mode")).toBe(false);
    expect(shell.getAttribute("data-view-mode")).toBe("render");
  });

  describe("setupViewModeControls", () => {
    test("retorna null si dom es null o no contiene getElementById", () => {
      expect(setupViewModeControls(null)).toBeNull();
      // @ts-expect-error test defensivo
      expect(setupViewModeControls({})).toBeNull();
    });

    test("retorna null si falta algún elemento requerido", () => {
      const incompleteDom = {
        getElementById: (/** @type {string} */ id) =>
          id === "view-mode-render" ? renderBtn : null,
      };
      expect(setupViewModeControls(incompleteDom)).toBeNull();
    });

    test("inicializa y retorna el controlador si todos los elementos existen", () => {
      /** @type {Record<string, any>} */
      const domMap = {
        "view-mode-render": renderBtn,
        "view-mode-source": sourceBtn,
        "preview-iframe": iframe,
        "preview-source-container": sourceContainer,
        "preview-source-code": sourceCode,
        "preview-skeleton": skeleton,
      };

      const mockDom = {
        getElementById: (/** @type {string} */ id) => domMap[id] ?? null,
      };

      const controller = setupViewModeControls(mockDom, mockStorage);
      expect(controller).not.toBeNull();
      expect(typeof controller?.applyViewMode).toBe("function");
      expect(typeof controller?.updateSourceHtml).toBe("function");
    });
  });
});
