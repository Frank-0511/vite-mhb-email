import { beforeEach, describe, expect, mock, test } from "bun:test";

import { createMockElement, createMockStorage } from "../runtime/test-helpers.ts";
import { STORAGE_KEY_VIEW_MODE } from "../../../../shared/utils/storage-keys.ts";
import { VIEW_MODE } from "../../constants.ts";
import {
  initViewModeControls,
  setupViewModeControls,
  type ViewModeElements,
  type ViewModeStorage,
} from "./view-mode-controls.ts";

describe("view-mode-controls (MHB-17)", () => {
  let mockStorage: ViewModeStorage & ReturnType<typeof createMockStorage>;
  let renderBtn: ReturnType<typeof createMockElement>;
  let sourceBtn: ReturnType<typeof createMockElement>;
  let iframe: ReturnType<typeof createMockElement>;
  let sourceContainer: ReturnType<typeof createMockElement>;
  let sourceCode: ReturnType<typeof createMockElement>;
  let skeleton: ReturnType<typeof createMockElement>;

  beforeEach(() => {
    mockStorage = createMockStorage();
    renderBtn = createMockElement(["px-2"], { "aria-pressed": "false" });
    sourceBtn = createMockElement(["px-2"], { "aria-pressed": "false" });
    iframe = createMockElement([]);
    sourceContainer = createMockElement(["hidden"]);
    sourceCode = createMockElement();
    skeleton = createMockElement(["hidden"]);
  });

  function createDefaultElements(overrides: Record<string, unknown> = {}): ViewModeElements {
    return {
      renderBtn: renderBtn as unknown as HTMLButtonElement,
      sourceBtn: sourceBtn as unknown as HTMLButtonElement,
      iframe: iframe as unknown as HTMLElement,
      sourceContainer: sourceContainer as unknown as HTMLElement,
      sourceCode: sourceCode as unknown as HTMLElement,
      skeleton: skeleton as unknown as HTMLElement,
      ...overrides,
    } as ViewModeElements;
  }

  /**
   * @param {Record<string, any>} [overrides]
   * @param {import("./view-mode-controls.ts").ViewModeStorage | any} [storage]
   */
  function initDefault(
    overrides: Record<string, unknown> = {},
    storage: ViewModeStorage = mockStorage,
  ) {
    return initViewModeControls(createDefaultElements(overrides), storage);
  }

  test("inicia por defecto en modo render cuando el almacenamiento de sesión está vacío", () => {
    const controller = initDefault();

    expect(controller.getViewMode()).toBe(VIEW_MODE.RENDER);
    expect(renderBtn.getAttribute("aria-pressed")).toBe("true");
    expect(sourceBtn.getAttribute("aria-pressed")).toBe("false");
    expect(renderBtn.classList.contains("bg-sky-500")).toBe(true);
    expect(sourceBtn.classList.contains("bg-sky-500")).toBe(false);
    expect(iframe.classList.contains("hidden")).toBe(false);
    expect(sourceContainer.classList.contains("hidden")).toBe(true);
  });

  test("restaura modo source si fue previamente guardado en la sesión activa", () => {
    mockStorage.setItem(STORAGE_KEY_VIEW_MODE, VIEW_MODE.SOURCE);

    const controller = initDefault();

    expect(controller.getViewMode()).toBe(VIEW_MODE.SOURCE);
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

    expect(controller.getViewMode()).toBe(VIEW_MODE.SOURCE);
    expect(mockStorage.setItem).toHaveBeenCalledWith(STORAGE_KEY_VIEW_MODE, VIEW_MODE.SOURCE);
    expect(iframe.classList.contains("hidden")).toBe(true);
    expect(sourceContainer.classList.contains("hidden")).toBe(false);
    expect(sourceBtn.getAttribute("aria-pressed")).toBe("true");
    expect(renderBtn.getAttribute("aria-pressed")).toBe("false");

    // Clic de vuelta en botón Render
    renderBtn.trigger("click");

    expect(controller.getViewMode()).toBe(VIEW_MODE.RENDER);
    expect(mockStorage.setItem).toHaveBeenCalledWith(STORAGE_KEY_VIEW_MODE, VIEW_MODE.RENDER);
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
      controller.applyViewMode(VIEW_MODE.SOURCE);
      controller.applyViewMode(VIEW_MODE.RENDER);
      controller.applyViewMode(VIEW_MODE.SOURCE);

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

    controller.applyViewMode(VIEW_MODE.SOURCE);

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
      controller.applyViewMode(VIEW_MODE.SOURCE);
      expect(controller.getViewMode()).toBe(VIEW_MODE.SOURCE);
    }).not.toThrow();
  });

  test("aplica clase is-source-mode a previewFrame y data-view-mode en shell al alternar a source", () => {
    const previewFrame = createMockElement([]);
    const shell = createMockElement([]);

    const controller = initDefault({
      previewFrame: /** @type {any} */ previewFrame,
      shell: /** @type {any} */ shell,
    });

    expect(previewFrame.classList.contains("is-source-mode")).toBe(false);
    expect(shell.getAttribute("data-view-mode")).toBe("render");

    controller.applyViewMode(VIEW_MODE.SOURCE);

    expect(previewFrame.classList.contains("is-source-mode")).toBe(true);
    expect(shell.getAttribute("data-view-mode")).toBe("source");

    controller.applyViewMode(VIEW_MODE.RENDER);

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
        getElementById: (id: string) =>
          id === "view-mode-render" ? (renderBtn as unknown as HTMLElement) : null,
      };
      expect(setupViewModeControls(incompleteDom)).toBeNull();
    });

    test("inicializa y retorna el controlador si todos los elementos existen", () => {
      const domMap: Record<string, ReturnType<typeof createMockElement>> = {
        "view-mode-render": renderBtn,
        "view-mode-source": sourceBtn,
        "preview-iframe": iframe,
        "preview-source-container": sourceContainer,
        "preview-source-code": sourceCode,
        "preview-skeleton": skeleton,
      };

      const mockDom = {
        getElementById: (id: string) => (domMap[id] as unknown as HTMLElement | undefined) ?? null,
      };

      const controller = setupViewModeControls(mockDom, mockStorage);
      expect(controller).not.toBeNull();
      expect(typeof controller?.applyViewMode).toBe("function");
      expect(typeof controller?.updateSourceHtml).toBe("function");
    });
  });
});
