// @ts-check
import { afterEach, describe, expect, test } from "bun:test";
import { initializeTemplateCardPreviews, loadTemplateCardPreview } from "./card-previews.js";

function createPreview(source = "/templates/welcome/index.html") {
  const classes = new Set();
  let onLoad;
  const wrapper = {
    classList: {
      add: (/** @type {string} */ className) => classes.add(className),
      contains: (/** @type {string} */ className) => classes.has(className),
    },
  };
  const iframe = {
    dataset: { previewSrc: source },
    src: "",
    closest: () => wrapper,
    addEventListener: (/** @type {string} */ eventName, /** @type {() => void} */ listener) => {
      if (eventName === "load") onLoad = listener;
    },
  };

  return { iframe, wrapper, load: () => onLoad?.() };
}

describe("card-previews", () => {
  const originalIntersectionObserver = globalThis.IntersectionObserver;

  afterEach(() => {
    globalThis.IntersectionObserver = originalIntersectionObserver;
  });

  test("carga el iframe solo al activarlo y entonces oculta el skeleton", () => {
    const { iframe, wrapper, load } = createPreview();

    loadTemplateCardPreview(/** @type {HTMLIFrameElement} */ (iframe));

    expect(iframe.src).toBe("/templates/welcome/index.html");
    expect(iframe.dataset.previewSrc).toBeUndefined();
    expect(wrapper.classList.contains("is-preview-loaded")).toBe(false);

    load();

    expect(wrapper.classList.contains("is-preview-loaded")).toBe(true);
  });

  test("carga todos los previews si el navegador no soporta IntersectionObserver", () => {
    globalThis.IntersectionObserver = undefined;
    const first = createPreview("/templates/first/index.html");
    const second = createPreview("/templates/second/index.html");
    const root = {
      querySelectorAll: () => [first.iframe, second.iframe],
    };

    initializeTemplateCardPreviews(/** @type {Document} */ (root));

    expect(first.iframe.src).toBe("/templates/first/index.html");
    expect(second.iframe.src).toBe("/templates/second/index.html");
  });

  test("espera que la tarjeta se aproxime al viewport antes de cargarla", () => {
    const preview = createPreview();
    let callback;
    const unobserved = [];
    globalThis.IntersectionObserver = /** @type {typeof IntersectionObserver} */ (
      class {
        constructor(observerCallback) {
          callback = observerCallback;
        }

        observe() {}

        unobserve(target) {
          unobserved.push(target);
        }

        disconnect() {}

        takeRecords() {
          return [];
        }
      }
    );
    const root = { querySelectorAll: () => [preview.iframe] };

    initializeTemplateCardPreviews(/** @type {Document} */ (root));

    expect(preview.iframe.src).toBe("");

    callback([{ isIntersecting: true, target: preview.iframe }]);

    expect(preview.iframe.src).toBe("/templates/welcome/index.html");
    expect(unobserved).toEqual([preview.iframe]);
  });
});
