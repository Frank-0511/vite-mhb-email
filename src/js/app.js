// Main application orchestrator
import { ArrowLeft, Box, Building, createIcons, Dna, List, Moon, Package, Sun } from "lucide";
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
      Box,
      Building,
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
  }

  async selectComponent(comp) {
    // Load full component schema
    const componentId = comp.id || comp.name;
    const fullSchema = await componentsManager.loadFull(componentId);
    this.currentComponent = fullSchema || comp;
    this.currentComponent._id = componentId;

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

    // Show preview and render
    previewManager.show();
    this.updatePreview();
  }

  async updatePreview() {
    if (!this.currentComponent || !this.currentVariant) return;

    const componentId = this.currentComponent._id || this.currentComponent.id;
    await previewManager.render(componentId, this.currentVariant, this.formData);
  }

  handleSearch(query) {
    const filtered = this.allComponents.filter((c) => c.name.toLowerCase().includes(query));
    const groups = componentsManager.groupByType(filtered);
    listRenderer.render(filtered, groups);

    // Re-render icons after DOM update
    initLucideIcons();
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
