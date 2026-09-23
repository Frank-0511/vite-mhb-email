// List renderer module
import {
  ArrowLeft,
  Box,
  Building,
  Component,
  createIcons,
  Dna,
  FileText,
  Layers,
  List,
  Moon,
  Package,
  Puzzle,
  Sun,
} from "lucide";
import type { LibraryComponent, LibraryGroup } from "../types.ts";

export const listRenderer = {
  container: null as HTMLElement | null,
  onComponentSelect: null as ((component: LibraryComponent) => void) | null,

  // Map Tabler icon names to Lucide equivalents
  iconMap: {
    "building-columns": "building",
    molecule2: "dna",
    "arrow-left": "arrow-left",
    "layout-list": "list",
    sun: "sun",
    moon: "moon",
    package: "package",
    box: "box",
    dna: "dna",
  } as Record<string, string>,

  mapIconName(iconName: string): string {
    return this.iconMap[iconName] || iconName;
  },

  init(containerEl: HTMLElement, onSelect: (component: LibraryComponent) => void): void {
    this.container = containerEl;
    this.onComponentSelect = onSelect;
  },

  render(components: LibraryComponent[], groups: LibraryGroup[]): void {
    if (!this.container || !this.onComponentSelect) return;
    this.container.innerHTML = "";

    if (components.length === 0) {
      this.container.innerHTML =
        "<p class='p-4 text-center text-sm text-slate-400 dark:text-slate-600'>No se encontraron componentes</p>";
      return;
    }

    for (const group of groups) {
      const groupDiv = document.createElement("div");
      groupDiv.className = "mb-2";
      groupDiv.dataset.type = group.type;

      const header = document.createElement("button");
      header.className = "component-group-header";
      header.type = "button";

      const toggle = document.createElement("span");
      toggle.className = "inline-flex items-center justify-center w-5 h-5 transition-transform";
      toggle.innerHTML = "▼";
      header.appendChild(toggle);

      const icon = document.createElement("i");
      icon.setAttribute("data-lucide", this.mapIconName(group.icon));
      icon.className = "component-group-header-icon";
      header.appendChild(icon);

      header.appendChild(document.createTextNode(group.name));

      const itemsContainer = document.createElement("div");
      itemsContainer.className = "pl-2 max-h-1000 overflow-hidden transition-all duration-300";

      for (const comp of group.items) {
        const item = document.createElement("button");
        item.className = "component-item";
        item.type = "button";

        const compIcon = document.createElement("i");
        compIcon.setAttribute("data-lucide", this.mapIconName(group.itemIcon));
        compIcon.className = "component-item-icon";

        item.appendChild(compIcon);
        item.appendChild(document.createTextNode(comp.name));
        item.dataset.componentId = comp.id || comp.name;

        item.addEventListener("click", (e) => {
          e.stopPropagation();
          document.querySelectorAll("[data-component-id]").forEach((el) => {
            el.classList.remove("selected");
          });
          item.classList.add("selected");
          this.onComponentSelect?.(comp);
        });

        itemsContainer.appendChild(item);
      }

      header.addEventListener("click", () => {
        toggle.classList.toggle("-rotate-90");
        if (itemsContainer.classList.contains("max-h-0")) {
          itemsContainer.classList.remove("max-h-0");
          itemsContainer.classList.add("max-h-1000");
        } else {
          itemsContainer.classList.remove("max-h-1000");
          itemsContainer.classList.add("max-h-0");
        }
      });

      groupDiv.appendChild(header);
      groupDiv.appendChild(itemsContainer);
      this.container.appendChild(groupDiv);
    }

    // Process any dynamically created Lucide icons
    createIcons({
      icons: {
        Box,
        Dna,
        List,
        Building,
        ArrowLeft,
        Sun,
        Moon,
        Package,
        Layers,
        Puzzle,
        Component,
        FileText,
      },
    });
  },
};
