// @ts-check
/**
 * @fileoverview Punto de entrada de la página de preview.
 * Orquesta la edición de plantillas, renderizado en vivo y gestión de datos.
 */

import { queryRequired } from "../../shared/utils/dom-helpers.js";
import { fetchJSON } from "../../shared/utils/http-helpers.js";
import { initLucideIcons } from "../../shared/utils/lucide-setup.js";
import "../../shared/utils/theme-toggle-component.js";

import { initCopyHtmlModal } from "./copy-html-modal.js";
import { initializeEditor } from "./editor.js";
import { createIframeManager } from "./iframe-manager.js";
import { setupPreviewHmr } from "./preview-hmr.js";
import { getTemplateNameFromUrl, renderMissingTemplateError } from "./preview-params.js";
import { initMobileTabs } from "./mobile-tabs.js";
import { setupMoreMenu } from "./more-menu.js";
import { markPreviewReady } from "./preview-ready.js";
import { createPreviewStatus } from "./preview-status.js";
import { createRenderAPI } from "./render-api.js";
import { setupResetButton, setupSaveButton } from "./save-reset.js";
import "./styles.css";
import { setupTemplateThemeToggle } from "./theme-manager.js";
import { setupViewModeControls } from "./view-mode-controls.js";
import { setupPreviewViewport } from "./viewport-controls.js";

export { getTemplateNameFromUrl, markPreviewReady, renderMissingTemplateError };

/**
 * Orquesta la inicialización de todos los subsistemas del preview.
 *
 * @returns {Promise<void>}
 */
export async function initializePreview() {
  const templateName = getTemplateNameFromUrl();

  if (!templateName) {
    renderMissingTemplateError();
    throw new Error("No template specified");
  }

  // Inicializar iconos de Lucide
  initLucideIcons();

  // Menú "más opciones" del editor (abierto por defecto en ≥480px)
  setupMoreMenu();

  // Inicializar navegación por pestañas en móvil
  initMobileTabs();

  // Obtener elementos DOM requeridos
  const templateNameEl = queryRequired("template-name", "Preview Module");
  const iframeEl = /** @type {HTMLIFrameElement} */ (
    queryRequired("preview-iframe", "Preview Module")
  );
  const editorContainer = queryRequired("editor-container", "Preview Module");

  templateNameEl.textContent = templateName;

  // Inicializar controlador de estado visual
  const previewStatus = createPreviewStatus();

  const previewSkeleton = document.getElementById("preview-skeleton");

  // Inicializar gestor de iframe
  const iframeManager = createIframeManager({
    iframe: iframeEl,
    skeleton: previewSkeleton,
    onSyncStatusChange: (text, textColor, dotColor) =>
      previewStatus.sync(text, textColor, dotColor),
  });

  // Inicializar controles de alternancia de modo de vista (Render vs Código Fuente)
  const viewModeControls = setupViewModeControls();

  // Inicializar cliente de render API
  const renderAPI = createRenderAPI({
    onSuccess: (html) => {
      previewStatus.renderSuccess(html, iframeManager);
      if (viewModeControls) {
        viewModeControls.updateSourceHtml(html);
      }
    },
    onValidation: (result) => previewStatus.esp(result),
    onError: (err) => {
      console.error("Render error:", err);
      previewStatus.renderError(err);
      iframeManager.hideSkeleton();
      if (viewModeControls) {
        viewModeControls.applyViewMode(viewModeControls.getViewMode());
      }
      markPreviewReady();
    },
    onStatusChange: (text, textColor, dotColor) => previewStatus.sync(text, textColor, dotColor),
  });

  /** @type {(() => void) | null} */
  let debouncedRender = null;

  // Inicializar editor JSON
  const editorAPI = await initializeEditor({
    templateName,
    container: editorContainer,
    onChange: (_json) => {
      if (debouncedRender) debouncedRender();
    },
    onStatusChange: (text, textColor, dotColor) => previewStatus.sync(text, textColor, dotColor),
  });

  debouncedRender = renderAPI.createDebouncedRender(templateName, () => editorAPI.get(), 300);

  /**
   * Renderiza el template con el contenido actual del editor.
   *
   * @returns {Promise<void>}
   */
  async function renderCurrentTemplate() {
    const currentContent = editorAPI.get();
    const data =
      currentContent.json !== undefined ? currentContent.json : JSON.parse(currentContent.text);

    await renderAPI.render(templateName, data);
  }

  setupPreviewHmr({
    templateName,
    hot: import.meta.hot,
    fetchLatestData: (name = templateName) => fetchJSON(`/api/data?template=${name}`),
    editorAPI,
    renderAPI,
    renderCurrentTemplate,
  });

  // Render inicial usando el mismo endpoint que los cambios live
  await renderCurrentTemplate();

  // Toggle de tema de plantilla
  setupTemplateThemeToggle({
    onThemeChange: () => {
      renderCurrentTemplate().catch((error) => {
        console.error("Theme render error:", error);
      });
    },
  });

  // Botones de guardar y restaurar datos
  setupSaveButton({
    templateName,
    getEditorContent: () => editorAPI.get(),
    setInitialData: (data) => editorAPI.setInitialData(data),
    resetEditor: () => {
      editorAPI.updateContent(editorAPI.getInitialData());
    },
    resetIframe: (name) => {
      iframeManager.reset(name);
    },
    onStatusChange: (text, textColor, dotColor) => previewStatus.sync(text, textColor, dotColor),
  });

  setupResetButton({
    templateName,
    resetEditor: () => {
      editorAPI.updateContent(editorAPI.getInitialData());
    },
    resetIframe: (name) => {
      renderAPI.render(name, editorAPI.getInitialData());
    },
  });

  // Controles de viewport
  setupPreviewViewport();

  // Modal de Copiar y Descargar HTML
  initCopyHtmlModal({ templateName });

  // Todo listo al 100%: desbloquear acciones e interfaz
  markPreviewReady();
}

// Inicialización automática al cargar en navegador
if (typeof window !== "undefined" && typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      initializePreview();
    });
  } else {
    initializePreview();
  }
}
