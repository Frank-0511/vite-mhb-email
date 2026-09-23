import {
  STORAGE_KEY_VIEWPORT_MODE,
  STORAGE_KEY_VIEWPORT_CUSTOM_WIDTH,
} from "../../../../shared/utils/storage-keys.ts";
import { VIEWPORT_MODE } from "../../constants.ts";
import { isViewportMode } from "../../guards.ts";
import type { ViewportMode } from "../../types.ts";

const CUSTOM_WIDTH_MIN = 280;
const CUSTOM_WIDTH_MAX = 1200;
const DEFAULT_DESKTOP_WIDTH = 600;

const VIEWPORT_PRESETS: Record<typeof VIEWPORT_MODE.DESKTOP | typeof VIEWPORT_MODE.MOBILE, number> =
  {
    desktop: DEFAULT_DESKTOP_WIDTH,
    mobile: 375,
  };

export type ViewportControlElements = {
  desktopButton: HTMLButtonElement;
  mobileButton: HTMLButtonElement;
  customButton: HTMLButtonElement;
  customInputWrap: HTMLElement;
  customInput: HTMLInputElement;
  previewFrame: HTMLElement;
  widthIndicator?: HTMLElement | null;
};

export type ViewportStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
};

export type ViewportController = {
  applyViewport: (
    mode: ViewportMode,
    customWidth?: string | number,
    options?: { syncInput?: boolean },
  ) => void;
};

export type ViewportDocument = Pick<Document, "getElementById">;

const memoryFallbackStorage: ViewportStorage = {
  getItem: () => null,
  setItem: () => {},
};

function getDefaultStorage(): ViewportStorage {
  if (typeof window !== "undefined" && window.localStorage) return window.localStorage;
  if (typeof localStorage !== "undefined") return localStorage;
  return memoryFallbackStorage;
}

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

export function clampViewportWidth(width: unknown, fallbackWidth = DEFAULT_DESKTOP_WIDTH): number {
  const parsed = Number(width);
  const fallback = Number.isFinite(fallbackWidth) ? fallbackWidth : DEFAULT_DESKTOP_WIDTH;

  if (!Number.isFinite(parsed)) return fallback;

  return Math.max(CUSTOM_WIDTH_MIN, Math.min(CUSTOM_WIDTH_MAX, Math.round(parsed)));
}

/**
 * Returns a width only when the current input is complete enough to apply live.
 * Partial values below the minimum are intentionally ignored so typing "1024"
 * is not interrupted by clamping "1" to "280".
 */
export function getLiveCustomViewportWidth(inputValue: string): number | null {
  if (inputValue.trim() === "") return null;

  const parsed = Number(inputValue);
  if (!Number.isFinite(parsed)) return null;

  const rounded = Math.round(parsed);
  if (rounded < CUSTOM_WIDTH_MIN || rounded > CUSTOM_WIDTH_MAX) return null;

  return rounded;
}

export function getCommittedCustomViewportWidth(
  inputValue: string,
  fallbackWidth = DEFAULT_DESKTOP_WIDTH,
): number {
  if (inputValue.trim() === "") return clampViewportWidth(fallbackWidth);

  return clampViewportWidth(inputValue, fallbackWidth);
}

