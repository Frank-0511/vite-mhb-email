/**
 * @file Iframe management for preview
 * Handles iframe content updates and theme synchronization
 */

/**
 * @typedef {Object} IframeManagerConfig
 * @property {HTMLIFrameElement} iframe - The iframe element
 * @property {Function} onSyncStatusChange - Callback for sync status updates
 */

/**
 * Initialize iframe manager
 * @param {IframeManagerConfig} config
 * @returns {Object} iframe manager API
 */
export function createIframeManager(config) {
  const { iframe, onSyncStatusChange } = config;

  /**
   * Update iframe HTML content
   * @param {string} htmlContent - HTML to render in iframe
   * @returns {void}
   */
  function updateContent(htmlContent) {
    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(htmlContent);
    doc.close();

    // Apply template theme if dark
    applyTemplateTheme();

    // Add spacing for preview
    doc.body.style.padding = "32px 0";

    onSyncStatusChange("Sincronizado", "text-green-600 font-medium", "bg-green-500");
  }

  /**
   * Load initial template
   * @param {string} templateName
   * @returns {void}
   */
  function loadTemplate(templateName) {
    iframe.src = `/templates/${templateName}/index.html`;
    iframe.onload = () => {
      applyTemplateTheme();
      iframe.contentWindow.document.body.style.padding = "32px 0";
      checkDarkModeWarning(templateName);
    };
  }

  /**
   * Apply template theme (dark mode) to iframe
   * @returns {void}
   */
  function applyTemplateTheme() {
    const isTemplateDark = localStorage.getItem("template-theme") === "dark";
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
   * Check if dark mode is properly applied and warn if not
   * @returns {void}
   */
  function checkDarkModeWarning() {
    const isTemplateDark = localStorage.getItem("template-theme") === "dark";
    const warning = document.getElementById("dark-mode-warning");

    setTimeout(() => {
      if (
        isTemplateDark &&
        !iframe.contentWindow.document.documentElement.classList.contains("dark")
      ) {
        if (warning) warning.style.display = "block";
      } else {
        if (warning) warning.style.display = "none";
      }
    }, 600);
  }

  /**
   * Toggle template theme
   * @param {string} _templateName - For internal tracking (not critical)
   * @returns {void}
   */
  function toggleTheme(_templateName) {
    const currentTheme = localStorage.getItem("template-theme") || "dark";
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    localStorage.setItem("template-theme", newTheme);
    applyTemplateTheme();
  }

  /**
   * Reset iframe to initial template state
   * @param {string} templateName
   * @returns {void}
   */
  function reset(templateName) {
    loadTemplate(templateName);
    onSyncStatusChange("Sincronizado", "text-green-600 font-medium", "bg-green-500");
  }

  return {
    updateContent,
    loadTemplate,
    applyTemplateTheme,
    toggleTheme,
    reset,
  };
}
