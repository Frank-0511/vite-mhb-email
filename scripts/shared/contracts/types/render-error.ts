/**
 * @fileoverview Tipos e interfaces de error de renderizado.
 * Módulo hoja con cero runtime: solo declaraciones de tipo.
 */

import type { RENDER_ERROR_CODE, SAFE_RENDER_CAUSE } from "../constants/render-error.ts";

export type RenderErrorCode = (typeof RENDER_ERROR_CODE)[keyof typeof RENDER_ERROR_CODE];

export type SafeRenderCause = (typeof SAFE_RENDER_CAUSE)[keyof typeof SAFE_RENDER_CAUSE];

export interface RenderErrorLocation {
  path: string;
  line?: number;
  column?: number;
}

export interface RenderErrorPayload {
  version: number;
  code: RenderErrorCode;
  message: string;
  cause?: string;
  location?: RenderErrorLocation;
}
