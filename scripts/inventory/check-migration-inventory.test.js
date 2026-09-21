/**
 * @fileoverview Pruebas unitarias para el control determinista de inventario de migración.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "bun:test";
import {
  checkInventory,
  formatInventoryReport,
  matchesLayer,
} from "./check-migration-inventory.js";

describe("check-migration-inventory (MHB-29)", () => {
  describe("matchesLayer", () => {
    it("clasifica correctamente rutas del núcleo y validadores (layer-1-core)", () => {
      expect(matchesLayer("scripts/shared/paths.js", "layer-1-core")).toBe(true);
      expect(matchesLayer("scripts/build/build.js", "layer-1-core")).toBe(true);
      expect(matchesLayer("scripts/esp/esp-extractor.js", "layer-1-core")).toBe(true);
      expect(matchesLayer("scripts/validators/validate-email-html.js", "layer-1-core")).toBe(true);
      expect(matchesLayer("src/emails/partials/organisms/hero/index.test.js", "layer-1-core")).toBe(
        true,
      );
      expect(matchesLayer("scripts/cli/cli.js", "layer-1-core")).toBe(false);
    });

    it("clasifica correctamente rutas de CLI, export y mail (layer-2-cli)", () => {
      expect(matchesLayer("scripts/cli/cli.js", "layer-2-cli")).toBe(true);
      expect(matchesLayer("scripts/export/renderers.js", "layer-2-cli")).toBe(true);
      expect(matchesLayer("scripts/generators/archetypes.js", "layer-2-cli")).toBe(true);
      expect(matchesLayer("scripts/mail/send-inbox.js", "layer-2-cli")).toBe(true);
      expect(matchesLayer("scripts/vite/api/templates.js", "layer-2-cli")).toBe(false);
    });

    it("clasifica correctamente rutas de servidor Vite y APIs (layer-3-vite)", () => {
      expect(matchesLayer("scripts/vite/api/templates.js", "layer-3-vite")).toBe(true);
      expect(matchesLayer("scripts/vite/plugins/dashboard.js", "layer-3-vite")).toBe(true);
      expect(matchesLayer("vite.config.js", "layer-3-vite")).toBe(true);
      expect(matchesLayer("src/web/features/home/main.js", "layer-3-vite")).toBe(false);
    });

    it("clasifica correctamente rutas del dashboard web (layer-4-web)", () => {
      expect(matchesLayer("src/web/features/home/main.js", "layer-4-web")).toBe(true);
      expect(matchesLayer("src/web/features/preview/editor.js", "layer-4-web")).toBe(true);
      expect(matchesLayer("src/web/shared/utils/dom.js", "layer-4-web")).toBe(true);
      expect(matchesLayer("scripts/ai/agents-sync.mjs", "layer-4-web")).toBe(false);
    });

    it("clasifica correctamente automatizaciones AI, perf, inventario y configs (layer-5-tooling)", () => {
      expect(matchesLayer("scripts/ai/check-task-branch.mjs", "layer-5-tooling")).toBe(true);
      expect(matchesLayer("scripts/perf/measure-benchmarks.js", "layer-5-tooling")).toBe(true);
      expect(
        matchesLayer("scripts/inventory/check-migration-inventory.js", "layer-5-tooling"),
      ).toBe(true);
      expect(matchesLayer("tailwind.config.js", "layer-5-tooling")).toBe(true);
      expect(matchesLayer("maizzle.config.js", "layer-5-tooling")).toBe(true);
      expect(matchesLayer("eslint.config.js", "layer-5-tooling")).toBe(true);
    });
  });

  describe("checkInventory y formatInventoryReport", () => {
    it("detecta cumplimiento cuando los archivos no exceden el baseline", () => {
      const mockBaseline = {
        totalBaselineJsCount: 2,
        layers: {
          "layer-1-core": {
            name: "Núcleo",
            targetTask: "MHB-30",
            baselineJsCount: 1,
            patterns: [],
          },
          "layer-2-cli": {
            name: "CLI",
            targetTask: "MHB-31",
            baselineJsCount: 1,
            patterns: [],
          },
        },
      };

      // Simulamos la verificación sobre el mock
      const mockResults = {
        layerResults: [
          {
            key: "layer-1-core",
            name: "Núcleo",
            targetTask: "MHB-30",
            baselineJs: 1,
            currentJs: 1,
            currentTs: 0,
            passed: true,
            jsFiles: ["scripts/shared/mock.js"],
            tsFiles: [],
          },
          {
            key: "layer-2-cli",
            name: "CLI",
            targetTask: "MHB-31",
            baselineJs: 1,
            currentJs: 0,
            currentTs: 1,
            passed: true,
            jsFiles: [],
            tsFiles: ["scripts/cli/mock.ts"],
          },
        ],
        totalBaselineJs: mockBaseline.totalBaselineJsCount,
        totalCurrentJs: 1,
        totalCurrentTs: 1,
        requireZero: false,
        allPassed: true,
        unassignedFiles: [],
      };

      const report = formatInventoryReport(mockResults);
      expect(report).toContain("MHB-30 (Núcleo)");
      expect(report).toContain("🟢 Conforme");
      expect(report).toContain("✅ Migrado");
      expect(report).toContain("TOTAL PROYECTO");
    });

    it("marca error si una capa excede su baseline", () => {
      const mockResults = {
        layerResults: [
          {
            key: "layer-1-core",
            name: "Núcleo",
            targetTask: "MHB-30",
            baselineJs: 1,
            currentJs: 2,
            currentTs: 0,
            passed: false,
            jsFiles: ["a.js", "b.js"],
            tsFiles: [],
          },
        ],
        totalBaselineJs: 1,
        totalCurrentJs: 2,
        totalCurrentTs: 0,
        requireZero: false,
        allPassed: false,
        unassignedFiles: [],
      };

      const report = formatInventoryReport(mockResults);
      expect(report).toContain("❌ Excedido");
      expect(report).toContain("❌ Fallido");
    });

    it("ejecuta checkInventory con el baseline del proyecto y confirma allPassed", () => {
      const baselinePath = new URL("./inventory-baseline.json", import.meta.url);
      const baselineData = JSON.parse(readFileSync(baselinePath, "utf8"));
      const rootDir = fileURLToPath(new URL("../..", import.meta.url));
      const results = checkInventory(rootDir, baselineData);
      expect(results.allPassed).toBe(true);
      expect(results.unassignedFiles.length).toBe(0);
      expect(results.totalCurrentTs).toBeGreaterThanOrEqual(2);
    });

    it("falla en modo requireZero si aún existen archivos JS/MJS", () => {
      const baselinePath = new URL("./inventory-baseline.json", import.meta.url);
      const baselineData = JSON.parse(readFileSync(baselinePath, "utf8"));
      const rootDir = fileURLToPath(new URL("../..", import.meta.url));
      const results = checkInventory(rootDir, baselineData, { requireZero: true });
      expect(results.allPassed).toBe(false);
      expect(results.requireZero).toBe(true);
      expect(results.totalCurrentJs).toBeGreaterThan(0);

      const report = formatInventoryReport(results);
      expect(report).toContain("[MODO --require-zero ACTIVO]");
      expect(report).toContain("Modo estricto activo (--require-zero)");
    });

    it("pasa en modo requireZero cuando el conteo de JS es 0", () => {
      const mockResults = {
        layerResults: [
          {
            key: "layer-1-core",
            name: "Núcleo",
            targetTask: "MHB-30",
            baselineJs: 10,
            currentJs: 0,
            currentTs: 10,
            passed: true,
            jsFiles: [],
            tsFiles: ["a.ts"],
          },
        ],
        totalBaselineJs: 10,
        totalCurrentJs: 0,
        totalCurrentTs: 10,
        requireZero: true,
        allPassed: true,
        unassignedFiles: [],
      };

      const report = formatInventoryReport(mockResults);
      expect(report).toContain("[MODO --require-zero ACTIVO]");
      expect(report).toContain("🟢 Conforme");
      expect(report).not.toContain("❌ Fallido");
    });
  });
});
