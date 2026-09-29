/**
 * @fileoverview Contrato ESP: perfiles de sintaxis (Handlebars y etiquetas de sustitución) y formato del manifiesto.
 * Módulo hoja aislado: sin dependencias ni imports ascendentes.
 */

import type { EspProfile } from "../types/esp-contract.ts";

export type { EspProfile, EspProfileId, EspSyntax } from "../types/esp-contract.ts";

export const ESP_PROFILES = {
  sendgrid: {
    id: "sendgrid",
    label: "SendGrid Dynamic Templates",
    syntax: "handlebars",
    blocks: ["if", "unless", "each", "with"],
    helpers: [
      "equals",
      "notEquals",
      "greaterThan",
      "lessThan",
      "and",
      "or",
      "formatDate",
      "insert",
      "length",
    ],
  },
  "sendgrid-legacy": {
    id: "sendgrid-legacy",
    label: "SendGrid Legacy Templates (etiquetas -variable-)",
    syntax: "substitution",
    blocks: [],
    helpers: [],
    substitution: { open: "-", close: "-" },
  },
} as const satisfies Record<string, EspProfile>;

export const DEFAULT_ESP_PROFILE = "sendgrid";
export const LEGACY_ESP_PROFILE = "sendgrid-legacy";
/** Orden fijo de perfiles publicados en el manifiesto. */
export const ESP_MANIFEST_PROFILES = ["sendgrid", "sendgrid-legacy"] as const;

export const ESP_MANIFEST_FILENAME = "esp-manifest.json";
export const ESP_MANIFEST_VERSION = 1;

/** Claves cuyo valor de ejemplo se reemplaza por un placeholder `<clave>` (posibles datos personales). */
export const SENSITIVE_EXAMPLE_KEY_RE = /(email|password|token|phone|(^|_)name$)/i;
/** Valores que contienen esto también se reemplazan por placeholder. */
export const SENSITIVE_EXAMPLE_VALUE_RE = /token/i;
