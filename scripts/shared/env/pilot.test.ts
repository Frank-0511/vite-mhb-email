/**
 * @fileoverview Pruebas unitarias para el módulo piloto TypeScript (MHB-29).
 */
import { describe, expect, it } from "bun:test";
import { createMetric, getExecutionStatus, isExecutionEnvironment } from "./pilot.ts";

describe("MHB-29 TypeScript Execution Base - Pilot Module", () => {
  it("getExecutionStatus returns a valid ExecutionEnvironment", () => {
    const status = getExecutionStatus();
    expect(isExecutionEnvironment(status)).toBe(true);
    expect(status.isTypeScriptReady).toBe(true);
    expect(["bun", "node"]).toContain(status.runtime);
  });

  it("isExecutionEnvironment correctly rejects invalid values", () => {
    expect(isExecutionEnvironment(null)).toBe(false);
    expect(isExecutionEnvironment(undefined)).toBe(false);
    expect(isExecutionEnvironment("invalid")).toBe(false);
    expect(isExecutionEnvironment({ runtime: "unknown" })).toBe(false);
    expect(isExecutionEnvironment({ runtime: "bun", version: 123 })).toBe(false);
  });

  it("createMetric properly formats generic metric summaries", () => {
    const fixedTime = 1774000000000;
    const numericMetric = createMetric("build_time_ms", 1450, fixedTime);
    expect(numericMetric).toEqual({
      name: "build_time_ms",
      value: 1450,
      timestamp: fixedTime,
    });

    const stringMetric = createMetric("status", "ok", fixedTime);
    expect(stringMetric).toEqual({
      name: "status",
      value: "ok",
      timestamp: fixedTime,
    });
  });

  it("createMetric throws on invalid name", () => {
    expect(() => createMetric("   ", 100)).toThrow("El nombre de la métrica no puede estar vacío.");
  });
});
