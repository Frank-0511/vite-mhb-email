/**
 * @fileoverview Control de alternancia entre vista renderizada y código fuente en preview.
 * Permite alternar entre el iframe de vista previa y el HTML compilado escapado sin
 * recompilaciones redundantes, persistiendo el estado durante la sesión del navegador.
 */

import { STORAGE_KEY_VIEW_MODE } from "../../../../shared/utils/storage-keys.ts";

export const VIEW_MODE_KEY = STORAGE_KEY_VIEW_MODE;
export const VIEW_MODE_RENDER = "render";
export const VIEW_MODE_SOURCE = "source";

export type ViewModeElements = {
  renderBtn: HTMLButtonElement;
  sourceBtn: HTMLButtonElement;
  iframe: HTMLElement;
  sourceContainer: HTMLElement;
  sourceCode: HTMLElement;
  skeleton?: HTMLElement | null;
  previewFrame?: HTMLElement | null;
  shell?: HTMLElement | null;
};

export type ViewModeStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
};

export type ViewModeController = {
  applyViewMode: (mode: string) => void;
  getViewMode: () => string;
  updateSourceHtml: (html: string) => void;
  getSourceHtml: () => string;
};

const memoryFallbackStorage: ViewModeStorage = {
  getItem: () => null,
  setItem: () => {},
};

const SELECTED_CLASSES = [
  "bg-sky-500",
  "text-white",
  "hover:bg-sky-600",
  "dark:bg-sky-500",
  "dark:text-white",
  "dark:hover:bg-sky-600",
];
const UNSELECTED_CLASSES = [
  "bg-white",
  "dark:bg-slate-900",
  "text-slate-600",
  "dark:text-slate-300",
  "hover:bg-slate-100",
  "dark:hover:bg-slate-800",
];

function setSelected(button: HTMLButtonElement, isSelected: boolean): void {
  if (button.classList && typeof button.classList.remove === "function") {
    button.classList.remove(...SELECTED_CLASSES, ...UNSELECTED_CLASSES);
    button.classList.add(...(isSelected ? SELECTED_CLASSES : UNSELECTED_CLASSES));
  }
  if (typeof button.setAttribute === "function") {
    button.setAttribute("aria-pressed", isSelected ? "true" : "false");
  }
}

/**
 * Inicializa el controlador de modo de vista con elementos inyectados.
 *
 * @param {ViewModeElements} elements
 * @param {ViewModeStorage} [storage]
 * @returns {ViewModeController}
 */
