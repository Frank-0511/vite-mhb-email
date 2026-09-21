// @ts-check
import { describe, expect, it, mock } from "bun:test";
import { setupMoreMenu } from "./more-menu.js";
import { createMockElement } from "../runtime/test-helpers.js";

describe("more-menu", () => {
  function setupTestEnv({ matches = false } = {}) {
    const details = createMockElement();
    details.contains = mock((target) => target === details);

    let docClickListener = null;
    const doc = /** @type {any} */ ({
      getElementById(id) {
        if (id === "editor-more-menu") return details;
        return null;
      },
      addEventListener(event, listener) {
        if (event === "click") docClickListener = listener;
      },
    });

    const mqlListeners = [];
    const mql = {
      matches,
      addEventListener(event, listener) {
        if (event === "change") mqlListeners.push(listener);
      },
    };

    const win = /** @type {any} */ ({
      matchMedia: mock(() => mql),
    });

    return { details, doc, win, mql, triggerDocClick: (target) => docClickListener?.({ target }) };
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
