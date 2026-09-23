/** Shared state for the component library feature. */

export interface LibraryComponent {
  id?: string;
  name: string;
  path: string;
  type?: string;
  variants?: Array<{ id?: string }>;
  props?: Record<string, LibraryProp>;
  _id?: string;
}

export interface LibraryProp {
  default?: string | number | boolean;
  label?: string;
  type?: "boolean" | "select" | "textarea" | "number" | "date" | "text" | string;
  options?: Array<{ value: string; label?: string }>;
}

export type LibraryComponentType = "atoms" | "molecules" | "organisms" | "templates";

export interface LibraryGroup {
  type: LibraryComponentType;
  name: string;
  icon: string;
  itemIcon: string;
  items: LibraryComponent[];
}

export interface LibraryState {
  currentComponent: LibraryComponent | null;
  currentVariant: string | null;
  currentType: string | null;
  formData: Record<string, unknown>;
  allComponents: LibraryComponent[];
}

export function createLibraryState(): LibraryState {
  return {
    currentComponent: null,
    currentVariant: null,
    currentType: null,
    formData: {},
    allComponents: [],
  };
}
