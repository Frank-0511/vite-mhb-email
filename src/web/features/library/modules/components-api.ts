// Components management module
import { API_ROUTES } from "../../../../../scripts/shared/contracts/constants/api-routes.ts";
import {
  componentDetailRoute,
  componentRenderRoute,
} from "../../../../../scripts/shared/contracts/routes/api-routes.ts";
import { fetchJSON, postText } from "../../../shared/utils/http-helpers.ts";
import { COMPONENT_TYPE } from "../constants.ts";
import type { LibraryComponent, LibraryComponentType, LibraryGroup } from "../types.ts";

export const componentsManager = {
  all: [] as LibraryComponent[],

  async loadAll(): Promise<LibraryComponent[]> {
    try {
      this.all = await fetchJSON<LibraryComponent[]>(API_ROUTES.COMPONENTS);
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
    if (p.includes(`/${COMPONENT_TYPE.ATOMS}/`)) return COMPONENT_TYPE.ATOMS;
    if (p.includes(`/${COMPONENT_TYPE.MOLECULES}/`)) return COMPONENT_TYPE.MOLECULES;
    if (p.includes(`/${COMPONENT_TYPE.ORGANISMS}/`)) return COMPONENT_TYPE.ORGANISMS;
    return COMPONENT_TYPE.TEMPLATES;
  },

  groupByType(components: LibraryComponent[]): LibraryGroup[] {
    const groups: Record<LibraryComponentType, LibraryGroup> = {
      [COMPONENT_TYPE.ATOMS]: {
        type: COMPONENT_TYPE.ATOMS,
        name: "Atoms",
        icon: "building-columns",
        itemIcon: "box",
        items: [],
      },
      [COMPONENT_TYPE.MOLECULES]: {
        type: COMPONENT_TYPE.MOLECULES,
        name: "Molecules",
        icon: "molecule2",
        itemIcon: "puzzle",
        items: [],
      },
      [COMPONENT_TYPE.ORGANISMS]: {
        type: COMPONENT_TYPE.ORGANISMS,
        name: "Organisms",
        icon: "layers",
        itemIcon: "component",
        items: [],
      },
      [COMPONENT_TYPE.TEMPLATES]: {
        type: COMPONENT_TYPE.TEMPLATES,
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
      return await fetchJSON<LibraryComponent>(componentDetailRoute(componentId));
    } catch (err) {
      console.error("Error loading component schema:", err);
      return null;
    }
  },

  async render(componentId: string, variant: string, props: Record<string, unknown>) {
    try {
      return await postText(componentRenderRoute(componentId), { variant, props });
    } catch (err) {
      console.error("Error rendering component:", err);
      return null;
    }
  },
};
