/**
 * @file JSONEditor management for preview
 * Handles template data editing via Vanilla JSONEditor
 */

import { JSONEditor } from "https://cdn.jsdelivr.net/npm/vanilla-jsoneditor@3.11.0/standalone.js";
import { fetchJSON } from "../../shared/http-helpers.js";

/**
 * @typedef {Object} EditorConfig
 * @property {string} templateName
 * @property {HTMLElement} container - Container for the editor
 * @property {Function} onChange - Callback when JSON changes
 * @property {Function} onStatusChange - Callback for UI status updates
 */

/**
 * Initialize JSONEditor for template data
 * @param {EditorConfig} config
 * @returns {Promise<Object>} Editor instance and API
 */
export async function initializeEditor(config) {
  const { templateName, container, onChange, onStatusChange } = config;

  let editor = null;
  let initialData = {};
  let isFirstChange = true;

  // Update container theme based on app theme
  function updateThemeClass() {
    const isDark = document.documentElement.classList.contains("dark");
    container.className = isDark ? "jse-theme-dark" : "jse-theme-default";
  }

  updateThemeClass();

  // Listen for app theme changes
  window.addEventListener("theme-changed", updateThemeClass);

  // Create editor instance
  editor = new JSONEditor({
    target: container,
    props: {
      content: { json: {} },
      onRenderMenu(items, _context) {
        // Filter out 'table' mode which doesn't work with single objects
        function filterTable(itemList) {
          return itemList
            .filter((item) => item.text !== "table" && item.value !== "table")
            .map((item) => {
              if (item.items) {
                return { ...item, items: filterTable(item.items) };
              }
              return item;
            });
        }
        return filterTable(items);
      },
      onChange: (updatedContent, _previousContent, { contentErrors }) => {
        if (isFirstChange) {
          isFirstChange = false;
          return;
        }

        if (contentErrors && contentErrors.length > 0) {
          onStatusChange("JSON Inválido...", "text-yellow-600 font-medium", "bg-yellow-500");
          return;
        }

        try {
          const json =
            updatedContent.json !== undefined
              ? updatedContent.json
              : JSON.parse(updatedContent.text);
          onChange(json);
        } catch {
          onStatusChange("JSON Inválido...", "text-yellow-600 font-medium", "bg-yellow-500");
        }
      },
    },
  });

  // Load initial data
  try {
    const data = await fetchJSON(`/api/data?template=${templateName}`);
    initialData = data;
    editor.updateProps({ content: { json: data } });
    isFirstChange = true;
  } catch (err) {
    console.error("Error loading template data:", err);
    onStatusChange("Error de red", "text-red-600 font-medium", "bg-red-500");
  }

  return {
    editor,
    get() {
      return editor.get();
    },
    updateContent(data) {
      isFirstChange = true;
      editor.updateProps({ content: { json: data } });
    },
    getInitialData() {
      return initialData;
    },
    setInitialData(data) {
      initialData = data;
    },
  };
}