export function initViewModeControls(
  elements: ViewModeElements,
  storage: ViewModeStorage = memoryFallbackStorage,
): ViewModeController {
  const {
    renderBtn,
    sourceBtn,
    iframe,
    sourceContainer,
    sourceCode,
    skeleton,
    previewFrame,
    shell,
  } = elements;
  let currentMode = VIEW_MODE_RENDER;
  let lastHtml = "";

  /**
   * Determina si el skeleton inicial aún está visible.
   *
   * @returns {boolean}
   */
  function isSkeletonVisible(): boolean {
    if (!skeleton || !skeleton.classList) return false;
    return !skeleton.classList.contains("hidden");
  }

  /**
   * Sincroniza la visibilidad entre el iframe y el visor de código.
   *
   * @param {string} mode
   * @returns {void}
   */
  function syncVisibility(mode: string): void {
    if (isSkeletonVisible()) return;

    if (mode === VIEW_MODE_SOURCE) {
      if (iframe.classList) iframe.classList.add("hidden");
      if (sourceContainer.classList) sourceContainer.classList.remove("hidden");
    } else {
      if (sourceContainer.classList) sourceContainer.classList.add("hidden");
      if (iframe.classList) iframe.classList.remove("hidden");
    }
  }

  /**
   * Aplica un modo de vista ("render" o "source") sin disparar recompilación.
   *
   * @param {string} mode
   * @returns {void}
   */
  function applyViewMode(mode: string): void {
    const resolvedMode = mode === VIEW_MODE_SOURCE ? VIEW_MODE_SOURCE : VIEW_MODE_RENDER;
    currentMode = resolvedMode;

    setSelected(renderBtn, resolvedMode === VIEW_MODE_RENDER);
    setSelected(sourceBtn, resolvedMode === VIEW_MODE_SOURCE);

    if (previewFrame?.classList && typeof previewFrame.classList.toggle === "function") {
      previewFrame.classList.toggle("is-source-mode", resolvedMode === VIEW_MODE_SOURCE);
    }

    const targetShell =
      shell ||
      (typeof document !== "undefined"
        ? (typeof document.querySelector === "function" &&
            document.querySelector(".preview-shell")) ||
          document.body
        : null);

    if (targetShell && typeof targetShell.setAttribute === "function") {
      targetShell.setAttribute("data-view-mode", resolvedMode);
    }

    syncVisibility(resolvedMode);

    try {
      storage.setItem(VIEW_MODE_KEY, resolvedMode);
    } catch {
      // Degradar silenciosamente si storage falla o está restringido
    }
  }

  /**
   * Actualiza el HTML más reciente y lo inyecta de forma segura mediante textContent.
   *
   * @param {string} html
   * @returns {void}
   */
  function updateSourceHtml(html: string): void {
    lastHtml = typeof html === "string" ? html : "";
    // textContent sanitiza de manera nativa sin ejecutar código ni scripts
    if (sourceCode) {
      sourceCode.textContent = lastHtml;
    }
    syncVisibility(currentMode);
  }

  // Leer modo guardado en sesión al inicio
  let savedMode = VIEW_MODE_RENDER;
  try {
    const stored = storage.getItem(VIEW_MODE_KEY);
    if (stored === VIEW_MODE_SOURCE) {
      savedMode = VIEW_MODE_SOURCE;
    }
  } catch {
    savedMode = VIEW_MODE_RENDER;
  }

  applyViewMode(savedMode);

  renderBtn.addEventListener("click", () => applyViewMode(VIEW_MODE_RENDER));
  sourceBtn.addEventListener("click", () => applyViewMode(VIEW_MODE_SOURCE));

  return {
    applyViewMode,
    getViewMode: () => currentMode,
    updateSourceHtml,
    getSourceHtml: () => lastHtml,
  };
}

/**
 * Inicializa los controles de modo de vista a partir de un árbol DOM y almacenamiento.
 *
 * @param {Document | { getElementById: (id: string) => any, querySelector?: (sel: string) => any } | null} [dom]
 * @param {ViewModeStorage} [storage]
 * @returns {ViewModeController | null}
 */
export function setupViewModeControls(
  dom:
    | (Pick<Document, "getElementById"> & Partial<Pick<Document, "querySelector">>)
    | null = typeof document !== "undefined" ? document : null,
  storage: ViewModeStorage = typeof window !== "undefined" && window.sessionStorage
    ? window.sessionStorage
    : memoryFallbackStorage,
): ViewModeController | null {
  if (!dom || typeof dom.getElementById !== "function") return null;

  const renderBtn = dom.getElementById("view-mode-render") as HTMLButtonElement | null;
  const sourceBtn = dom.getElementById("view-mode-source") as HTMLButtonElement | null;
  const iframe = dom.getElementById("preview-iframe") as HTMLElement | null;
  const sourceContainer = dom.getElementById("preview-source-container") as HTMLElement | null;
  const sourceCode = dom.getElementById("preview-source-code") as HTMLElement | null;
  const skeleton = dom.getElementById("preview-skeleton") as HTMLElement | null;
  const previewFrame = dom.getElementById("preview-frame") as HTMLElement | null;
  const shell =
    "querySelector" in dom && typeof dom.querySelector === "function"
      ? (dom.querySelector(".preview-shell") as HTMLElement | null)
      : null;

  if (renderBtn && sourceBtn && iframe && sourceContainer && sourceCode) {
    return initViewModeControls(
      {
        renderBtn,
        sourceBtn,
        iframe,
        sourceContainer,
        sourceCode,
        skeleton,
        previewFrame: previewFrame ?? undefined,
        shell: shell ?? undefined,
      },
      storage,
    );
  }

  return null;
}
