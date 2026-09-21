// @ts-check
import { describe, expect, it, mock } from "bun:test";
import { markPreviewReady } from "./preview-ready.js";
import { createMockElement } from "./test-helpers.js";

describe("markPreviewReady", () => {
  it("no lanza error si el documento es nulo o vacío", () => {
    expect(() => markPreviewReady(/** @type {any} */ (null))).not.toThrow();
  });

  it("recorre y ejecuta reveal() sobre todos los componentes <ef-skeleton>", () => {
    const skeleton1 = { reveal: mock(() => {}) };
    const skeleton2 = { reveal: mock(() => {}) };
    const saveBtn = createMockElement([], { id: "btn-save" });
    saveBtn.disabled = true;

    const doc = /** @type {any} */ ({
      querySelectorAll(selector) {
        if (selector === "ef-skeleton") return [skeleton1, skeleton2];
        return [];
      },
      getElementById(id) {
        if (id === "btn-save") return saveBtn;
        return null;
      },
    });

    markPreviewReady(doc);

    expect(skeleton1.reveal).toHaveBeenCalled();
    expect(skeleton2.reveal).toHaveBeenCalled();
    expect(saveBtn.disabled).toBe(false);
  });

  it("habilita los botones btn-save y btn-reset al marcar listo", () => {
    const saveBtn = createMockElement([], { id: "btn-save" });
    const resetBtn = createMockElement([], { id: "btn-reset" });
    saveBtn.disabled = true;
    resetBtn.disabled = true;

    const doc = /** @type {any} */ ({
      querySelectorAll: () => [],
      getElementById(id) {
        if (id === "btn-save") return saveBtn;
        if (id === "btn-reset") return resetBtn;
        return null;
      },
    });

    markPreviewReady(doc);

    expect(saveBtn.disabled).toBe(false);
    expect(resetBtn.disabled).toBe(false);
  });

  it("elimina template-name-skeleton si todavía existe en el árbol", () => {
    const templateNameSkeleton = createMockElement([], { id: "template-name-skeleton" });
    templateNameSkeleton.remove = mock(() => {});

    const doc = /** @type {any} */ ({
      querySelectorAll: () => [],
      getElementById(id) {
        if (id === "template-name-skeleton") return templateNameSkeleton;
        return null;
      },
    });

    markPreviewReady(doc);

    expect(templateNameSkeleton.remove).toHaveBeenCalled();
  });
});
