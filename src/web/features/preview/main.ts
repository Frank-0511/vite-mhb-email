/**
 * @fileoverview Punto de entrada de la página de preview.
 * Orquesta la edición de plantillas, renderizado en vivo y gestión de datos.
 */

import "../../shared/components/ef-skeleton.ts";
import { queryRequired } from "../../shared/utils/dom-helpers.ts";
import { fetchJSON } from "../../shared/utils/http-helpers.ts";
import { initLucideIcons } from "../../shared/utils/lucide-setup.ts";
import "../../shared/utils/theme-toggle-component.ts";

import { initMobileTabs } from "./modules/controls/mobile-tabs.ts";
import { setupMoreMenu } from "./modules/controls/more-menu.ts";
import { setupTemplateThemeToggle } from "./modules/controls/theme-manager.ts";
import { setupViewModeControls } from "./modules/controls/view-mode-controls.ts";
import { setupPreviewViewport } from "./modules/controls/viewport-controls.ts";
import { initCopyHtmlModal } from "./modules/copy-html/copy-html-modal.ts";
import { initializeEditor } from "./modules/editor/editor.ts";
import { setupResetButton, setupSaveButton } from "./modules/editor/save-reset.ts";
import type { EditorContent } from "./modules/render/render-api.ts";
import { createRenderAPI } from "./modules/render/render-api.ts";
import { createIframeManager } from "./modules/runtime/iframe-manager.ts";
import { setupPreviewHmr } from "./modules/runtime/preview-hmr.ts";
import {
  getTemplateNameFromUrl,
  renderMissingTemplateError,
} from "./modules/runtime/preview-params.ts";
import { markPreviewReady } from "./modules/runtime/preview-ready.ts";
import { createPreviewStatus } from "./modules/runtime/preview-status.ts";
import "./styles.css";

export { getTemplateNameFromUrl, markPreviewReady, renderMissingTemplateError };

/**
 * Orquesta la inicialización de todos los subsistemas del preview.
 *
 * @returns {Promise<void>}
 */
export async function initializePreview(): Promise<void> {
  const templateName = getTemplateNameFromUrl();

  if (templateName === null) {
    renderMissingTemplateError();
    throw new Error("No template specified");
  }
  const activeTemplateName = templateName;

  // Inicializar iconos de Lucide
  initLucideIcons();

  // Menú "más opciones" del editor (abierto por defecto en ≥480px)
  setupMoreMenu();

  // Inicializar navegación por pestañas en móvil
  initMobileTabs();

  // Obtener elementos DOM requeridos
  const templateNameEl = queryRequired("template-name", "Preview Module");
  const iframeEl = queryRequired("preview-iframe", "Preview Module") as HTMLIFrameElement;
  const editorContainer = queryRequired("editor-container", "Preview Module");

  templateNameEl.textContent = activeTemplateName;

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
      iframeManager.hideSkeleton();
      if (viewModeControls) {
        viewModeControls.applyViewMode(viewModeControls.getViewMode());
      }
      markPreviewReady();
    },
    onStatusChange: (text, textColor, dotColor) => previewStatus.sync(text, textColor, dotColor),
  });

  /** @type {(() => void) | null} */
  let debouncedRender: (() => void) | null = null;

  // Inicializar editor JSON
  const editorAPI = await initializeEditor({
    templateName: activeTemplateName,
    container: editorContainer,
    onChange: (_json: Record<string, unknown>) => {
      if (debouncedRender) debouncedRender();
    },
    onStatusChange: (text: string, textColor: string, dotColor: string) =>
      previewStatus.sync(text, textColor, dotColor),
  });

  debouncedRender = renderAPI.createDebouncedRender(activeTemplateName, () => editorAPI.get(), 300);

  /**
   * Renderiza el template con el contenido actual del editor.
   *
   * @returns {Promise<void>}
   */
  async function renderCurrentTemplate() {
    const currentContent: EditorContent = editorAPI.get();
    const data: Record<string, unknown> =
      currentContent.json !== undefined ? currentContent.json : JSON.parse(currentContent.text);

    await renderAPI.render(activeTemplateName, data);
  }

  setupPreviewHmr({
    templateName: activeTemplateName,
    hot: import.meta.hot,
    fetchLatestData: (name: string = activeTemplateName) =>
      fetchJSON<Record<string, unknown>>(`/api/data?template=${name}`),
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
    templateName: activeTemplateName,
    getEditorContent: () => editorAPI.get(),
    setInitialData: (data: Record<string, unknown>) => editorAPI.setInitialData(data),
    resetEditor: () => {
      editorAPI.updateContent(editorAPI.getInitialData());
    },
    resetIframe: (name) => {
      iframeManager.reset(name);
    },
    onStatusChange: (text: string, textColor: string, dotColor: string) =>
      previewStatus.sync(text, textColor, dotColor),
  });

  setupResetButton({
    templateName: activeTemplateName,
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
