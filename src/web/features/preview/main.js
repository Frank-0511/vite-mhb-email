/**
 * @file Preview page entry point
 * Orchestrates template editing, rendering, and data management for preview.html
 *
 * Features:
 * - Live JSON editor with Vanilla JSONEditor
 * - Real-time template rendering via /api/render
 * - Save/reset operations to /api/data
 * - App theme (light/dark) with editor sync
 * - Template theme toggle
 * - Viewport controls (desktop/mobile/custom)
 */

import { queryRequired, querySafe } from "../../shared/utils/dom-helpers.js";
import { fetchJSON } from "../../shared/utils/http-helpers.js";
import { initLucideIcons } from "../../shared/utils/lucide-setup.js";
import "../../shared/utils/theme-toggle-component.js"; // Web Component auto-registers

import { initCopyHtmlModal } from "./copy-html-modal.js";
import { initializeEditor } from "./editor.js";
import { createIframeManager } from "./iframe-manager.js";
import { createRenderAPI } from "./render-api.js";
import { setupResetButton, setupSaveButton } from "./save-reset.js";
import "./styles.css";
import { setupTemplateThemeToggle } from "./theme-manager.js";
import { initViewportControls } from "./viewport-controls.js";

/**
 * Paths that affect all templates and should refresh the active preview.
 * @type {string[]}
 */
const SHARED_EMAIL_SOURCE_PREFIXES = [
  "src/emails/layouts/",
  "src/emails/partials/",
  "src/emails/styles/",
];

/**
 * Determines whether a changed file should refresh the current template preview.
 *
 * @param {string | undefined} changedFile
 * @param {string} templateName
 * @returns {boolean}
 */
function shouldRefreshCurrentTemplate(changedFile, templateName) {
  if (!changedFile || typeof changedFile !== "string") return true;

  const currentTemplatePrefix = `src/emails/templates/${templateName}/`;
  if (changedFile.startsWith(currentTemplatePrefix)) return true;

  if (
    changedFile === "maizzle.config.js" ||
    changedFile === "tailwind.email.config.js" ||
    SHARED_EMAIL_SOURCE_PREFIXES.some((prefix) => changedFile.startsWith(prefix))
  ) {
    return true;
  }

  return false;
}

/**
 * Determines whether the changed file is the current template data source.
 *
 * @param {string | undefined} changedFile
 * @param {string} templateName
 * @returns {boolean}
 */
function isCurrentTemplateDataFile(changedFile, templateName) {
  return changedFile === `src/emails/templates/${templateName}/data.json`;
}

/**
 * Initialize sync status UI
 */
function initSyncStatus() {
  const syncStatus = queryRequired("sync-status", "Preview Module");

  return {
    update(text, textColor, dotColor) {
      syncStatus.className = `text-sm flex items-center gap-1 ${textColor}`;
      syncStatus.innerHTML = `<span class="w-2 h-2 rounded-full ${dotColor}"></span> ${text}`;
    },
  };
}

/**
 * Main preview initialization
 */
async function initializePreview() {
  // Get template name from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const templateName = urlParams.get("template");

  if (!templateName) {
    document.body.innerHTML =
      '<div class="p-8 text-red-500 font-bold">Error: No se especificó un template en la URL. (?template=nombre)</div>';
    throw new Error("No template specified");
  }

  // Initialize Lucide icons
  initLucideIcons();

  // Get DOM elements
  const templateNameEl = queryRequired("template-name", "Preview Module");
  const iframeEl = queryRequired("preview-iframe", "Preview Module");
  const editorContainer = queryRequired("editor-container", "Preview Module");

  templateNameEl.textContent = templateName;

  // Initialize sync status UI
  const syncStatus = initSyncStatus();

  // Initialize iframe manager
  const iframeManager = createIframeManager({
    iframe: iframeEl,
    onSyncStatusChange: (text, textColor, dotColor) => syncStatus.update(text, textColor, dotColor),
  });

  // Initialize render API
  const renderAPI = createRenderAPI({
    onSuccess: (html) => iframeManager.updateContent(html),
    onError: (err) => {
      console.error("Render error:", err);
    },
    onStatusChange: (text, textColor, dotColor) => syncStatus.update(text, textColor, dotColor),
  });

  // Placeholder for debounced render (will be initialized after editor creation)
  let debouncedRender = null;

  // Initialize JSONEditor
  const editorAPI = await initializeEditor({
    templateName,
    container: editorContainer,
    onChange: (_json) => {
      // Debounced render will be set after editor initialization
      if (debouncedRender) debouncedRender();
    },
    onStatusChange: (text, textColor, dotColor) => syncStatus.update(text, textColor, dotColor),
  });

  // Create debounced render function (reuses same timer across onChange calls)
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

  if (import.meta.hot) {
    import.meta.hot.on("email-source-changed", ({ file } = {}) => {
      if (!shouldRefreshCurrentTemplate(file, templateName)) return;

      if (isCurrentTemplateDataFile(file, templateName)) {
        fetchJSON(`/api/data?template=${templateName}`)
          .then((latestData) => {
            editorAPI.setInitialData(latestData);
            editorAPI.updateContent(latestData);
            return renderAPI.render(templateName, latestData);
          })
          .catch((error) => {
            console.error("Auto data reload error:", error);
          });
        return;
      }

      renderAPI
        .invalidateTemplateCache(templateName)
        .catch((error) => {
          console.error("Cache invalidation error:", error);
        })
        .finally(() => {
          renderCurrentTemplate().catch((error) => {
            console.error("Auto render error:", error);
          });
        });
    });
  }

  // Render inicial usando el mismo endpoint que los cambios live.
  await renderCurrentTemplate();

  // Setup template theme toggle
  setupTemplateThemeToggle({
    onThemeChange: () => {
      renderCurrentTemplate().catch((error) => {
        console.error("Theme render error:", error);
      });
    },
  });

  // Setup save and reset buttons
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
    onStatusChange: (text, textColor, dotColor) => syncStatus.update(text, textColor, dotColor),
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

  // Setup viewport controls (desktop/mobile/custom)
  const viewportDesktopBtn = querySafe("viewport-desktop");
  const viewportMobileBtn = querySafe("viewport-mobile");
  const viewportCustomBtn = querySafe("viewport-custom");
  const viewportCustomInputWrap = querySafe("viewport-custom-input-wrap");
  const viewportCustomInput = querySafe("viewport-custom-input");
  const previewFrame = querySafe("preview-frame");
  const viewportWidthIndicator = querySafe("viewport-width-indicator");

  if (
    viewportDesktopBtn &&
    viewportMobileBtn &&
    viewportCustomBtn &&
    previewFrame &&
    viewportWidthIndicator
  ) {
    initViewportControls({
      desktopButton: viewportDesktopBtn,
      mobileButton: viewportMobileBtn,
      customButton: viewportCustomBtn,
      customInputWrap: viewportCustomInputWrap,
      customInput: viewportCustomInput,
      previewFrame,
      widthIndicator: viewportWidthIndicator,
    });
  }

  // Initialize Copy HTML modal
  initCopyHtmlModal({ templateName });
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializePreview);
} else {
  initializePreview();
}
