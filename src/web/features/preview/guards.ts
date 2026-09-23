/**
 * @fileoverview Type guards para la feature preview.
 */

import { createValueGuard } from "../../../../scripts/shared/contracts/guards/value-guard.ts";
import { VIEW_MODE, VIEWPORT_MODE } from "./constants.ts";
import type { ViewMode, ViewportMode } from "./types.ts";

export const isViewMode: (value: unknown) => value is ViewMode = createValueGuard(VIEW_MODE);

export const isViewportMode: (value: unknown) => value is ViewportMode =
  createValueGuard(VIEWPORT_MODE);
