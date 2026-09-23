import { describe, expect, it, mock } from "bun:test";
import type { MockElement } from "../runtime/test-helpers.ts";
import { createMockElement } from "../runtime/test-helpers.ts";
import { setupMoreMenu } from "./more-menu.ts";

describe("more-menu", () => {
  function setupTestEnv({ matches = false }: { matches?: boolean } = {}): {
    details: MockElement;
    doc: Document;
    win: Window;
    mql: { matches: boolean };
    triggerDocClick: (target: unknown) => void;
  } {
    const details = createMockElement();
    details.contains = mock((target) => target === details);

    let docClickListener: ((event: { target: unknown }) => void) | null = null;
    const doc = {
      getElementById(id: string) {
        if (id === "editor-more-menu") return details;
        return null;
      },
      addEventListener(event: string, listener: (event: { target: unknown }) => void) {
        if (event === "click") docClickListener = listener;
      },
    } as unknown as Document;

    const mqlListeners = [];
    const mql = {
      matches,
      addEventListener(event: string, listener: () => void) {
        if (event === "change") mqlListeners.push(listener);
      },
    };

    const win = {
      matchMedia: mock(() => mql),
    } as unknown as Window;

    return {
      details,
      doc,
      win,
      mql,
      triggerDocClick: (target: unknown) => docClickListener?.({ target }),
    };
  }

  it("abre el menú por defecto en vista amplia (>= 480px)", () => {
    const { details, doc, win } = setupTestEnv({ matches: false });
    setupMoreMenu(doc, win);
    expect(details.hasAttribute("open")).toBe(true);
  });

  it("cierra el menú por defecto en vista estrecha (< 480px)", () => {
    const { details, doc, win } = setupTestEnv({ matches: true });
    setupMoreMenu(doc, win);
    expect(details.hasAttribute("open")).toBe(false);
  });

  it("cierra el menú al hacer click fuera en vista estrecha si estaba abierto", () => {
    const { details, doc, win, triggerDocClick } = setupTestEnv({ matches: true });
    setupMoreMenu(doc, win);

    // Abrir el menú manualmente
    details.setAttribute("open", "");
    expect(details.hasAttribute("open")).toBe(true);

    const outsideElement = createMockElement();
    triggerDocClick(outsideElement);

    expect(details.hasAttribute("open")).toBe(false);
  });

  it("no cierra el menú si el click fue dentro del menú", () => {
    const { details, doc, win, triggerDocClick } = setupTestEnv({ matches: true });
    setupMoreMenu(doc, win);

    details.setAttribute("open", "");
    triggerDocClick(details);

    expect(details.hasAttribute("open")).toBe(true);
  });
});
