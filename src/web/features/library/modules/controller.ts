/** Controller contract for the component library feature. */

import type { LibraryState } from "../types.ts";

export interface LibraryController {
  readonly state: LibraryState;
  initialize(): Promise<void>;
}

export function createLibraryController(
  state: LibraryState,
  initialize: () => Promise<void>,
): LibraryController {
  return { state, initialize };
}
