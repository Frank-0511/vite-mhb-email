/**
 * @fileoverview Tipos de la feature preview.
 * Módulo hoja con cero runtime: solo declaraciones de tipo.
 */

import type { EXPORT_MODE, MODAL_STATE, VIEW_MODE, VIEWPORT_MODE } from "./constants.ts";

export type ViewMode = (typeof VIEW_MODE)[keyof typeof VIEW_MODE];

export type ViewportMode = (typeof VIEWPORT_MODE)[keyof typeof VIEWPORT_MODE];

export type ModalState = (typeof MODAL_STATE)[keyof typeof MODAL_STATE];

export type ExportMode = (typeof EXPORT_MODE)[keyof typeof EXPORT_MODE];
