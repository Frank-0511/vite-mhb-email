/**
 * @fileoverview Type guards para errores de renderizado.
 * Módulo hoja aislado: sin dependencias ni imports ascendentes.
 */

import { RENDER_ERROR_CODE, SAFE_RENDER_CAUSE } from "../constants/render-error.ts";
import type { RenderErrorCode, SafeRenderCause } from "../types/render-error.ts";
import { createValueGuard } from "./value-guard.ts";

export const isRenderErrorCode: (value: unknown) => value is RenderErrorCode =
  createValueGuard(RENDER_ERROR_CODE);

export const isSafeRenderCause: (value: unknown) => value is SafeRenderCause =
  createValueGuard(SAFE_RENDER_CAUSE);
