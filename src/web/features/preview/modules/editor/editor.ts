/**
 * @file JSONEditor management for preview
 * Handles template data editing via Vanilla JSONEditor
 */

import { JSONEditor } from "https://cdn.jsdelivr.net/npm/vanilla-jsoneditor@3.11.0/standalone.js";
import { fetchJSON } from "../../../../shared/utils/http-helpers.ts";
import { filterEditorMenuItems } from "./editor-menu-filter.ts";

export type EditorContent = {
  json?: Record<string, unknown>;
  text: string;
};

type EditorConfig = {
  templateName: string;
  container: HTMLElement;
  onChange: (data: Record<string, unknown>) => void;
  onStatusChange: (text: string, textColor: string, dotColor: string) => void;
};

export type EditorAPI = {
  editor: InstanceType<typeof JSONEditor>;
  get: () => EditorContent;
  updateContent: (data: Record<string, unknown>) => void;
  getInitialData: () => Record<string, unknown>;
  setInitialData: (data: Record<string, unknown>) => void;
};

/**
 * @typedef {Object} EditorConfig
 * @property {string} templateName
 * @property {HTMLElement} container - Container for the editor
 * @property {Function} onChange - Callback when JSON changes
 * @property {Function} onStatusChange - Callback for UI status updates
 */

/**
 * Carga bajo demanda la hoja de estilos de tema oscuro para Vanilla JSONEditor.
 *
 * @returns {void}
 */
function ensureJsonEditorDarkTheme() {
  if (typeof document === "undefined") return;
  if (!document.getElementById("jse-theme-dark-css")) {
    const link = document.createElement("link");
    link.id = "jse-theme-dark-css";
    link.rel = "stylesheet";
    link.href = "https://cdn.jsdelivr.net/npm/vanilla-jsoneditor@3.11.0/themes/jse-theme-dark.css";
    document.head.appendChild(link);
  }
}

/**
 * Initialize JSONEditor for template data
 * @param {EditorConfig} config
 * @returns {Promise<Object>} Editor instance and API
 */
export async function initializeEditor(config: EditorConfig): Promise<EditorAPI> {
  const { templateName, container, onChange, onStatusChange } = config;

  ensureJsonEditorDarkTheme();

  let initialData: Record<string, unknown> = {};
  let isFirstChange = true;

  // Clear placeholder skeleton before mounting the editor
  const skeleton = container.querySelector("#editor-skeleton");
  if (skeleton) {
    skeleton.remove();
  }

  // Update container theme based on app theme
  function updateThemeClass() {
    const isDark = document.documentElement.classList.contains("dark");
    container.classList.remove("jse-theme-dark", "jse-theme-default");
    container.classList.add(isDark ? "jse-theme-dark" : "jse-theme-default");
  }

  updateThemeClass();

  // Listen for app theme changes
  window.addEventListener("theme-changed", updateThemeClass);

  // Create editor instance
  const editor: InstanceType<typeof JSONEditor> = new JSONEditor({
    target: container,
    props: {
      mode: "text",
      content: { json: {} },
      onRenderMenu(items, _context) {
        return filterEditorMenuItems(items);
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
    initialData = data as Record<string, unknown>;
    editor.updateProps({ mode: "text", content: { json: data } });
    isFirstChange = true;
  } catch (err) {
    console.error("Error loading template data:", err);
    onStatusChange("Error de red", "text-red-600 font-medium", "bg-red-500");
  }

  return {
    editor,
    get(): EditorContent {
      return editor.get() as EditorContent;
    },
    updateContent(data: Record<string, unknown>): void {
      isFirstChange = true;
      editor.updateProps({ mode: "text", content: { json: data } });
    },
    getInitialData(): Record<string, unknown> {
      return initialData;
    },
    setInitialData(data: Record<string, unknown>): void {
      initialData = data;
    },
  };
}
