/**
 * @fileoverview Type guard y validación runtime para DistSnapshot (límite externo).
 */

export interface TemplateSnapshot {
  sha256: string;
  espVariables: string[];
}

export interface DistSnapshot {
  version: 1;
  templates: Record<string, TemplateSnapshot>;
}

/**
 * Valida si un objeto desconocido cumple el contrato DistSnapshot v1.
 *
 * @param {unknown} data
 * @returns {data is DistSnapshot}
 */
export function isDistSnapshot(data: unknown): data is DistSnapshot {
  if (typeof data !== "object" || data === null) return false;

  const candidate = data as Record<string, unknown>;
  if (candidate.version !== 1) return false;
  if (
    typeof candidate.templates !== "object" ||
    candidate.templates === null ||
    Array.isArray(candidate.templates)
  ) {
    return false;
  }

  const templates = candidate.templates as Record<string, unknown>;
  for (const [key, value] of Object.entries(templates)) {
    if (typeof key !== "string" || key.length === 0) return false;
    if (typeof value !== "object" || value === null || Array.isArray(value)) return false;

    const t = value as Record<string, unknown>;
    if (typeof t.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(t.sha256)) return false;
    if (!Array.isArray(t.espVariables) || !t.espVariables.every((v) => typeof v === "string")) {
      return false;
    }
  }

  return true;
}

/**
 * Asegura que los datos correspondan a un DistSnapshot válido, lanzando error descriptivo.
 *
 * @param {unknown} data
 * @returns {asserts data is DistSnapshot}
 */
export function assertDistSnapshot(data: unknown): asserts data is DistSnapshot {
  if (!isDistSnapshot(data)) {
    throw new Error(
      "El archivo de baseline no tiene un formato DistSnapshot válido (se requiere version: 1 y templates con sha256 y espVariables).",
    );
  }
}
