import { describe, expect, it, mock } from "bun:test";
import { createMockElement } from "../../features/preview/modules/runtime/test-helpers.ts";
import { EfSkeleton } from "./ef-skeleton.ts";

describe("EfSkeleton Web Component", () => {
  function createTestSkeleton(attrs = {}) {
    const skeleton = new EfSkeleton();
    const mockEl = createMockElement([], attrs);

    // Asignar métodos mock sobre la instancia para simular DOM en bun test
    const mockSkeleton = skeleton as unknown as Record<string, unknown>;
    mockSkeleton.getAttribute = mockEl.getAttribute;
    mockSkeleton.setAttribute = mockEl.setAttribute;
    mockSkeleton.hasAttribute = mockEl.hasAttribute;
    mockSkeleton.classList = mockEl.classList;
    mockSkeleton.remove = mock(() => {});

    return { skeleton, mockEl };
  }

  it("oculta el skeleton y revela el elemento objetivo con reveal-display por defecto", () => {
    const { skeleton } = createTestSkeleton({
      for: "target-content",
    });

    const target = createMockElement(["hidden"]);
    const doc = /** @type {any} */ {
      getElementById(id: string) {
        if (id === "target-content") return target;
        return null;
      },
    };

    skeleton.reveal(doc as unknown as Document);

    expect(skeleton.classList.contains("hidden")).toBe(true);
    expect(target.classList.contains("hidden")).toBe(false);
  });

  it("aplica reveal-display personalizado (ej. flex o inline-flex) sobre el target", () => {
    const { skeleton } = createTestSkeleton({
      for: "target-flex",
      "reveal-display": "flex",
    });

    const target = createMockElement(["hidden"]);
    const doc = /** @type {any} */ {
      getElementById(id: string) {
        if (id === "target-flex") return target;
        return null;
      },
    };

    skeleton.reveal(doc as unknown as Document);

    expect(skeleton.classList.contains("hidden")).toBe(true);
    expect(target.classList.contains("hidden")).toBe(false);
    expect(target.classList.contains("flex")).toBe(true);
  });

  it("elimina el skeleton del DOM cuando reveal-mode='remove'", () => {
    const { skeleton } = createTestSkeleton({
      for: "target-removable",
      "reveal-mode": "remove",
    });

    const target = createMockElement(["hidden"]);
    const doc = /** @type {any} */ {
      getElementById(id: string) {
        if (id === "target-removable") return target;
        return null;
      },
    };

    skeleton.reveal(doc as unknown as Document);

    expect(skeleton.remove).toHaveBeenCalled();
    expect(target.classList.contains("hidden")).toBe(false);
  });

  it("funciona correctamente sin atributo 'for' (solo oculta o elimina el skeleton)", () => {
    const { skeleton } = createTestSkeleton();
    const doc = /** @type {any} */ {
      getElementById: () => null,
    };

    expect(() => skeleton.reveal(doc as unknown as Document)).not.toThrow();
    expect(skeleton.classList.contains("hidden")).toBe(true);
  });

  it("no lanza error si el target especificado en 'for' no existe en el documento", () => {
    const { skeleton } = createTestSkeleton({ for: "non-existent" });
    const doc = /** @type {any} */ {
      getElementById: () => null,
    };

    expect(() => skeleton.reveal(doc as unknown as Document)).not.toThrow();
    expect(skeleton.classList.contains("hidden")).toBe(true);
  });
});
