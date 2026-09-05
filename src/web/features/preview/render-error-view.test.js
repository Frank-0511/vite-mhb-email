// @ts-check
import { describe, expect, test } from "bun:test";
import { createRenderErrorView } from "./render-error-view.js";

/**
 * Crea un nodo DOM simulado ligero para probar la vista de error sin browser.
 *
 * @param {string} [id]
 */
function createMockDomElement(id = "") {
  /** @type {Map<string, string>} */
  const attributes = new Map();

  return {
    id,
    className: "",
    textContent: "",
    hidden: true,
    /** @type {any} */
    innerHTML: undefined,
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
    getAttribute(key) {
      return attributes.get(key) ?? null;
    },
    /**
     * @param {string} key
     */
    removeAttribute(key) {
      attributes.delete(key);
    },
  };
}

describe("render-error-view (vista accesible de errores)", () => {
  test("muestra mensaje, causa y ubicación mediante textContent", () => {
    const element = createMockDomElement("preview-render-error");
    const view = createRenderErrorView(element);

    view.show({
      message: "No se pudo renderizar el template.",
      cause: "El template contiene sintaxis inválida.",
      location: { path: "welcome/index.html", line: 9, column: 2 },
    });

    expect(element.hidden).toBe(false);
    expect(element.textContent).toContain("sintaxis inválida");
    expect(element.textContent).toContain("welcome/index.html:9:2");
    expect(element.innerHTML).toBeUndefined();
  });

  test("clear oculta y vacía el diagnóstico", () => {
    const element = createMockDomElement("preview-render-error");
    const view = createRenderErrorView(element);
    view.show({ message: "No se pudo renderizar el template." });
    view.clear();
    expect(element.hidden).toBe(true);
    expect(element.textContent).toBe("");
  });

  test("formatea ubicación con solo línea cuando no hay columna", () => {
    const element = createMockDomElement("preview-render-error");
    const view = createRenderErrorView(element);

    view.show({
      message: "No se pudo renderizar el template.",
      location: { path: "welcome/index.html", line: 15 },
    });

    expect(element.hidden).toBe(false);
    expect(element.textContent).toContain("welcome/index.html:15");
    expect(element.textContent).not.toContain("welcome/index.html:15:");
  });

  test("formatea ubicación con solo ruta cuando no hay línea ni columna", () => {
    const element = createMockDomElement("preview-render-error");
    const view = createRenderErrorView(element);

    view.show({
      message: "No se pudo renderizar el template.",
      location: { path: "welcome/index.html" },
    });

    expect(element.hidden).toBe(false);
    expect(element.textContent).toContain("welcome/index.html");
  });

  test("muestra solo mensaje cuando no hay causa ni ubicación", () => {
    const element = createMockDomElement("preview-render-error");
    const view = createRenderErrorView(element);

    view.show({ message: "No se pudo renderizar el template." });

    expect(element.hidden).toBe(false);
    expect(element.textContent).toBe("No se pudo renderizar el template.");
  });

  test("no falla si el elemento DOM es null o undefined", () => {
    const view = createRenderErrorView(null);
    expect(() => {
      view.show({ message: "Error" });
      view.clear();
    }).not.toThrow();
  });
});
