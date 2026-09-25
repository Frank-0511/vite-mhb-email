/**
 * @fileoverview Pruebas unitarias para snapshot.ts y baseline-guard.ts.
 */

import { describe, expect, test } from "bun:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { assertDistSnapshot, isDistSnapshot } from "./baseline-guard.ts";
import {
  createTempDist,
  FIXTURE_HTML_RECEIPT,
  FIXTURE_HTML_WELCOME,
} from "./dist-baseline.fixtures.ts";
import {
  createDistSnapshot,
  extractEspVariablesFromHtml,
  readBaseline,
  writeBaseline,
} from "./snapshot.ts";

describe("snapshot.ts y baseline-guard", () => {
  describe("extractEspVariablesFromHtml", () => {
    test("extrae variables ESP {{ var }}, únicas y ordenadas alfabéticamente", () => {
      const html = "<p>{{ zebra }} {{ alpha }}</p><div>{{ zebra }} {{ beta }} {{ alpha }}</div>";
      const vars = extractEspVariablesFromHtml(html);
      expect(vars).toEqual(["alpha", "beta", "zebra"]);
    });

    test("ignora triple-stash {{{ raw }}} sin interferir", () => {
      const html = "<div>{{{ raw_content }}} {{ normal_var }}</div>";
      const vars = extractEspVariablesFromHtml(html);
      expect(vars).toEqual(["normal_var"]);
    });

    test("retorna array vacío si no hay variables ESP", () => {
      const html = "<div><p>Hola mundo estático</p></div>";
      expect(extractEspVariablesFromHtml(html)).toEqual([]);
    });
  });

  describe("createDistSnapshot", () => {
    test("genera snapshot con sha256 y variables ESP por cada archivo .html", () => {
      const { dir, cleanup } = createTempDist({
        "welcome.html": FIXTURE_HTML_WELCOME,
        "receipt.html": FIXTURE_HTML_RECEIPT,
      });

      try {
        const snapshot = createDistSnapshot(dir);
        expect(snapshot.version).toBe(1);
        expect(Object.keys(snapshot.templates).sort()).toEqual(["receipt.html", "welcome.html"]);

        const welcome = snapshot.templates["welcome.html"];
        expect(welcome.sha256).toMatch(/^[a-f0-9]{64}$/);
        expect(welcome.espVariables).toEqual(["first_name", "unsubscribe_url"]);

        const receipt = snapshot.templates["receipt.html"];
        expect(receipt.sha256).toMatch(/^[a-f0-9]{64}$/);
        expect(receipt.espVariables).toEqual(["order_number", "total_amount"]);
      } finally {
        cleanup();
      }
    });

    test("retorna snapshot con templates vacío si el directorio no existe", () => {
      const snapshot = createDistSnapshot("/directorio/inexistente/xyz");
      expect(snapshot).toEqual({ version: 1, templates: {} });
    });
  });

  describe("isDistSnapshot y assertDistSnapshot", () => {
    test("acepta una estructura válida de snapshot", () => {
      const valid = {
        version: 1,
        templates: {
          "welcome.html": {
            sha256: "a".repeat(64),
            espVariables: ["first_name"],
          },
        },
      };
      expect(isDistSnapshot(valid)).toBe(true);
      expect(() => assertDistSnapshot(valid)).not.toThrow();
    });

    test("rechaza versión distinta de 1", () => {
      const invalid = { version: 2, templates: {} };
      expect(isDistSnapshot(invalid)).toBe(false);
      expect(() => assertDistSnapshot(invalid)).toThrow("DistSnapshot válido");
    });

    test("rechaza hash sha256 inválido (no 64 hex chars)", () => {
      const invalid = {
        version: 1,
        templates: {
          "welcome.html": {
            sha256: "not-a-valid-sha256",
            espVariables: [],
          },
        },
      };
      expect(isDistSnapshot(invalid)).toBe(false);
      expect(() => assertDistSnapshot(invalid)).toThrow();
    });

    test("rechaza espVariables si no es un array de strings", () => {
      const invalid = {
        version: 1,
        templates: {
          "welcome.html": {
            sha256: "b".repeat(64),
            espVariables: [123],
          },
        },
      };
      expect(isDistSnapshot(invalid)).toBe(false);
    });

    test("rechaza null o primitivos", () => {
      expect(isDistSnapshot(null)).toBe(false);
      expect(isDistSnapshot("string")).toBe(false);
      expect(isDistSnapshot(42)).toBe(false);
    });
  });

  describe("readBaseline y writeBaseline", () => {
    test("escribe y lee el baseline preservando formato y orden de claves", () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "baseline-io-test-"));
      const baselineFile = path.join(tempDir, "baseline.json");

      try {
        const snapshot = {
          version: 1 as const,
          templates: {
            "z-last.html": { sha256: "c".repeat(64), espVariables: ["b", "a"] },
            "a-first.html": { sha256: "d".repeat(64), espVariables: ["x"] },
          },
        };

        writeBaseline(snapshot, baselineFile);
        const read = readBaseline(baselineFile);

        expect(read.version).toBe(1);
        expect(Object.keys(read.templates)).toEqual(["a-first.html", "z-last.html"]);
        expect(read.templates["z-last.html"].espVariables).toEqual(["a", "b"]);

        const raw = fs.readFileSync(baselineFile, "utf-8");
        expect(raw.endsWith("\n")).toBe(true);
      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });

    test("lanza error si el archivo de baseline no existe", () => {
      expect(() => readBaseline("/ruta/inexistente/baseline.json")).toThrow("no encontrado");
    });
  });
});
