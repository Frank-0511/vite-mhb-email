/**
 * @fileoverview Análisis de compatibilidad con SendGrid Legacy y formateo de etiquetas de sustitución.
 */

import {
  ESP_PROFILES,
  LEGACY_ESP_PROFILE,
  type EspProfile,
} from "../../shared/contracts/constants/esp-contract.ts";
import { extractEspVariablesFromHtml } from "../../validators/dist-baseline/snapshot.ts";
import { findUnsupportedSyntax, type SyntaxViolation } from "./profile-syntax.ts";

export interface LegacyCompatAnalysis {
  violations: SyntaxViolation[];
  collisions: string[];
}

/**
 * Formatea el nombre de una variable como etiqueta de sustitución según el perfil ESP.
 *
 * @param profile Perfil ESP con delimitadores de sustitución configurados.
 * @param name Nombre de la variable ESP.
 * @returns Etiqueta delimitada (p. ej. -variable-).
 */
export function formatSubstitutionTag(profile: EspProfile, name: string): string {
  if (!profile.substitution) {
    throw new Error(`El perfil ${profile.id} no define delimitadores de sustitución`);
  }
  return `${profile.substitution.open}${name}${profile.substitution.close}`;
}

/**
 * Analiza el HTML buscando sintaxis no convertible a legacy y colisiones de texto con etiquetas.
 *
 * @param html Contenido HTML compilado.
 * @returns Violaciones de sintaxis y lista ordenada de etiquetas en colisión.
 */
export function analyzeLegacyCompat(html: string): LegacyCompatAnalysis {
  const legacyProfile = ESP_PROFILES[LEGACY_ESP_PROFILE];
  const violations = findUnsupportedSyntax(html, legacyProfile);

  const variables = extractEspVariablesFromHtml(html);
  const htmlWithoutMustaches = html.replace(/\{\{\{?[\s\S]*?\}?\}\}/g, "");
  const collisionsSet = new Set<string>();

  for (const varName of variables) {
    const tag = formatSubstitutionTag(legacyProfile, varName);
    if (htmlWithoutMustaches.includes(tag)) {
      collisionsSet.add(tag);
    }
  }

  const collisions = Array.from(collisionsSet).sort();
  return { violations, collisions };
}
