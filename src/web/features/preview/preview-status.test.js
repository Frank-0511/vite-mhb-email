// @ts-check
import { describe, expect, test } from "bun:test";
import { createPreviewStatus } from "./preview-status.js";

/**
 * Mock ligero para nodo DOM.
 */
function createMockElement(initialClasses = "") {
  /** @type {Map<string, string>} */
  const attributes = new Map();
  return {
    className: initialClasses,
    textContent: "",
    innerHTML: "",
    setAttribute(key, value) {
      attributes.set(key, value);
    },
    getAttribute(key) {
      return attributes.get(key) ?? null;
    },
  };
}

describe("preview-status (controlador de estado visual)", () => {
  test("sync actualiza clase y contenido del indicador con dotColor y texto", () => {
    const syncStatus = createMockElement();
    const status = createPreviewStatus({
      syncStatus,
      espStatus: null,
      renderErrorView: { show: () => {}, clear: () => {} },
    });

    status.sync("Guardado", "text-emerald-600", "bg-emerald-500");

    expect(syncStatus.className).toContain("text-emerald-600");
    expect(syncStatus.innerHTML).toContain("bg-emerald-500");
    expect(syncStatus.innerHTML).toContain("Guardado");
  });

  test("esp formatea variables faltantes y añade visibilidad", () => {
    const espStatus = createMockElement();
    const status = createPreviewStatus({
      syncStatus: createMockElement(),
      espStatus,
      renderErrorView: { show: () => {}, clear: () => {} },
    });

    status.esp({ missing: ["first_name", "cta_url"], unused: [] });

    expect(espStatus.textContent).toBe("⚠️ Faltantes: first_name, cta_url");
    expect(espStatus.className).toBe("esp-validation-status visible");
    expect(espStatus.getAttribute("aria-hidden")).toBe("false");
  });

  test("esp formatea variables sobrantes (sin uso)", () => {
    const espStatus = createMockElement();
    const status = createPreviewStatus({
      syncStatus: createMockElement(),
      espStatus,
      renderErrorView: { show: () => {}, clear: () => {} },
    });

    status.esp({ missing: [], unused: ["extra_key"] });

    expect(espStatus.textContent).toBe("ℹ️ Sin uso: extra_key");
    expect(espStatus.className).toBe("esp-validation-status visible");
    expect(espStatus.getAttribute("aria-hidden")).toBe("false");
  });

  test("esp combina faltantes y sin uso con delimitador", () => {
    const espStatus = createMockElement();
    const status = createPreviewStatus({
      syncStatus: createMockElement(),
      espStatus,
      renderErrorView: { show: () => {}, clear: () => {} },
    });

    status.esp({ missing: ["first_name"], unused: ["legacy"] });

    expect(espStatus.textContent).toBe("⚠️ Faltantes: first_name · ℹ️ Sin uso: legacy");
    expect(espStatus.className).toBe("esp-validation-status visible");
  });

  test("esp oculta el contenedor cuando no hay mensajes o datos son nulos", () => {
    const espStatus = createMockElement("esp-validation-status visible");
    const status = createPreviewStatus({
      syncStatus: createMockElement(),
      espStatus,
      renderErrorView: { show: () => {}, clear: () => {} },
    });

    status.esp({ missing: [], unused: [] });

    expect(espStatus.textContent).toBe("");
    expect(espStatus.className).toBe("esp-validation-status");
    expect(espStatus.getAttribute("aria-hidden")).toBe("true");

    status.esp(null);
    expect(espStatus.textContent).toBe("");
    expect(espStatus.getAttribute("aria-hidden")).toBe("true");
  });

  test("esp no arroja error si espStatus es nulo o indefinido", () => {
    const status = createPreviewStatus({
      syncStatus: createMockElement(),
      espStatus: null,
      renderErrorView: { show: () => {}, clear: () => {} },
    });

    expect(() => {
      status.esp({ missing: ["first_name"] });
    }).not.toThrow();
  });

  test("renderSuccess limpia errores y actualiza el contenido del iframe", () => {
    let clearCalled = false;
    let updatedContent = "";

    const status = createPreviewStatus({
      syncStatus: createMockElement(),
      espStatus: null,
      renderErrorView: {
        clear: () => {
          clearCalled = true;
        },
        show: () => {},
      },
    });

    const mockIframeManager = {
      updateContent: (html) => {
        updatedContent = html;
      },
    };

    status.renderSuccess("<h1>Hola Mundo</h1>", mockIframeManager);

    expect(clearCalled).toBe(true);
    expect(updatedContent).toBe("<h1>Hola Mundo</h1>");
  });

  test("renderError delega el error a renderErrorView.show", () => {
    /** @type {any} */
    let receivedError = null;

    const status = createPreviewStatus({
      syncStatus: createMockElement(),
      espStatus: null,
      renderErrorView: {
        clear: () => {},
        show: (err) => {
          receivedError = err;
        },
      },
    });

    const testError = new Error("Fallo de render");
    status.renderError(testError);

    expect(receivedError).toBe(testError);
  });
});
