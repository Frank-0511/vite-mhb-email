/**
 * @fileoverview Type guards para la biblioteca de componentes.
 */

import { createValueGuard } from "../../../../scripts/shared/contracts/guards/value-guard.ts";
import { COMPONENT_TYPE } from "./constants.ts";
import type { LibraryComponentType } from "./types.ts";

export const isComponentType: (value: unknown) => value is LibraryComponentType =
  createValueGuard(COMPONENT_TYPE);
