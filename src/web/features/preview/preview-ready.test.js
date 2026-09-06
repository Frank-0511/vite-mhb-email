// @ts-check
import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { markPreviewReady } from "./preview-ready.js";

/**
 * Mock de elemento DOM con soporte de classList y disabled.
 * @param {string[]} [initialClasses]
 */
function createMockElement(initialClasses = []) {
  const classes = new Set(initialClasses);
  return {
    disabled: true,
    classList: {
      add: mock((/** @type {string} */ cls) => classes.add(cls)),
      remove: mock((/** @type {string} */ cls) => classes.delete(cls)),
      contains: (/** @type {string} */ cls) => classes.has(cls),
    },
    remove: mock(() => {}),
  };
}

describe("markPreviewReady", () => {
  /** @type {any} */
  let originalDocument;
  /** @type {Map<string, any>} */
  let elementMap;

  beforeEach(() => {
    originalDocument = globalThis.document;
    elementMap = new Map();

    globalThis.document = /** @type {any} */ ({
      getElementById: (/** @type {string} */ id) => elementMap.get(id) ?? null,
      querySelectorAll: () => [],
    });
  });

  afterEach(() => {
    globalThis.document = originalDocument;
  });

  test("desbloquea acciones, revela controles y oculta los skeletons correspondientes", () => {
    const headerLeftSkeleton = createMockElement();
    const headerLeftContent = createMockElement(["hidden"]);
    const backBtnSkeleton = createMockElement();
    const backBtn = createMockElement(["hidden"]);
    const templateName = createMockElement(["hidden"]);
    const templateNameSkeleton = createMockElement();
    const themeToggleSkeleton = createMockElement();
    const appThemeToggle = createMockElement(["hidden"]);
    const actionsSkeleton = createMockElement();
    const actionsButtons = createMockElement(["hidden"]);
    const saveBtn = createMockElement();
    const resetBtn = createMockElement();
    const previewTitleSkeleton = createMockElement();
    const previewTitle = createMockElement(["hidden"]);
    const topbarSkeleton = createMockElement();
    const topbarControls = createMockElement(["hidden"]);
    const syncStatusSkeleton = createMockElement();
    const syncStatus = createMockElement(["hidden"]);
    const copyHtmlSkeleton = createMockElement();
    const copyHtmlBtn = createMockElement(["hidden"]);

    elementMap.set("header-left-skeleton", headerLeftSkeleton);
    elementMap.set("header-left-content", headerLeftContent);
    elementMap.set("back-btn-skeleton", backBtnSkeleton);
    elementMap.set("btn-back", backBtn);
    elementMap.set("template-name", templateName);
    elementMap.set("template-name-skeleton", templateNameSkeleton);
    elementMap.set("theme-toggle-skeleton", themeToggleSkeleton);
    elementMap.set("app-theme-toggle", appThemeToggle);
    elementMap.set("actions-skeleton", actionsSkeleton);
    elementMap.set("actions-buttons", actionsButtons);
    elementMap.set("btn-save", saveBtn);
    elementMap.set("btn-reset", resetBtn);
    elementMap.set("preview-title-skeleton", previewTitleSkeleton);
    elementMap.set("preview-title", previewTitle);
    elementMap.set("topbar-skeleton", topbarSkeleton);
    elementMap.set("topbar-controls", topbarControls);
    elementMap.set("sync-status-skeleton", syncStatusSkeleton);
    elementMap.set("sync-status", syncStatus);
    elementMap.set("copy-html-skeleton", copyHtmlSkeleton);
    elementMap.set("btn-copy-html", copyHtmlBtn);

    markPreviewReady();

    // 1. Cabecera izquierda (botón atrás, título)
    expect(headerLeftSkeleton.classList.contains("hidden")).toBe(true);
    expect(headerLeftContent.classList.contains("hidden")).toBe(false);
    expect(headerLeftContent.classList.contains("flex")).toBe(true);
    expect(backBtnSkeleton.classList.contains("hidden")).toBe(true);
    expect(backBtn.classList.contains("hidden")).toBe(false);
    expect(backBtn.classList.contains("inline-flex")).toBe(true);
    expect(templateName.classList.contains("hidden")).toBe(false);
    expect(templateNameSkeleton.remove).toHaveBeenCalled();

    // 2. Cabecera derecha (theme toggle)
    expect(themeToggleSkeleton.classList.contains("hidden")).toBe(true);
    expect(appThemeToggle.classList.contains("hidden")).toBe(false);

    // 3. Acciones del editor
    expect(actionsSkeleton.classList.contains("hidden")).toBe(true);
    expect(actionsButtons.classList.contains("hidden")).toBe(false);
    expect(actionsButtons.classList.contains("flex")).toBe(true);
    expect(saveBtn.disabled).toBe(false);
    expect(resetBtn.disabled).toBe(false);

    // 4. Controles superiores
    expect(previewTitleSkeleton.classList.contains("hidden")).toBe(true);
    expect(previewTitle.classList.contains("hidden")).toBe(false);
    expect(previewTitle.classList.contains("flex")).toBe(true);
    expect(topbarSkeleton.classList.contains("hidden")).toBe(true);
    expect(topbarControls.classList.contains("hidden")).toBe(false);
    expect(topbarControls.classList.contains("flex")).toBe(true);
    expect(syncStatusSkeleton.classList.contains("hidden")).toBe(true);
    expect(syncStatus.classList.contains("hidden")).toBe(false);
    expect(syncStatus.classList.contains("flex")).toBe(true);
    expect(copyHtmlSkeleton.classList.contains("hidden")).toBe(true);
    expect(copyHtmlBtn.classList.contains("hidden")).toBe(false);
    expect(copyHtmlBtn.classList.contains("flex")).toBe(true);
  });

  test("se degrada con seguridad cuando document no está disponible", () => {
    // @ts-ignore
    globalThis.document = undefined;
    expect(() => markPreviewReady()).not.toThrow();
  });
});
