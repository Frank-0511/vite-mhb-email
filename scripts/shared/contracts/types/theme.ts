/**
 * @fileoverview Tipos para el tema de visualización (light / dark).
 * Módulo hoja con cero runtime: solo declaraciones de tipo.
 */

import type { THEME } from "../constants/theme.ts";

export type Theme = (typeof THEME)[keyof typeof THEME];
