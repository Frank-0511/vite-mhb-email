/**
 * @fileoverview Tipos e interfaces para perfiles ESP y sintaxis admitida.
 * Módulo hoja con cero runtime: solo declaraciones de tipo.
 */

import type { ESP_PROFILES } from "../constants/esp-contract.ts";

export type EspSyntax = "handlebars" | "substitution";

export interface EspProfile {
  id: string;
  label: string;
  syntax: EspSyntax;
  /** Bloques `{{#nombre}}` admitidos (vacío en perfiles de sustitución). */
  blocks: readonly string[];
  /** Helpers admitidos: en línea, subexpresión `(helper …)` o bloque `{{#helper}}` (vacío en sustitución). */
  helpers: readonly string[];
  /** Solo `syntax: "substitution"`: delimitadores de etiqueta, p. ej. `-nombre-`. */
  substitution?: { open: string; close: string };
}

export type EspProfileId = keyof typeof ESP_PROFILES;
