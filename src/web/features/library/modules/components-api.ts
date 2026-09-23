// Components management module
import { fetchJSON, postText } from "../../../shared/utils/http-helpers.ts";
import type { LibraryComponent, LibraryComponentType, LibraryGroup } from "./state.ts";

export const componentsManager = {
  all: [] as LibraryComponent[],

  async loadAll(): Promise<LibraryComponent[]> {
    try {
      this.all = await fetchJSON<LibraryComponent[]>("/api/components");
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
  getType(path?: string): LibraryComponentType {
    const p = path || "";
    if (p.includes("/atoms/")) return "atoms";
    if (p.includes("/molecules/")) return "molecules";
    if (p.includes("/organisms/")) return "organisms";
    return "templates";
  },

  groupByType(components: LibraryComponent[]): LibraryGroup[] {
    const groups: Record<LibraryComponentType, LibraryGroup> = {
      atoms: { type: "atoms", name: "Atoms", icon: "building-columns", itemIcon: "box", items: [] },
      molecules: {
        type: "molecules",
        name: "Molecules",
        icon: "molecule2",
        itemIcon: "puzzle",
        items: [],
      },
      organisms: {
        type: "organisms",
        name: "Organisms",
        icon: "layers",
        itemIcon: "component",
        items: [],
      },
      templates: {
        type: "templates",
        name: "Templates",
        icon: "package",
        itemIcon: "file-text",
        items: [],
      },
    };

    for (const comp of components) {
      groups[this.getType(comp.path)].items.push(comp);
    }

    return Object.entries(groups)
      .filter(([_, group]) => group.items.length > 0)
      .map(([type, group]) => ({ ...group, type: type as LibraryComponentType }));
  },

  async loadFull(componentId: string): Promise<LibraryComponent | null> {
    try {
      return await fetchJSON<LibraryComponent>(`/api/components/${componentId}`);
    } catch (err) {
      console.error("Error loading component schema:", err);
      return null;
    }
  },

  async render(componentId: string, variant: string, props: Record<string, unknown>) {
    try {
      return await postText(`/api/components/${componentId}/render`, { variant, props });
    } catch (err) {
      console.error("Error rendering component:", err);
      return null;
    }
  },
};
