/**
 * @fileoverview Análisis de sintaxis ESP del HTML de dist/ contra un perfil (Handlebars o sustitución).
 */

import type { EspProfile } from "../../shared/contracts/constants/esp-contract.ts";

export interface SyntaxViolation {
  token: string;
  reason: string;
  index: number;
}

const MUSTACHE_RE = /\{\{\{?([\s\S]*?)\}?\}\}/g;
const SUBEXPRESSION_RE = /\(\s*([^\s()]+)/g;
const QUOTED_RE = /"[^"]*"|'[^']*'/g;
const FLAT_VARIABLE_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;

/**
 * Devuelve las construcciones `{{ }}` que el perfil ESP no admite.
 *
 * @param html HTML final de dist/.
 * @param profile Perfil con allowlist de bloques y helpers (o de sustitución plana).
 * @returns Lista de violaciones detectadas con su índice y motivo.
 */
export function findUnsupportedSyntax(html: string, profile: EspProfile): SyntaxViolation[] {
  const violations: SyntaxViolation[] = [];
  const blockNames = new Set<string>([...profile.blocks, ...profile.helpers]);
  const helperNames = new Set<string>(profile.helpers);
  const isSubstitution = profile.syntax === "substitution";

  for (const match of html.matchAll(MUSTACHE_RE)) {
    const token = match[0];
    const index = match.index ?? 0;
    const inner = (match[1] ?? "").trim();
    if (inner === "" || inner.startsWith("!")) continue;
    if (inner.startsWith(">")) {
      violations.push({
        token,
        reason: `los partials no están soportados en ${profile.id}`,
        index,
      });
      continue;
    }
    const isOpening = inner.startsWith("#");
    const isClosing = inner.startsWith("/");
    const cleaned = inner.replace(QUOTED_RE, '""');
    const body = isOpening || isClosing ? cleaned.slice(1).trim() : cleaned;
    const parts = body.split(/\s+/);
    const head = parts[0] ?? "";

    if (isSubstitution) {
      if (
        isOpening ||
        isClosing ||
        parts.length > 1 ||
        !FLAT_VARIABLE_RE.test(head) ||
        head === "this"
      ) {
        violations.push({
          token,
          reason: `${profile.id} solo admite variables planas sin lógica ni helpers`,
          index,
        });
      }
      continue;
    }

    if (isOpening || isClosing) {
      if (!blockNames.has(head)) {
        violations.push({
          token,
          reason: `el bloque "${head}" no está en el perfil ${profile.id}`,
          index,
        });
      }
    } else if (head !== "else" && parts.length > 1 && !helperNames.has(head)) {
      violations.push({
        token,
        reason: `el helper "${head}" no está en el perfil ${profile.id}`,
        index,
      });
    }
    for (const sub of body.matchAll(SUBEXPRESSION_RE)) {
      const name = sub[1] ?? "";
      if (!helperNames.has(name)) {
        violations.push({
          token,
          reason: `el helper "${name}" no está en el perfil ${profile.id}`,
          index,
        });
      }
    }
  }
  return violations;
}
