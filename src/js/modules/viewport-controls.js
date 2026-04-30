const CUSTOM_WIDTH_MIN = 280;
const CUSTOM_WIDTH_MAX = 1200;
const DEFAULT_DESKTOP_WIDTH = 600;

const VIEWPORT_MODE_KEY = "preview-viewport-mode";
const VIEWPORT_CUSTOM_WIDTH_KEY = "preview-viewport-custom-width";

const VIEWPORT_PRESETS = {
  desktop: DEFAULT_DESKTOP_WIDTH,
  mobile: 375,
};

/**
 * @param {unknown} width
 * @param {number} fallbackWidth
 * @returns {number}
 */
export function clampViewportWidth(width, fallbackWidth = DEFAULT_DESKTOP_WIDTH) {
  const parsed = Number(width);
  const fallback = Number.isFinite(fallbackWidth) ? fallbackWidth : DEFAULT_DESKTOP_WIDTH;

  if (!Number.isFinite(parsed)) return fallback;

  return Math.max(CUSTOM_WIDTH_MIN, Math.min(CUSTOM_WIDTH_MAX, Math.round(parsed)));
}

/**
 * Returns a width only when the current input is complete enough to apply live.
 * Partial values below the minimum are intentionally ignored so typing "1024"
 * is not interrupted by clamping "1" to "280".
 *
 * @param {string} inputValue
 * @returns {number | null}
 */
export function getLiveCustomViewportWidth(inputValue) {
  if (inputValue.trim() === "") return null;

  const parsed = Number(inputValue);
  if (!Number.isFinite(parsed)) return null;

  const rounded = Math.round(parsed);
  if (rounded < CUSTOM_WIDTH_MIN || rounded > CUSTOM_WIDTH_MAX) return null;

  return rounded;
}

/**
 * @param {string} inputValue
 * @param {number} fallbackWidth
 * @returns {number}
 */
export function getCommittedCustomViewportWidth(inputValue, fallbackWidth = DEFAULT_DESKTOP_WIDTH) {
  if (inputValue.trim() === "") return clampViewportWidth(fallbackWidth);

  return clampViewportWidth(inputValue, fallbackWidth);
}

/**
 * @typedef {Object} ViewportControlElements
 * @property {HTMLButtonElement} desktopButton
 * @property {HTMLButtonElement} mobileButton
 * @property {HTMLButtonElement} customButton
 * @property {HTMLElement} customInputWrap
 * @property {HTMLInputElement} customInput
 * @property {HTMLElement} previewFrame
 * @property {HTMLElement} widthIndicator
 */

/**
 * @typedef {Object} ViewportStorage
 * @property {(key: string) => string | null} getItem
 * @property {(key: string, value: string) => void} setItem
 */

/**
 * Initializes the preview viewport controls.
 *
 * @param {ViewportControlElements} elements
 * @param {ViewportStorage} storage
 * @returns {{ applyViewport: (mode: string, customWidth?: string | number, options?: { syncInput?: boolean }) => void }}
 */
export function initViewportControls(elements, storage = window.localStorage) {
  /**
   * @param {HTMLButtonElement} button
   * @param {boolean} isSelected
   * @returns {void}
   */
  function setSelected(button, isSelected) {
    const selectedClasses = [
      "bg-sky-500",
      "text-white",
      "hover:bg-sky-600",
      "dark:bg-sky-500",
      "dark:text-white",
      "dark:hover:bg-sky-600",
    ];
    const unselectedClasses = [
      "bg-white",
      "dark:bg-slate-900",
      "text-slate-600",
      "dark:text-slate-300",
      "hover:bg-slate-100",
      "dark:hover:bg-slate-800",
    ];

    button.classList.remove(...selectedClasses, ...unselectedClasses);
    button.classList.add(...(isSelected ? selectedClasses : unselectedClasses));
  }

  /**
   * @param {string} active
   * @returns {void}
   */
  function setActiveViewportButton(active) {
    setSelected(elements.desktopButton, active === "desktop");
    setSelected(elements.mobileButton, active === "mobile");
    setSelected(elements.customButton, active === "custom");
  }

  /**
   * @param {string} mode
   * @param {string | number} [customWidth]
   * @param {{ syncInput?: boolean }} [options]
   * @returns {void}
   */
  function applyViewport(mode, customWidth, options = {}) {
    const resolvedMode = mode === "mobile" || mode === "custom" ? mode : "desktop";
    const width =
      resolvedMode === "custom"
        ? clampViewportWidth(customWidth, DEFAULT_DESKTOP_WIDTH)
        : VIEWPORT_PRESETS[resolvedMode];
    const syncInput = options.syncInput !== false;

    elements.previewFrame.style.width = `${width}px`;
    elements.widthIndicator.textContent = `${width}px`;
    elements.customInputWrap.classList.toggle("hidden", resolvedMode !== "custom");
    elements.customInputWrap.classList.toggle("flex", resolvedMode === "custom");

    if (resolvedMode === "custom" && syncInput) {
      elements.customInput.value = String(width);
    }

    setActiveViewportButton(resolvedMode);

    storage.setItem(VIEWPORT_MODE_KEY, resolvedMode);
    if (resolvedMode === "custom") {
      storage.setItem(VIEWPORT_CUSTOM_WIDTH_KEY, String(width));
    }
  }

  /**
   * @returns {void}
   */
  function commitCustomInput() {
    const fallbackWidth = Number.parseInt(storage.getItem(VIEWPORT_CUSTOM_WIDTH_KEY) || "", 10);
    const width = getCommittedCustomViewportWidth(elements.customInput.value, fallbackWidth);

    applyViewport("custom", width);
  }

  const savedViewportMode = storage.getItem(VIEWPORT_MODE_KEY) || "desktop";
  const savedCustomWidth =
    storage.getItem(VIEWPORT_CUSTOM_WIDTH_KEY) || String(DEFAULT_DESKTOP_WIDTH);

  applyViewport(savedViewportMode, savedCustomWidth);

  elements.desktopButton.addEventListener("click", () => applyViewport("desktop"));
  elements.mobileButton.addEventListener("click", () => applyViewport("mobile"));
  elements.customButton.addEventListener("click", () => {
    const storedCustomWidth =
      storage.getItem(VIEWPORT_CUSTOM_WIDTH_KEY) ||
      elements.customInput.value ||
      String(DEFAULT_DESKTOP_WIDTH);
    applyViewport("custom", storedCustomWidth);
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
