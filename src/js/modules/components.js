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

  groupByType(components) {
    const groups = {
      atoms: { name: "Atoms", icon: "building-columns", items: [] },
      molecules: { name: "Molecules", icon: "molecule2", items: [] },
      organisms: { name: "Organisms", icon: "dna", items: [] },
      other: { name: "Others", icon: "package", items: [] },
    };

    for (const comp of components) {
      const path = comp.path || "";
      let type = "other";

      if (path.includes("/atoms/")) type = "atoms";
      else if (path.includes("/molecules/")) type = "molecules";
      else if (path.includes("/organisms/")) type = "organisms";

      groups[type].items.push(comp);
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