/** Initializes the preview viewport controls. */
export function initViewportControls(
  elements: ViewportControlElements,
  storage: ViewportStorage = getDefaultStorage(),
): ViewportController {
  function setSelected(button: HTMLButtonElement, isSelected: boolean): void {
    button.classList.remove(...SELECTED_CLASSES, ...UNSELECTED_CLASSES);
    button.classList.add(...(isSelected ? SELECTED_CLASSES : UNSELECTED_CLASSES));
  }

  function setActiveViewportButton(active: ViewportMode): void {
    setSelected(elements.desktopButton, active === VIEWPORT_MODE.DESKTOP);
    setSelected(elements.mobileButton, active === VIEWPORT_MODE.MOBILE);
    setSelected(elements.customButton, active === VIEWPORT_MODE.CUSTOM);
  }

  function applyViewport(
    mode: ViewportMode,
    customWidth?: string | number,
    options: { syncInput?: boolean } = {},
  ): void {
    const width =
      mode === VIEWPORT_MODE.CUSTOM
        ? clampViewportWidth(customWidth, DEFAULT_DESKTOP_WIDTH)
        : VIEWPORT_PRESETS[mode];
    const syncInput = options.syncInput !== false;

    elements.previewFrame.style.width = `${width}px`;
    if (elements.widthIndicator) {
      elements.widthIndicator.textContent = `${width}px`;
    }
    elements.customInputWrap.classList.toggle("hidden", mode !== VIEWPORT_MODE.CUSTOM);
    elements.customInputWrap.classList.toggle("flex", mode === VIEWPORT_MODE.CUSTOM);

    if (mode === VIEWPORT_MODE.CUSTOM && syncInput) {
      elements.customInput.value = String(width);
    }

    setActiveViewportButton(mode);

    storage.setItem(STORAGE_KEY_VIEWPORT_MODE, mode);
    if (mode === VIEWPORT_MODE.CUSTOM) {
      storage.setItem(STORAGE_KEY_VIEWPORT_CUSTOM_WIDTH, String(width));
    }
  }

  function commitCustomInput(): void {
    const fallbackWidth = Number.parseInt(
      storage.getItem(STORAGE_KEY_VIEWPORT_CUSTOM_WIDTH) || "",
      10,
    );
    const width = getCommittedCustomViewportWidth(elements.customInput.value, fallbackWidth);

    applyViewport(VIEWPORT_MODE.CUSTOM, width);
  }

  const rawSavedMode = storage.getItem(STORAGE_KEY_VIEWPORT_MODE);
  const savedViewportMode: ViewportMode = isViewportMode(rawSavedMode)
    ? rawSavedMode
    : VIEWPORT_MODE.DESKTOP;
  const savedCustomWidth =
    storage.getItem(STORAGE_KEY_VIEWPORT_CUSTOM_WIDTH) || String(DEFAULT_DESKTOP_WIDTH);

  applyViewport(savedViewportMode, savedCustomWidth);

  elements.desktopButton.addEventListener("click", () => applyViewport(VIEWPORT_MODE.DESKTOP));
  elements.mobileButton.addEventListener("click", () => applyViewport(VIEWPORT_MODE.MOBILE));
  elements.customButton.addEventListener("click", () => {
    const storedCustomWidth =
      storage.getItem(STORAGE_KEY_VIEWPORT_CUSTOM_WIDTH) ||
      elements.customInput.value ||
      String(DEFAULT_DESKTOP_WIDTH);
    applyViewport(VIEWPORT_MODE.CUSTOM, storedCustomWidth);
    elements.customInput.focus();
  });
  elements.customInput.addEventListener("input", () => {
    const width = getLiveCustomViewportWidth(elements.customInput.value);

    if (width === null) return;

    applyViewport("custom", width, { syncInput: false });
  });
  elements.customInput.addEventListener("change", commitCustomInput);
  elements.customInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      commitCustomInput();
      elements.customInput.blur();
    }
  });

  return { applyViewport };
}

/**
 * Inicializa los controles de viewport consultando los elementos estándar del DOM.
 * Devuelve el controlador o null si no se encuentran los elementos requeridos.
 */
export function setupPreviewViewport(
  dom: ViewportDocument | null = typeof document !== "undefined" ? document : null,
  storage: ViewportStorage = getDefaultStorage(),
): ViewportController | null {
  if (!dom || typeof dom.getElementById !== "function") return null;

  const desktopButton = dom.getElementById("viewport-desktop");
  const mobileButton = dom.getElementById("viewport-mobile");
  const customButton = dom.getElementById("viewport-custom");
  const customInputWrap = dom.getElementById("viewport-custom-input-wrap");
  const customInput = dom.getElementById("viewport-custom-input");
  const previewFrame = dom.getElementById("preview-frame");
  const widthIndicator = dom.getElementById("viewport-width-indicator");

  if (
    desktopButton &&
    mobileButton &&
    customButton &&
    customInputWrap &&
    customInput &&
    previewFrame
  ) {
    return initViewportControls(
      {
        desktopButton: desktopButton as HTMLButtonElement,
        mobileButton: mobileButton as HTMLButtonElement,
        customButton: customButton as HTMLButtonElement,
        customInputWrap,
        customInput: customInput as HTMLInputElement,
        previewFrame,
        widthIndicator,
      },
      storage,
    );
  }

  return null;
}
