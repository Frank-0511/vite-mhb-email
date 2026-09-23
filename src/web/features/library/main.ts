/**
 * @file Component Library page entry point
 * Handles component selection, preview rendering, and form management for components-library.html
 */

import { queryRequired, querySafe } from "../../shared/utils/dom-helpers.ts";
import { debounce } from "../../shared/utils/http-helpers.ts";
import { initLucideIcons } from "../../shared/utils/lucide-setup.ts";
import { STORAGE_KEY_SELECTED_COMPONENT } from "../../shared/utils/storage-keys.ts";
import "../../shared/utils/theme-toggle-component.ts"; // Web Component auto-registers
import { componentsManager } from "./modules/components-api.ts";
import { formRenderer } from "./modules/form-renderer.ts";
import { listRenderer } from "./modules/list-renderer.ts";
import { previewManager } from "./modules/preview.ts";
import { search } from "./modules/search.ts";
import { createLibraryController, type LibraryController } from "./modules/controller.ts";
import { createLibraryState, type LibraryComponent, type LibraryState } from "./modules/state.ts";
import "./styles/library.css";

/**
 * @class ComponentLibraryApp
 * Manages the component library UI and state
 */
class ComponentLibraryApp {
  currentComponent: LibraryComponent | null;
  currentVariant: string | null;
  currentType: string | null;
  formData: Record<string, unknown>;
  allComponents: LibraryComponent[];
  updatePreview: () => void;

  constructor() {
    const state = createLibraryState();
    this.currentComponent = state.currentComponent;
    this.currentVariant = state.currentVariant;
    this.currentType = state.currentType;
    this.formData = state.formData;
    this.allComponents = state.allComponents;

    // Debounced preview updater
    this.updatePreview = debounce(() => {
      this.renderPreview();
    }, 300);
  }

  /**
   * Initialize the component library UI
   * @async
   * @returns {Promise<void>}
   */
  async init(): Promise<void> {
    // Initialize Lucide icons
    initLucideIcons();

    // Preview manager is initialized by themeToggleComponent
    // which handles theme management across pages
    previewManager.init(
      /** @type {HTMLIFrameElement} */ queryRequired("preview-iframe", "ComponentLibrary"),
      queryRequired("empty-preview", "ComponentLibrary"),
      queryRequired("preview-skeleton", "ComponentLibrary"),
    );

    // Initialize list renderer
    listRenderer.init(
      queryRequired("component-list", "ComponentLibrary"),
      (comp: LibraryComponent) => this.selectComponent(comp),
    );

    // Initialize form renderer
    formRenderer.init(
      queryRequired("form-container", "ComponentLibrary"),
      queryRequired("form-placeholder", "ComponentLibrary"),
      () => this.updatePreview(),
      (variant: string) => {
        this.currentVariant = variant;
        this.updatePreview();
      },
    );

    // Initialize search
    search.init(
      /** @type {HTMLInputElement} */ queryRequired("search-input", "ComponentLibrary"),
      (query: string) => this.handleSearch(query),
    );

    // Load components
    this.allComponents = await componentsManager.loadAll();
    const groups = componentsManager.groupByType(this.allComponents);
    listRenderer.render(this.allComponents, groups);

    // Re-render icons after DOM update
    initLucideIcons();

    // Restore previously selected component if exists
    const savedComponentId = localStorage.getItem(STORAGE_KEY_SELECTED_COMPONENT);
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
  async selectComponent(comp: LibraryComponent): Promise<void> {
    // Reveal the loading skeleton immediately: schema and render are two
    // sequential fetches, and the previous component must not linger on
    // screen while either of them is in flight. Its shape reflects the
    // component's atomic design category.
    this.currentType = componentsManager.getType(comp.path);
    previewManager.showSkeleton(this.currentType);

    // Load full component schema
    const componentId = comp.id || comp.name;
    const fullSchema = await componentsManager.loadFull(componentId);
    this.currentComponent = fullSchema || comp;
    this.currentComponent._id = componentId;

    // Save selection to localStorage
    localStorage.setItem(STORAGE_KEY_SELECTED_COMPONENT, componentId);

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

    // Render the newly selected component; previewManager.render() hides the
    // skeleton (shown above) once the compiled HTML is ready
    await this.renderPreview(true);
  }

  /**
   * Render component preview
   * @async
   * @param {boolean} [showLoading] - Show the loading skeleton (component
   *   switch) instead of updating silently (prop edits)
   * @returns {Promise<void>}
   */
  async renderPreview(showLoading = false) {
    if (!this.currentComponent || !this.currentVariant) return;

    const componentId = this.currentComponent._id || this.currentComponent.id;
    await previewManager.render(componentId, this.currentVariant, this.formData, {
      showLoading,
      type:
        this.currentType === "atoms" ||
        this.currentType === "molecules" ||
        this.currentType === "organisms" ||
        this.currentType === "templates"
          ? this.currentType
          : undefined,
    });

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
      const el = item as HTMLElement;
      if (el.dataset.componentId === componentId) {
        el.classList.add("selected");
      } else {
        el.classList.remove("selected");
      }
    });
  }

  /**
   * Handle search query updates
   * @param {string} query - Search query
   * @returns {void}
   */
  handleSearch(query: string): void {
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

  getState(): LibraryState {
    return {
      currentComponent: this.currentComponent,
      currentVariant: this.currentVariant,
      currentType: this.currentType,
      formData: this.formData,
      allComponents: this.allComponents,
    };
  }
}

/**
 * Boot shared preview assets and start the component library
 * only when the library DOM is present
 */
function initializeComponentLibraryApp(): void {
  initLucideIcons();

  if (!querySafe("component-list")) return;

  const app = new ComponentLibraryApp();
  const controller: LibraryController = createLibraryController(app.getState(), () => app.init());
  controller.initialize().catch((error) => {
    console.error("Error initializing component library:", error);
  });
}

// Initialize app when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeComponentLibraryApp);
} else {
  initializeComponentLibraryApp();
}
