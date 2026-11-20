/**
 * @fileoverview Resumen en texto plano de los resultados headless de MHB-14.
 * Función pura: recibe los resultados por archivo y viewport y devuelve una
 * tabla de una línea por resultado. No realiza I/O.
 */

/** Viewports que recorre el validador headless. */
export type ViewportName = "desktop" | "mobile";

/** Resultado de renderizar un HTML de dist/ en un viewport concreto. */
export interface EmailRunResult {
  file: string;
  viewport: ViewportName;
  title: string;
  hasDoctype: boolean;
  overflowX: boolean;
  espVarsInText: boolean;
  imagesWithoutAlt: number;
  axeViolations: Array<{ id: string; impact: string | null; nodes: number }>;
  consoleErrors: string[];
  failedRequests: string[];
}

const COLUMNS = [
  "file",
  "viewport",
  "title",
  "doctype",
  "overflowX",
  "espVars",
  "imgNoAlt",
  "axe(id:impact:nodes)",
  "consoleErr",
  "failedReq",
] as const;

/** Formatea las violaciones de axe como `id:impact:nodes`, separadas por comas. */
function formatAxe(violations: EmailRunResult["axeViolations"]): string {
  if (violations.length === 0) return "-";
  return violations
    .map((violation) => `${violation.id}:${violation.impact ?? "none"}:${violation.nodes}`)
    .join(",");
}

/** Convierte un resultado en los valores de una fila, en el orden de COLUMNS. */
function toRow(result: EmailRunResult): string[] {
  return [
    result.file,
    result.viewport,
    result.title === "" ? "-" : result.title,
    result.hasDoctype ? "yes" : "no",
    result.overflowX ? "yes" : "no",
    result.espVarsInText ? "yes" : "no",
    String(result.imagesWithoutAlt),
    formatAxe(result.axeViolations),
    String(result.consoleErrors.length),
    String(result.failedRequests.length),
  ];
}

/** Ajusta cada columna al ancho de su celda más larga y une las filas. */
function renderTable(rows: string[][]): string {
  const widths = COLUMNS.map((column, index) =>
    Math.max(column.length, ...rows.map((row) => row[index]?.length ?? 0)),
  );
  const renderLine = (cells: string[]): string =>
    cells
      .map((cell, index) => cell.padEnd(widths[index] ?? cell.length))
      .join("  ")
      .trimEnd();
  return [renderLine([...COLUMNS]), ...rows.map(renderLine)].join("\n");
}

/**
 * Devuelve una tabla de texto plano con una línea por resultado.
 * @param results Resultados por archivo y viewport, en el orden de ejecución.
 * @returns Tabla con cabecera, lista para imprimir en consola o guardar.
 */
export function summarize(results: EmailRunResult[]): string {
  return renderTable(results.map(toRow));
}
