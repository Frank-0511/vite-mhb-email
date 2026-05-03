/**
 * @file Theme management for preview
 * Handles app theme and template theme toggle
 */

import { queryRequired, querySafe } from "../../shared/dom-helpers.js";

/**
 * Setup template theme toggle button
 * @param {Object} config
 * @param {Function} config.onThemeChange - Callback when theme changes
 * @returns {void}
 */
export function setupTemplateThemeToggle(config) {
  const { onThemeChange } = config;

  const templateToggleBtn = queryRequired("theme-toggle-template", "Theme Manager");
  const templateIconLight = querySafe("template-icon-light");
  const templateIconDark = querySafe("template-icon-dark");

  /**
   * Update template theme UI icons
   */
  function updateUI() {
    const isDark =
      localStorage.getItem("template-theme") === "dark" || !("template-theme" in localStorage);
    if (isDark) {
      if (templateIconLight) templateIconLight.classList.add("hidden");
      if (templateIconDark) templateIconDark.classList.remove("hidden");
    } else {
      if (templateIconLight) templateIconLight.classList.remove("hidden");
      if (templateIconDark) templateIconDark.classList.add("hidden");
    }
  }

  updateUI();

  templateToggleBtn.addEventListener("click", () => {
    const currentTheme = localStorage.getItem("template-theme") || "light";
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    localStorage.setItem("template-theme", newTheme);
    updateUI();
    onThemeChange(newTheme);
  });
}

/**
 * Apply app theme to editor container
 * Call this on app theme changes
 * @param {HTMLElement} editorContainer
 * @returns {void}
 */
export function applyAppThemeToEditor(editorContainer) {
  const isDark = document.documentElement.classList.contains("dark");
  editorContainer.className = isDark ? "jse-theme-dark" : "jse-theme-default";
}
