/**
 * @fileoverview Type guard para validar la estructura del manifiesto ESP.
 */

import { ESP_PROFILES } from "../../shared/contracts/constants/esp-contract.ts";
import type { EspManifest, EspManifestLegacy, EspManifestTemplate } from "./types.ts";

function isStringRecord(value: unknown): value is Record<string, string> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  return Object.values(value).every((val) => typeof val === "string");
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isEspManifestLegacy(value: unknown): value is EspManifestLegacy {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.convertible === "boolean" &&
    isStringRecord(candidate.tags) &&
    isStringArray(candidate.issues)
  );
}

function isEspManifestTemplate(value: unknown): value is EspManifestTemplate {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.file === "string" &&
    isStringArray(candidate.requiredVariables) &&
    isStringArray(candidate.intentionalVariables) &&
    isStringRecord(candidate.exampleData) &&
    isEspManifestLegacy(candidate.legacy)
  );
}

/**
 * Valida si un valor arbitrario cumple el contrato de EspManifest.
 *
 * @param value Valor desconocido a validar.
 * @returns true si cumple estrictamente la interfaz EspManifest.
 */
export function isEspManifest(value: unknown): value is EspManifest {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  if (candidate.version !== 1) {
    return false;
  }

  if (!Array.isArray(candidate.profiles)) {
    return false;
  }

  const validProfiles = new Set(Object.keys(ESP_PROFILES));
  const hasValidProfiles = candidate.profiles.every(
    (profile) => typeof profile === "string" && validProfiles.has(profile),
  );
  if (!hasValidProfiles) {
    return false;
  }

  if (
    candidate.templates === null ||
    typeof candidate.templates !== "object" ||
    Array.isArray(candidate.templates)
  ) {
    return false;
  }

  return Object.values(candidate.templates).every(isEspManifestTemplate);
}
