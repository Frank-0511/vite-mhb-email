import { describe, expect, test } from "bun:test";

import { createViewportMockElements } from "../runtime/test-helpers.ts";
import {
  getCommittedCustomViewportWidth,
  getLiveCustomViewportWidth,
  setupPreviewViewport,
  type ViewportDocument,
} from "./viewport-controls.ts";

describe("viewport custom width controls", () => {
  test("keeps partial input editable while typing custom widths", () => {
    expect(getLiveCustomViewportWidth("1")).toBeNull();
    expect(getLiveCustomViewportWidth("10")).toBeNull();
    expect(getLiveCustomViewportWidth("102")).toBeNull();
    expect(getLiveCustomViewportWidth("1024")).toBe(1024);
  });

  test("normalizes custom width only when committing", () => {
    expect(getCommittedCustomViewportWidth("", 600)).toBe(600);
    expect(getCommittedCustomViewportWidth("1", 600)).toBe(280);
    expect(getCommittedCustomViewportWidth("1300", 600)).toBe(1200);
  });

  describe("setupPreviewViewport", () => {
    test("retorna null si el objeto DOM es nulo o carece de getElementById", () => {
      expect(setupPreviewViewport(null)).toBeNull();
      // @ts-expect-error test defensivo
      expect(setupPreviewViewport({})).toBeNull();
    });

    test("retorna null si faltan elementos requeridos", () => {
      const mockDom: ViewportDocument = { getElementById: () => null };
      expect(setupPreviewViewport(mockDom)).toBeNull();
    });

    test("inicializa y retorna controlador con applyViewport si los elementos existen", () => {
      const elements = createViewportMockElements();

      const mockDom = {
        getElementById: (id: string) => elements[id] ?? null,
      } as unknown as ViewportDocument;

      const controller = setupPreviewViewport(mockDom);
      expect(controller).not.toBeNull();
      expect(typeof controller?.applyViewport).toBe("function");
    });

    test("inicializa exitosamente sin viewport-width-indicator tras eliminar la barra redundante", () => {
      const elements = createViewportMockElements(false);

      const mockDom = {
        getElementById: (id: string) => elements[id] ?? null,
      } as unknown as ViewportDocument;

      const controller = setupPreviewViewport(mockDom);
      expect(controller).not.toBeNull();
      expect(typeof controller?.applyViewport).toBe("function");

      expect(() => controller?.applyViewport("mobile")).not.toThrow();
      expect(elements["preview-frame"].style.width).toBe("375px");
    });
  });
});
