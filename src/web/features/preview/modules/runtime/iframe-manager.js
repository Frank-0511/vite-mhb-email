/**
 * @file Iframe management for preview
 * Handles iframe content updates and theme synchronization
 */

import {
  isTemplateThemeDark,
  toggleTemplateTheme,
} from "../../../../shared/utils/theme-helpers.js";

/**
 * @typedef {Object} IframeManagerConfig
 * @property {HTMLIFrameElement} iframe - The iframe element
 * @property {HTMLElement | null} [skeleton] - Elemento DOM del skeleton inicial
 * @property {Function} onSyncStatusChange - Callback for sync status updates
 */

/**
 * Initialize iframe manager
 * @param {IframeManagerConfig} config
 * @returns {Object} iframe manager API
 */
export function createIframeManager(config) {
  const { iframe, onSyncStatusChange } = config;
  const skeletonEl =
    config.skeleton !== undefined
      ? config.skeleton
      : typeof document !== "undefined"
        ? document.getElementById("preview-skeleton")
        : null;

  /**
   * Oculta el skeleton inicial del preview y muestra el iframe.
   * @returns {void}
   */
  function hideSkeleton() {
    if (skeletonEl && skeletonEl.classList) {
      skeletonEl.classList.add("hidden");
    }
    if (iframe && iframe.classList) {
      iframe.classList.remove("hidden");
    }
  }

  /**
   * Update iframe HTML content
   * @param {string} htmlContent - HTML to render in iframe
   * @returns {void}
   */
  function updateContent(htmlContent) {
    hideSkeleton();
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(htmlContent);
    doc.close();

    // Apply template theme if dark
    applyTemplateTheme();

    // Add spacing for preview
    if (doc.body) {
      doc.body.style.padding = "32px 0";
    }

    onSyncStatusChange("Sincronizado", "sync-status-ok", "bg-green-500");
  }

  /**
   * Load initial template
   * @param {string} templateName
   * @returns {void}
   */
  function loadTemplate(templateName) {
    hideSkeleton();
    iframe.src = `/templates/${templateName}/index.html`;
    iframe.onload = () => {
      applyTemplateTheme();
      if (iframe.contentWindow?.document?.body) {
        iframe.contentWindow.document.body.style.padding = "32px 0";
      }
    };
  }

  /**
   * Apply template theme (dark mode) to iframe
   * @returns {void}
   */
  function applyTemplateTheme() {
    const isTemplateDark = isTemplateThemeDark();
    const iframeDoc = iframe.contentWindow.document;

    if (isTemplateDark) {
      iframeDoc.documentElement.classList.add("dark");

      // Inject matchMedia dark mode hack for Tailwind
      let hackScript = iframeDoc.getElementById("matchmedia-dark-hack");
      if (!hackScript) {
        hackScript = iframeDoc.createElement("script");
        hackScript.id = "matchmedia-dark-hack";
        hackScript.textContent = `
          (() => {
            const originalMatchMedia = window.matchMedia;
            window.matchMedia = function(query) {
              if (query === '(prefers-color-scheme: dark)') {
                return {
                  matches: true,
                  media: query,
                  onchange: null,
                  addListener: () => {},
                  removeListener: () => {},
                  addEventListener: () => {},
                  removeEventListener: () => {},
                  dispatchEvent: () => false
                };
              }
              return originalMatchMedia.call(window, query);
            };
          })();
        `;
        iframeDoc.head.appendChild(hackScript);
      }
    } else {
      iframeDoc.documentElement.classList.remove("dark");
    }
  }

  /**
   * Toggle template theme
   * @param {string} _templateName - For internal tracking (not critical)
   * @returns {void}
   */
  function toggleTheme(_templateName) {
    toggleTemplateTheme();
    applyTemplateTheme();
  }

  /**
   * Reset iframe to initial template state
   * @param {string} templateName
   * @returns {void}
   */
  function reset(templateName) {
    loadTemplate(templateName);
    onSyncStatusChange("Sincronizado", "sync-status-ok", "bg-green-500");
  }

  return {
    updateContent,
    loadTemplate,
    applyTemplateTheme,
    toggleTheme,
    reset,
    hideSkeleton,
  };
}
