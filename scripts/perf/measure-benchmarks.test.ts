import { describe, expect, test } from "bun:test";
import type { BenchmarkResult, EnvironmentInfo } from "./measure-benchmarks.ts";
import { computeStats, formatMarkdownTable, getEnvironmentInfo } from "./measure-benchmarks.ts";

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
          runtime: "Bun",
          command: "bun test",
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
});
