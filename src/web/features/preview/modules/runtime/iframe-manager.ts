/**
 * @file Iframe management for preview
 * Handles iframe content updates and theme synchronization
 */

import {
  isTemplateThemeDark,
  toggleTemplateTheme,
} from "../../../../shared/utils/theme-helpers.ts";

type IframeManagerConfig = {
  iframe: HTMLIFrameElement;
  skeleton?: HTMLElement | null;
  onSyncStatusChange: (text: string, textColor: string, dotColor: string) => void;
};

type IframeManager = {
  updateContent: (htmlContent: string) => void;
  loadTemplate: (templateName: string) => void;
  applyTemplateTheme: () => void;
  toggleTheme: (templateName: string) => void;
  reset: (templateName: string) => void;
  hideSkeleton: () => void;
};

function getIframeDocument(iframe: HTMLIFrameElement): Document | null {
  return iframe.contentDocument ?? iframe.contentWindow?.document ?? null;
}

/**
 * Initialize iframe manager
 * @param {IframeManagerConfig} config - Iframe and synchronization callbacks.
 * @returns {IframeManager} iframe manager API
 */
export function createIframeManager(config: IframeManagerConfig): IframeManager {
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
  function updateContent(htmlContent: string): void {
    hideSkeleton();
    const doc = getIframeDocument(iframe);
    if (!doc) return;
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
  function loadTemplate(templateName: string): void {
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
    const iframeDoc = getIframeDocument(iframe);
    if (!iframeDoc) return;

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
  function toggleTheme(_templateName: string): void {
    toggleTemplateTheme();
    applyTemplateTheme();
  }

  /**
   * Reset iframe to initial template state
   * @param {string} templateName
   * @returns {void}
   */
  function reset(templateName: string): void {
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
