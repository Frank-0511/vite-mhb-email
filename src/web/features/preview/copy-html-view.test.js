// @ts-check
import { describe, expect, test } from "bun:test";

import { renderModalState } from "./copy-html-view.js";

/**
 * Crea un nodo DOM simulado ligero para probar manipulación visual sin browser.
 *
 * @param {string} [id]
 */
function createMockDomElement(id = "") {
  /** @type {Map<string, string>} */
  const attributes = new Map();
  /** @type {Map<string, () => void>} */
  const listeners = new Map();

  return {
    id,
    className: "",
    textContent: "",
    /** @type {any[]} */
    children: [],
    style: {},
    /**
     * @param {string} key
     * @param {string} value
     */
    setAttribute(key, value) {
      attributes.set(key, value);
    },
    /**
     * @param {string} key
     */
    removeAttribute(key) {
      attributes.delete(key);
    },
    /**
     * @param {string} key
     */
    hasAttribute(key) {
      return attributes.has(key);
    },
    /**
     * @param {string} event
     * @param {() => void} listener
     */
    addEventListener(event, listener) {
      listeners.set(event, listener);
    },
    /**
     * @param {string} event
     */
    trigger(event) {
      const handler = listeners.get(event);
      if (handler) handler();
    },
    /**
     * @param  {...any} nodes
     */
    replaceChildren(...nodes) {
      this.children = nodes;
    },
    /**
     * @param {any} node
     */
    appendChild(node) {
      this.children.push(node);
    },
  };
}

describe("renderModalState", () => {
  function createTestElements() {
    return {
      buildAndCopyBtn: createMockDomElement("btn-build-and-copy"),
      copyExistingBtn: createMockDomElement("btn-copy-existing"),
      modalStatus: createMockDomElement("copy-html-status"),
    };
  }

  const mockDoc = {
    createElement: (tag) => createMockDomElement(tag),
  };

  test("estado idle: habilita botones, oculta status y limpia texto", () => {
    const elements = createTestElements();
    elements.buildAndCopyBtn.setAttribute("disabled", "");
    elements.modalStatus.className = "copy-html-status loading";
    elements.modalStatus.textContent = "Algo";

    // @ts-expect-error mock compatible
    renderModalState(elements, "idle");

    expect(elements.buildAndCopyBtn.hasAttribute("disabled")).toBe(false);
    expect(elements.copyExistingBtn.hasAttribute("disabled")).toBe(false);
    expect(elements.modalStatus.className).toBe("copy-html-status hidden");
    expect(elements.modalStatus.textContent).toBe("");
  });

  test("estado loading: deshabilita botones y muestra mensaje de progreso", () => {
    const elements = createTestElements();

    // @ts-expect-error mock compatible
    renderModalState(elements, "loading", { message: "Compilando maizzle…" });

    expect(elements.buildAndCopyBtn.hasAttribute("disabled")).toBe(true);
    expect(elements.copyExistingBtn.hasAttribute("disabled")).toBe(true);
    expect(elements.modalStatus.className).toBe("copy-html-status loading");
    expect(elements.modalStatus.textContent).toBe("Compilando maizzle…");
  });

  test("estado success: habilita botones y muestra confirmación", () => {
    const elements = createTestElements();

    // @ts-expect-error mock compatible
    renderModalState(elements, "success", { message: "Listo" });

    expect(elements.buildAndCopyBtn.hasAttribute("disabled")).toBe(false);
    expect(elements.copyExistingBtn.hasAttribute("disabled")).toBe(false);
    expect(elements.modalStatus.className).toBe("copy-html-status success");
    expect(elements.modalStatus.textContent).toBe("Listo");
  });

  test("estado clipboard-error: construye nodos de reintento seguros y conecta listener", () => {
    const elements = createTestElements();
    let retryClicked = false;

    renderModalState(
      // @ts-expect-error mock compatible
      elements,
      "clipboard-error",
      {
        onRetry: () => {
          retryClicked = true;
        },
        // @ts-expect-error mock compatible
        doc: mockDoc,
      },
    );

    expect(elements.buildAndCopyBtn.hasAttribute("disabled")).toBe(false);
    expect(elements.copyExistingBtn.hasAttribute("disabled")).toBe(false);
    expect(elements.modalStatus.className).toBe("copy-html-status error");
    expect(elements.modalStatus.children).toHaveLength(2);

    const span = elements.modalStatus.children[0];
    const retryBtn = elements.modalStatus.children[1];

    expect(span.textContent).toContain("No se pudo acceder al portapapeles");
    expect(retryBtn.id).toBe("btn-retry-clipboard");
    expect(retryBtn.textContent).toBe("Copiar ahora");

    retryBtn.trigger("click");
    expect(retryClicked).toBe(true);
  });

  test("estado error: habilita botones y muestra mensaje de error", () => {
    const elements = createTestElements();

    // @ts-expect-error mock compatible
    renderModalState(elements, "error", { message: "❌ 404 Not Found" });

    expect(elements.buildAndCopyBtn.hasAttribute("disabled")).toBe(false);
    expect(elements.copyExistingBtn.hasAttribute("disabled")).toBe(false);
    expect(elements.modalStatus.className).toBe("copy-html-status error");
    expect(elements.modalStatus.textContent).toBe("❌ 404 Not Found");
  });

  test("ignora con seguridad si faltan elementos requeridos", () => {
    expect(() => {
      // @ts-expect-error elementos incompletos
      renderModalState({ buildAndCopyBtn: null }, "idle");
    }).not.toThrow();
  });
});
