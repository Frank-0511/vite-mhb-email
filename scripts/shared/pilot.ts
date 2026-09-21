/**
 * @fileoverview Módulo piloto en TypeScript para validación de la base de ejecución (MHB-29).
 * Demuestra tipado estricto, interfaces, generics y type guards sin emisión al repositorio.
 */

export interface ExecutionEnvironment {
  readonly runtime: "bun" | "node";
  readonly version: string;
  readonly isTypeScriptReady: boolean;
}

export interface MetricSummary<T extends number | string> {
  readonly name: string;
  readonly value: T;
  readonly timestamp: number;
}

/**
 * Valida si un objeto cumple con la interfaz ExecutionEnvironment.
 *
 * @param {unknown} value
 * @returns {value is ExecutionEnvironment}
 */
export function isExecutionEnvironment(value: unknown): value is ExecutionEnvironment {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    (candidate.runtime === "bun" || candidate.runtime === "node") &&
    typeof candidate.version === "string" &&
    typeof candidate.isTypeScriptReady === "boolean"
  );
}

/**
 * Genera una métrica tipada con generic para el sistema de build y auditoría.
 *
 * @template {number | string} T
 * @param {string} name
 * @param {T} value
 * @param {number} [timestamp]
 * @returns {MetricSummary<T>}
 */
export function createMetric<T extends number | string>(
  name: string,
  value: T,
  timestamp: number = Date.now(),
): MetricSummary<T> {
  if (!name.trim()) {
    throw new Error("El nombre de la métrica no puede estar vacío.");
  }
  return {
    name,
    value,
    timestamp,
  };
}

/**
 * Retorna el estado base de ejecución para el tooling TypeScript del proyecto.
 *
 * @returns {ExecutionEnvironment}
 */
export function getExecutionStatus(): ExecutionEnvironment {
  const isBun = typeof process.versions.bun === "string";
  return {
    runtime: isBun ? "bun" : "node",
    version: isBun ? (process.versions.bun as string) : process.version,
    isTypeScriptReady: true,
  };
}
