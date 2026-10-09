import { describe, expect, spyOn, test } from "bun:test";
import type { BenchmarkResult, BenchmarkSpec, EnvironmentInfo } from "./benchmark-runner.ts";
import { computeStats, filterTasksForEnvironment, getEnvironmentInfo } from "./benchmark-runner.ts";
import { formatMarkdownTable } from "./benchmark-formatter.ts";
import { BENCHMARK_TASKS } from "./measure-benchmarks.ts";

describe("measure-benchmarks", () => {
  describe("computeStats", () => {
    test("handles empty samples", () => {
      const stats = computeStats([]);
      expect(stats).toEqual({ minMs: 0, maxMs: 0, medianMs: 0, meanMs: 0 });
    });

    test("computes correct stats for odd number of samples", () => {
      const stats = computeStats([100.2, 50.4, 200.8]);
      expect(stats.minMs).toBe(50);
      expect(stats.maxMs).toBe(201);
      expect(stats.medianMs).toBe(100);
      expect(stats.meanMs).toBe(117);
    });

    test("computes correct stats for even number of samples", () => {
      const stats = computeStats([100, 200, 300, 400]);
      expect(stats.minMs).toBe(100);
      expect(stats.maxMs).toBe(400);
      expect(stats.medianMs).toBe(250);
      expect(stats.meanMs).toBe(250);
    });
  });

  describe("getEnvironmentInfo", () => {
    test("returns non-empty environment object", () => {
      const env = getEnvironmentInfo();
      expect(env.os).toBeDefined();
      expect(env.arch).toBeDefined();
      expect(env.nodeVersion).toBeDefined();
      expect(env.timestamp).toBeDefined();
    });
  });

  describe("formatMarkdownTable", () => {
    test("formats markdown table correctly", () => {
      const env: EnvironmentInfo = {
        os: "Darwin 25.6.0",
        arch: "arm64",
        cpuModel: "Apple M3",
        nodeVersion: "v22.23.1",
        bunVersion: "1.3.13",
        gitCommit: "619a425",
        timestamp: "2026-09-20T20:00:00.000Z",
      };

      const results: BenchmarkResult[] = [
        {
          name: "Test Task",
          runtime: "Node.js",
          command: "node ./node_modules/vitest/vitest.mjs run",
          iterations: 3,
          minMs: 50,
          maxMs: 60,
          medianMs: 55,
          meanMs: 55,
          samples: [50, 55, 60],
        },
      ];

      const md = formatMarkdownTable(env, results);
      expect(md).toContain("Mediciones de Rendimiento (Benchmark)");
      expect(md).toContain("Apple M3");
      expect(md).toContain("Test Task");
      expect(md).toContain("55 ms");
      expect(md).toContain("[50 - 60] ms");
    });
  });

  describe("filterTasksForEnvironment", () => {
    test("omite tareas con runtime Bun cuando bunVersion es unknown", () => {
      const tasks: BenchmarkSpec[] = [
        { name: "Task 1", runtime: "Bun", command: "bun foo" },
        { name: "Task 2", runtime: "Node.js", command: "node bar" },
        { name: "Task 3", runtime: "Bun", command: "bun baz" },
      ];
      const env: EnvironmentInfo = {
        os: "Linux",
        arch: "x64",
        cpuModel: "CPU",
        nodeVersion: "v24.0.0",
        bunVersion: "unknown",
        gitCommit: "abc",
        timestamp: "2026-10-09T00:00:00.000Z",
      };

      const spy = spyOn(console, "log").mockImplementation(() => {});
      const filtered = filterTasksForEnvironment(tasks, env);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe("Task 2");
      expect(spy).toHaveBeenCalledWith("Bun no disponible: se omiten 2 tareas");
      spy.mockRestore();
    });

    test("mantiene todas las tareas cuando bunVersion está disponible", () => {
      const tasks: BenchmarkSpec[] = [
        { name: "Task 1", runtime: "Bun", command: "bun foo" },
        { name: "Task 2", runtime: "Node.js", command: "node bar" },
      ];
      const env: EnvironmentInfo = {
        os: "Linux",
        arch: "x64",
        cpuModel: "CPU",
        nodeVersion: "v24.0.0",
        bunVersion: "1.3.13",
        gitCommit: "abc",
        timestamp: "2026-10-09T00:00:00.000Z",
      };

      const filtered = filterTasksForEnvironment(tasks, env);
      expect(filtered).toHaveLength(2);
    });
  });

  describe("BENCHMARK_TASKS", () => {
    test("Unit Test Suite usa Node.js y vitest", () => {
      const unitTestTask = BENCHMARK_TASKS.find((t) => t.name === "Unit Test Suite");
      expect(unitTestTask).toBeDefined();
      expect(unitTestTask?.runtime).toBe("Node.js");
      expect(unitTestTask?.command).toBe("node ./node_modules/vitest/vitest.mjs run");
    });
  });
});
