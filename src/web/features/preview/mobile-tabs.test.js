// @ts-check
import { describe, expect, it } from "bun:test";
import { initMobileTabs } from "./mobile-tabs.js";
import { createMockElement } from "./test-helpers.js";

describe("mobile-tabs", () => {
  function setupTestDom(initialBodyAttrs = {}) {
    const btnPreview = createMockElement(["tab-btn", "active"], {
      id: "tab-btn-preview",
      "aria-selected": "true",
    });
    const btnEditor = createMockElement(["tab-btn"], {
      id: "tab-btn-editor",
      "aria-selected": "false",
    });
    const body = createMockElement([], initialBodyAttrs);

    const doc = /** @type {any} */ ({
      body,
      getElementById(id) {
        if (id === "tab-btn-preview") return btnPreview;
        if (id === "tab-btn-editor") return btnEditor;
        return null;
      },
    });

    return { doc, btnPreview, btnEditor, body };
  }

  it("retorna sin error si el documento es nulo o faltan botones", () => {
    expect(() => initMobileTabs(/** @type {any} */ (null))).not.toThrow();

    const emptyDoc = /** @type {any} */ ({
      body: createMockElement(),
      getElementById: () => null,
    });
    expect(() => initMobileTabs(emptyDoc)).not.toThrow();
  });

  it("establece la pestaña 'preview' por defecto si data-mobile-tab no está definido", () => {
    const { doc, body } = setupTestDom();
    initMobileTabs(doc);
    expect(body.getAttribute("data-mobile-tab")).toBe("preview");
  });

  it("preserva data-mobile-tab existente si ya estaba configurado", () => {
    const { doc, body } = setupTestDom({ "data-mobile-tab": "editor" });
    initMobileTabs(doc);
    expect(body.getAttribute("data-mobile-tab")).toBe("editor");
  });

  it("cambia a la pestaña editor al hacer click en btnEditor", () => {
    const { doc, btnPreview, btnEditor, body } = setupTestDom();
    initMobileTabs(doc);

    btnEditor.trigger("click");

    expect(body.getAttribute("data-mobile-tab")).toBe("editor");
    expect(btnEditor.getAttribute("aria-selected")).toBe("true");
    expect(btnPreview.getAttribute("aria-selected")).toBe("false");
    expect(btnEditor.classList.contains("active")).toBe(true);
    expect(btnPreview.classList.contains("active")).toBe(false);
  });

  it("cambia de vuelta a la pestaña preview al hacer click en btnPreview", () => {
    const { doc, btnPreview, btnEditor, body } = setupTestDom();
    initMobileTabs(doc);

    btnEditor.trigger("click");
    btnPreview.trigger("click");

    expect(body.getAttribute("data-mobile-tab")).toBe("preview");
    expect(btnPreview.getAttribute("aria-selected")).toBe("true");
    expect(btnEditor.getAttribute("aria-selected")).toBe("false");
    expect(btnPreview.classList.contains("active")).toBe(true);
    expect(btnEditor.classList.contains("active")).toBe(false);
  });
});
