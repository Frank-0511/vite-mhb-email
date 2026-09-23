/** Shared state for the component library feature. */

import type { LibraryState } from "../types.ts";

export function createLibraryState(): LibraryState {
  return {
    currentComponent: null,
    currentVariant: null,
    currentType: null,
    formData: {},
    allComponents: [],
  };
}
