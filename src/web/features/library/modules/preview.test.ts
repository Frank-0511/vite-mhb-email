import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import type { LibraryComponentType } from "../types.ts";
import { previewManager } from "./preview.ts";

/**
 * Mock DOM element exposing only the `style.display` surface previewManager
 * reads/writes.
 */
function createMockElement(): { style: { display: string }; dataset: Record<string, string> } {
  return { style: { display: "" }, dataset: {} };
}

/**
 * Mock iframe element with the srcdoc/onload surface previewManager reads/writes.
 */
function createMockIframe() {
  return { ...createMockElement(), srcdoc: "", onload: null };
}

describe("previewManager", () => {
  /** @type {ReturnType<typeof createMockIframe>} */
  let iframe: ReturnType<typeof createMockIframe>;
  /** @type {ReturnType<typeof createMockElement>} */
  let emptyPreview: ReturnType<typeof createMockElement>;
  /** @type {ReturnType<typeof createMockElement>} */
  let skeleton: ReturnType<typeof createMockElement>;
  /** @type {typeof fetch} */
  let originalFetch: typeof fetch;

  beforeEach(() => {
    iframe = createMockIframe();
    emptyPreview = createMockElement();
    skeleton = createMockElement();
    previewManager.init(
      iframe as unknown as HTMLIFrameElement,
      emptyPreview as unknown as HTMLElement,
      skeleton as unknown as HTMLElement,
    );
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  test("showSkeleton hides the iframe and the empty state, and reveals the skeleton", () => {
    previewManager.showSkeleton();

    expect(skeleton.style.display).toBe("block");
    expect(iframe.style.display).toBe("none");
    expect(emptyPreview.style.display).toBe("none");
  });

  test("showSkeleton defaults to the organisms shape when no type is given", () => {
    previewManager.showSkeleton();

    expect(skeleton.dataset.type).toBe("organisms");
  });

  test("showSkeleton tags the skeleton with the given atomic design type", () => {
    previewManager.showSkeleton("atoms");

    expect(skeleton.dataset.type).toBe("atoms");
  });

  test("showSkeleton falls back to organisms for an unrecognized type", () => {
    previewManager.showSkeleton("bogus" as unknown as LibraryComponentType);

    expect(skeleton.dataset.type).toBe("organisms");
  });

  test("hideSkeleton reveals the iframe and hides the skeleton", () => {
    previewManager.showSkeleton();
    previewManager.hideSkeleton();

    expect(skeleton.style.display).toBe("none");
    expect(iframe.style.display).toBe("block");
  });

  test("render with showLoading shows the skeleton during the fetch and hides it after success", async () => {
    /** @type {(value?: unknown) => void} */
    let resolveFetch: (value: unknown) => void = () => {};
    globalThis.fetch = mock(
      () =>
        new Promise<unknown>((resolve) => {
          resolveFetch = resolve;
        }),
    ) as unknown as typeof fetch;

    const renderPromise = previewManager.render("hero-section", "v1", {}, { showLoading: true });

    expect(skeleton.style.display).toBe("block");
    expect(iframe.style.display).toBe("none");

    resolveFetch({ text: () => Promise.resolve("<p>rendered</p>") });
    await renderPromise;

    expect(skeleton.style.display).toBe("none");
    expect(iframe.style.display).toBe("block");
    expect(iframe.srcdoc).toBe("<p>rendered</p>");
  });

  test("render with showLoading forwards the atomic design type to the skeleton", () => {
    globalThis.fetch = mock(() => new Promise<unknown>(() => {})) as unknown as typeof fetch;

    void previewManager.render("cta-button", "v1", {}, { showLoading: true, type: "atoms" });

    expect(skeleton.dataset.type).toBe("atoms");
  });

  test("render without showLoading never touches the skeleton", async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(/** @type {any} */ { text: () => Promise.resolve("<p>ok</p>") }),
    ) as unknown as typeof fetch;

    await previewManager.render("hero-section", "v1", {});

    expect(skeleton.style.display).toBe("");
    expect(iframe.srcdoc).toBe("<p>ok</p>");
  });

  test("render with showLoading hides the skeleton even when the fetch fails", async () => {
    globalThis.fetch = mock(() =>
      Promise.reject(new Error("network down")),
    ) as unknown as typeof fetch;
    const originalConsoleError = console.error;
    console.error = mock(() => {});

    await previewManager.render("hero-section", "v1", {}, { showLoading: true });

    expect(skeleton.style.display).toBe("none");
    console.error = originalConsoleError;
  });

  test("hide() also hides the skeleton", () => {
    previewManager.showSkeleton();
    previewManager.hide();

    expect(skeleton.style.display).toBe("none");
    expect(emptyPreview.style.display).toBe("flex");
    expect(iframe.style.display).toBe("none");
  });
});
