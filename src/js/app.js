// Main application orchestrator
import { ArrowLeft, createIcons, Dna, List, Moon, Package, Sun } from "lucide";
import { componentsManager } from "./modules/components.js";
import { formRenderer } from "./modules/form-renderer.js";
import { listRenderer } from "./modules/list-renderer.js";
import { previewManager } from "./modules/preview.js";
import { search } from "./modules/search.js";
import { theme } from "./modules/theme.js";

// Initialize Lucide Icons
const initLucideIcons = () => {
  createIcons({
    icons: {
      ArrowLeft,
      List,
      Sun,
      Moon,
      Package,
      Dna,
    },
  });
};

class ComponentLibraryApp {
  constructor() {
    this.currentComponent = null;
    this.currentVariant = null;
    this.formData = {};
    this.allComponents = [];
    this.STORAGE_KEY = "selectedComponentId";
    this.updatePreviewTimeout = null;
  }

  async init() {
    // Initialize Lucide icons
    initLucideIcons();

    // Initialize theme
    theme.init(
      document.getElementById("theme-toggle"),
      document.getElementById("theme-icon-light"),
      document.getElementById("theme-icon-dark"),
    );

    // Initialize preview manager
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
      (key, value) => this.updatePreview(),
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
    const savedComponentId = localStorage.getItem(this.STORAGE_KEY);
    if (savedComponentId) {
      const savedComponent = this.allComponents.find((c) => (c.id || c.name) === savedComponentId);
      if (savedComponent) {
        this.selectComponent(savedComponent);
      }
    }
  }

  async selectComponent(comp) {
    // Load full component schema
    const componentId = comp.id || comp.name;
    const fullSchema = await componentsManager.loadFull(componentId);
    this.currentComponent = fullSchema || comp;
    this.currentComponent._id = componentId;

    // Save selection to localStorage
    localStorage.setItem(this.STORAGE_KEY, componentId);

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
    if (this.updatePreviewTimeout) {
      clearTimeout(this.updatePreviewTimeout);
    }
    await this.renderPreview();
  }

  updatePreview() {
    // Debounce preview rendering to avoid flickering on rapid input changes
    if (this.updatePreviewTimeout) {
      clearTimeout(this.updatePreviewTimeout);
    }

    this.updatePreviewTimeout = setTimeout(() => {
      this.renderPreview();
    }, 300); // Wait 300ms after user stops typing before rendering
  }

  async renderPreview() {
    if (!this.currentComponent || !this.currentVariant) return;

    const componentId = this.currentComponent._id || this.currentComponent.id;
    await previewManager.render(componentId, this.currentVariant, this.formData);

    // Maintain selection highlight in list
    this.maintainSelection();
  }

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

  handleSearch(query) {
    const filtered = this.allComponents.filter((c) => c.name.toLowerCase().includes(query));
    const groups = componentsManager.groupByType(filtered);
    listRenderer.render(filtered, groups);

    // Re-render icons after DOM update
    initLucideIcons();

    // Maintain selection highlight after list re-render
    this.maintainSelection();
  }
}

// Initialize app when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    const app = new ComponentLibraryApp();
    app.init();
  });
} else {
  const app = new ComponentLibraryApp();
  app.init();
}
