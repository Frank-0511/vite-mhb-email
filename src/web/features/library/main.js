/**
 * @file Component Library page entry point
 * Handles component selection, preview rendering, and form management for components-library.html
 */

import { initLucideIcons } from "../../shared/lucide-setup.js";
import "../../shared/theme-toggle-component.js"; // Web Component auto-registers
import { componentsManager } from "./components-api.js";
import { formRenderer } from "./form-renderer.js";
import { listRenderer } from "./list-renderer.js";
import { previewManager } from "./preview.js";
import { search } from "./search.js";
import "./styles.css";

// Storage key for selected component
const STORAGE_KEY = "selectedComponentId";

// Debounce timeout for preview rendering
let updatePreviewTimeout = null;

/**
 * @class ComponentLibraryApp
 * Manages the component library UI and state
 */
class ComponentLibraryApp {
  constructor() {
    this.currentComponent = null;
    this.currentVariant = null;
    this.formData = {};
    this.allComponents = [];
  }

  /**
   * Initialize the component library UI
   * @async
   * @returns {Promise<void>}
   */
  async init() {
    // Initialize Lucide icons
    initLucideIcons();

    // Preview manager is initialized by themeToggleComponent
    // which handles theme management across pages
    previewManager.init(
      document.getElementById("preview-iframe"),
      document.getElementById("empty-preview"),
    );

    // Initialize list renderer
    listRenderer.init(document.getElementById("component-list"), (comp) =>
      this.selectComponent(comp),
    );

    // Initialize form renderer
    formRenderer.init(
      document.getElementById("form-container"),
      document.getElementById("form-placeholder"),
      () => this.updatePreview(),
      (variant) => {
        this.currentVariant = variant;
        this.updatePreview();
      },
    );

    // Initialize search
    search.init(document.getElementById("search-input"), (query) => this.handleSearch(query));

    // Load components
    this.allComponents = await componentsManager.loadAll();
    const groups = componentsManager.groupByType(this.allComponents);
    listRenderer.render(this.allComponents, groups);

    // Re-render icons after DOM update
    initLucideIcons();

    // Restore previously selected component if exists
    const savedComponentId = localStorage.getItem(STORAGE_KEY);
    if (savedComponentId) {
      const savedComponent = this.allComponents.find((c) => (c.id || c.name) === savedComponentId);
      if (savedComponent) {
        this.selectComponent(savedComponent);
      }
    }
  }

  /**
   * Select a component and populate form
   * @async
   * @param {Object} comp - Component object
   * @returns {Promise<void>}
   */
  async selectComponent(comp) {
    // Load full component schema
    const componentId = comp.id || comp.name;
    const fullSchema = await componentsManager.loadFull(componentId);
    this.currentComponent = fullSchema || comp;
    this.currentComponent._id = componentId;

    // Save selection to localStorage
    localStorage.setItem(STORAGE_KEY, componentId);

    // Initialize variant
    if (this.currentComponent.variants && this.currentComponent.variants.length > 0) {
      this.currentVariant = this.currentComponent.variants[0].id || "v1";
    } else {
      this.currentVariant = "v1";
    }

    // Initialize form data
    this.formData = {};
    for (const [key, prop] of Object.entries(this.currentComponent.props || {})) {
      this.formData[key] = prop.default;
    }

    // Render form
    formRenderer.render(this.currentComponent, this.formData);

    // Re-render icons after DOM update
    initLucideIcons();

    // Show preview and render immediately
    previewManager.show();
    if (updatePreviewTimeout) {
      clearTimeout(updatePreviewTimeout);
    }
    await this.renderPreview();
  }

  /**
   * Update preview with debouncing to avoid flickering
   * @returns {void}
   */
  updatePreview() {
    // Debounce preview rendering to avoid flickering on rapid input changes
    if (updatePreviewTimeout) {
      clearTimeout(updatePreviewTimeout);
    }

    updatePreviewTimeout = setTimeout(() => {
      this.renderPreview();
    }, 300); // Wait 300ms after user stops typing before rendering
  }

  /**
   * Render component preview
   * @async
   * @returns {Promise<void>}
   */
  async renderPreview() {
    if (!this.currentComponent || !this.currentVariant) return;

    const componentId = this.currentComponent._id || this.currentComponent.id;
    await previewManager.render(componentId, this.currentVariant, this.formData);

    // Maintain selection highlight in list
    this.maintainSelection();
  }

  /**
   * Maintain visual selection state in component list
   * @returns {void}
   */
  maintainSelection() {
    if (!this.currentComponent) return;
    const componentId = this.currentComponent._id || this.currentComponent.id;
    const allItems = document.querySelectorAll("[data-component-id]");
    allItems.forEach((item) => {
      if (item.dataset.componentId === componentId) {
        item.classList.add("selected");
      } else {
        item.classList.remove("selected");
      }
    });
  }

  /**
   * Handle search query updates
   * @param {string} query - Search query
   * @returns {void}
   */
  handleSearch(query) {
    const filtered = this.allComponents.filter((c) =>
      c.name.toLowerCase().includes(query.toLowerCase()),
    );
    const groups = componentsManager.groupByType(filtered);
    listRenderer.render(filtered, groups);

    // Re-render icons after DOM update
    initLucideIcons();

    // Maintain selection highlight after list re-render
    this.maintainSelection();
  }
}

/**
 * Boot shared preview assets and start the component library
 * only when the library DOM is present
 *
 * @returns {void}
 */
function initializeComponentLibraryApp() {
  initLucideIcons();

  if (!document.getElementById("component-list")) return;

  const app = new ComponentLibraryApp();
  app.init().catch((error) => {
    console.error("Error initializing component library:", error);
  });
}

// Initialize app when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeComponentLibraryApp);
} else {
  initializeComponentLibraryApp();
}
