// @ts-check
/**
 * @fileoverview Control de alternancia entre vista renderizada y código fuente en preview.
 * Permite alternar entre el iframe de vista previa y el HTML compilado escapado sin
 * recompilaciones redundantes, persistiendo el estado durante la sesión del navegador.
 */

export const VIEW_MODE_KEY = "preview-view-mode";
export const VIEW_MODE_RENDER = "render";
export const VIEW_MODE_SOURCE = "source";

/**
 * @typedef {Object} ViewModeElements
 * @property {HTMLButtonElement} renderBtn - Botón para activar vista renderizada.
 * @property {HTMLButtonElement} sourceBtn - Botón para activar código fuente.
 * @property {HTMLElement} iframe - Elemento iframe del template.
 * @property {HTMLElement} sourceContainer - Contenedor del visor de código fuente.
 * @property {HTMLElement} sourceCode - Elemento <code> que contiene el HTML escapado.
 * @property {HTMLElement | null} [skeleton] - Elemento DOM del skeleton inicial.
 * @property {HTMLElement | null} [previewFrame] - Elemento contenedor de previsualización / código.
 * @property {HTMLElement | null} [shell] - Elemento raíz o shell que contiene data-view-mode.
 */

/**
 * @typedef {Object} ViewModeStorage
 * @property {(key: string) => string | null} getItem
 * @property {(key: string, value: string) => void} setItem
 */

/**
 * @typedef {Object} ViewModeController
 * @property {(mode: string) => void} applyViewMode - Aplica el modo de vista ("render" o "source").
 * @property {() => string} getViewMode - Obtiene el modo de vista actual.
 * @property {(html: string) => void} updateSourceHtml - Actualiza el HTML compilado en memoria y en el visor.
 * @property {() => string} getSourceHtml - Obtiene el HTML compilado en memoria.
 */

/** @type {ViewModeStorage} */
const memoryFallbackStorage = {
  getItem: () => null,
  setItem: () => {},
};

/**
 * Actualiza las clases CSS y atributos ARIA de un botón de alternancia.
 *
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

  if (button.classList && typeof button.classList.remove === "function") {
    button.classList.remove(...selectedClasses, ...unselectedClasses);
    button.classList.add(...(isSelected ? selectedClasses : unselectedClasses));
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
export function initViewModeControls(elements, storage = memoryFallbackStorage) {
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
  function isSkeletonVisible() {
    if (!skeleton || !skeleton.classList) return false;
    return !skeleton.classList.contains("hidden");
  }

  /**
   * Sincroniza la visibilidad entre el iframe y el visor de código.
   *
   * @param {string} mode
   * @returns {void}
   */
  function syncVisibility(mode) {
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
  function applyViewMode(mode) {
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
  function updateSourceHtml(html) {
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

  // Escuchadores de eventos para alternar vista
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
 * @param {Document | { getElementById: (id: string) => any } | null} [dom]
 * @param {ViewModeStorage} [storage]
 * @returns {ViewModeController | null}
 */
export function setupViewModeControls(
  dom = typeof document !== "undefined" ? document : null,
  storage = typeof window !== "undefined" && window.sessionStorage
    ? window.sessionStorage
    : memoryFallbackStorage,
) {
  if (!dom || typeof dom.getElementById !== "function") return null;

  const renderBtn = /** @type {HTMLButtonElement | null} */ (
    dom.getElementById("view-mode-render")
  );
  const sourceBtn = /** @type {HTMLButtonElement | null} */ (
    dom.getElementById("view-mode-source")
  );
  const iframe = /** @type {HTMLElement | null} */ (dom.getElementById("preview-iframe"));
  const sourceContainer = /** @type {HTMLElement | null} */ (
    dom.getElementById("preview-source-container")
  );
  const sourceCode = /** @type {HTMLElement | null} */ (dom.getElementById("preview-source-code"));
  const skeleton = /** @type {HTMLElement | null} */ (dom.getElementById("preview-skeleton"));
  const previewFrame = /** @type {HTMLElement | null} */ (dom.getElementById("preview-frame"));
  const shell = /** @type {HTMLElement | null} */ (
    typeof dom.querySelector === "function" ? dom.querySelector(".preview-shell") : null
  );

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
