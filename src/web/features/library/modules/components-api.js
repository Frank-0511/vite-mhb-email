// Components management module
export const componentsManager = {
  all: [],

  async loadAll() {
    try {
      const response = await fetch("/api/components");
      this.all = await response.json();
      return this.all;
    } catch (err) {
      console.error("Error loading components:", err);
      return [];
    }
  },

  /**
   * Derive the atomic design category from a component's file path.
   * Falls back to "templates" for paths outside the atoms/molecules/organisms
   * folders (e.g. `/templates/`), matching the group's visible "Templates" name.
   * @param {string} [path] - Component file path
   * @returns {"atoms"|"molecules"|"organisms"|"templates"}
   */
  getType(path) {
    const p = path || "";
    if (p.includes("/atoms/")) return "atoms";
    if (p.includes("/molecules/")) return "molecules";
    if (p.includes("/organisms/")) return "organisms";
    return "templates";
  },

  groupByType(components) {
    const groups = {
      atoms: { name: "Atoms", icon: "building-columns", itemIcon: "box", items: [] },
      molecules: { name: "Molecules", icon: "molecule2", itemIcon: "puzzle", items: [] },
      organisms: { name: "Organisms", icon: "layers", itemIcon: "component", items: [] },
      templates: { name: "Templates", icon: "package", itemIcon: "file-text", items: [] },
    };

    for (const comp of components) {
      groups[this.getType(comp.path)].items.push(comp);
    }

    return Object.entries(groups)
      .filter(([_, group]) => group.items.length > 0)
      .map(([type, group]) => ({ type, ...group }));
  },

  async loadFull(componentId) {
    try {
      const response = await fetch(`/api/components/${componentId}`);
      return await response.json();
    } catch (err) {
      console.error("Error loading component schema:", err);
      return null;
    }
  },

  async render(componentId, variant, props) {
    try {
      const response = await fetch(`/api/components/${componentId}/render`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variant, props }),
      });
      return await response.text();
    } catch (err) {
      console.error("Error rendering component:", err);
      return null;
    }
  },
};
