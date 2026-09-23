import { afterEach, describe, expect, test } from "bun:test";
import { initializeTemplateCardPreviews, loadTemplateCardPreview } from "./card-previews.ts";

function createPreview(source = "/templates/welcome/index.html") {
  const classes = new Set();
  let onLoad: (() => void) | undefined;
  const wrapper = {
    classList: {
      add: (className: string) => classes.add(className),
      contains: (className: string) => classes.has(className),
    },
  };
  const iframe = {
    dataset: { previewSrc: source },
    src: "",
    closest: () => wrapper,
    addEventListener: (eventName: string, listener: () => void) => {
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

    loadTemplateCardPreview(iframe as unknown as HTMLIFrameElement);

    expect(iframe.src).toBe("/templates/welcome/index.html");
    expect(iframe.dataset.previewSrc).toBeUndefined();
    expect(wrapper.classList.contains("is-preview-loaded")).toBe(false);

    load();

    expect(wrapper.classList.contains("is-preview-loaded")).toBe(true);
  });

  test("carga todos los previews si el navegador no soporta IntersectionObserver", () => {
    globalThis.IntersectionObserver = undefined as unknown as typeof IntersectionObserver;
    const first = createPreview("/templates/first/index.html");
    const second = createPreview("/templates/second/index.html");
    const root = {
      querySelectorAll: () => [first.iframe, second.iframe],
    };

    initializeTemplateCardPreviews(root as unknown as Document);

    expect(first.iframe.src).toBe("/templates/first/index.html");
    expect(second.iframe.src).toBe("/templates/second/index.html");
  });

  test("espera que la tarjeta se aproxime al viewport antes de cargarla", () => {
    const preview = createPreview();
    let callback: IntersectionObserverCallback | undefined;
    const unobserved: Element[] = [];
    globalThis.IntersectionObserver = class {
      constructor(observerCallback: IntersectionObserverCallback) {
        callback = observerCallback;
      }

      observe() {}

      unobserve(target: Element) {
        unobserved.push(target);
      }

      disconnect() {}

      takeRecords() {
        return [];
      }
    } as unknown as typeof IntersectionObserver;
    const root = { querySelectorAll: () => [preview.iframe] };

    initializeTemplateCardPreviews(root as unknown as Document);

    expect(preview.iframe.src).toBe("");

    if (callback) {
      callback(
        [
          {
            isIntersecting: true,
            target: preview.iframe as unknown as Element,
          } as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver,
      );
    }

    expect(preview.iframe.src).toBe("/templates/welcome/index.html");
    expect(unobserved).toEqual([preview.iframe]);
  });
});
