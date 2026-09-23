/**
 * @fileoverview Type guard para temas de visualización (light / dark).
 * Módulo hoja aislado: sin dependencias ni imports ascendentes.
 */

import { THEME } from "../constants/theme.ts";
import type { Theme } from "../types/theme.ts";
import { createValueGuard } from "./value-guard.ts";

export const isTheme: (value: unknown) => value is Theme = createValueGuard(THEME);
