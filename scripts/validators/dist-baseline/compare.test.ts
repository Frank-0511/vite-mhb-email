/**
 * @fileoverview Pruebas unitarias para compare.ts (diffing y formateo).
 */

import { describe, expect, test } from "bun:test";
import { compareSnapshots, formatBaselineDiff, hasBaselineDiff } from "./compare.ts";
import {
  createTempDist,
  FIXTURE_HTML_RECEIPT,
  FIXTURE_HTML_WELCOME,
  FIXTURE_HTML_WELCOME_BYTE_CHANGED,
  FIXTURE_HTML_WELCOME_LOST_ESP,
  FIXTURE_HTML_WELCOME_NEW_ESP,
} from "./dist-baseline.fixtures.ts";
import { createDistSnapshot } from "./snapshot.ts";

describe("compare.ts", () => {
  test("coincidencia exacta genera un diff vacío y hasBaselineDiff falso", () => {
    const { dir, cleanup } = createTempDist({
      "welcome.html": FIXTURE_HTML_WELCOME,
      "receipt.html": FIXTURE_HTML_RECEIPT,
    });

    try {
      const baseline = createDistSnapshot(dir);
      const actual = createDistSnapshot(dir);
      const diff = compareSnapshots(baseline, actual);

      expect(hasBaselineDiff(diff)).toBe(false);
      expect(diff.added).toEqual([]);
      expect(diff.removed).toEqual([]);
      expect(diff.hashChanged).toEqual([]);
      expect(diff.espLost).toEqual({});
      expect(diff.espAdded).toEqual({});

      const message = formatBaselineDiff(diff);
      expect(message).toContain("coincide exactamente con el baseline");
    } finally {
      cleanup();
    }
  });

  test("un byte distinto detecta hashChanged con el nombre del template", () => {
    const baseDir = createTempDist({ "welcome.html": FIXTURE_HTML_WELCOME });
    const modDir = createTempDist({ "welcome.html": FIXTURE_HTML_WELCOME_BYTE_CHANGED });

    try {
      const baseline = createDistSnapshot(baseDir.dir);
      const actual = createDistSnapshot(modDir.dir);
      const diff = compareSnapshots(baseline, actual);

      expect(hasBaselineDiff(diff)).toBe(true);
      expect(diff.hashChanged).toEqual(["welcome.html"]);
      expect(diff.espLost).toEqual({});
      expect(diff.espAdded).toEqual({});

      const message = formatBaselineDiff(diff);
      expect(message).toContain("[hash-modificado] welcome.html");
      expect(message).toContain("bun run update:dist-baseline");
    } finally {
      baseDir.cleanup();
      modDir.cleanup();
    }
  });

  test("variable ESP eliminada genera espLost con mensaje accionable detallado", () => {
    const baseDir = createTempDist({ "welcome.html": FIXTURE_HTML_WELCOME });
    const modDir = createTempDist({ "welcome.html": FIXTURE_HTML_WELCOME_LOST_ESP });

    try {
      const baseline = createDistSnapshot(baseDir.dir);
      const actual = createDistSnapshot(modDir.dir);
      const diff = compareSnapshots(baseline, actual);

      expect(hasBaselineDiff(diff)).toBe(true);
      expect(diff.hashChanged).toEqual(["welcome.html"]);
      expect(diff.espLost).toEqual({
        "welcome.html": ["first_name"],
      });

      const message = formatBaselineDiff(diff);
      expect(message).toContain("[esp-perdida] welcome.html");
      expect(message).toContain("{{ first_name }}");
      expect(message).toContain("bun run update:dist-baseline");
    } finally {
      baseDir.cleanup();
      modDir.cleanup();
    }
  });

  test("variable ESP añadida genera espAdded con advertencia", () => {
    const baseDir = createTempDist({ "welcome.html": FIXTURE_HTML_WELCOME });
    const modDir = createTempDist({ "welcome.html": FIXTURE_HTML_WELCOME_NEW_ESP });

    try {
      const baseline = createDistSnapshot(baseDir.dir);
      const actual = createDistSnapshot(modDir.dir);
      const diff = compareSnapshots(baseline, actual);

      expect(hasBaselineDiff(diff)).toBe(true);
      expect(diff.espAdded).toEqual({
        "welcome.html": ["last_name"],
      });

      const message = formatBaselineDiff(diff);
      expect(message).toContain("[esp-nueva] welcome.html");
      expect(message).toContain("{{ last_name }}");
    } finally {
      baseDir.cleanup();
      modDir.cleanup();
    }
  });

  test("detecta templates añadidos y templates eliminados", () => {
    const baseDir = createTempDist({ "welcome.html": FIXTURE_HTML_WELCOME });
    const modDir = createTempDist({ "receipt.html": FIXTURE_HTML_RECEIPT });

    try {
      const baseline = createDistSnapshot(baseDir.dir);
      const actual = createDistSnapshot(modDir.dir);
      const diff = compareSnapshots(baseline, actual);

      expect(hasBaselineDiff(diff)).toBe(true);
      expect(diff.added).toEqual(["receipt.html"]);
      expect(diff.removed).toEqual(["welcome.html"]);

      const message = formatBaselineDiff(diff);
      expect(message).toContain("[añadido] receipt.html");
      expect(message).toContain("[eliminado] welcome.html");
    } finally {
      baseDir.cleanup();
      modDir.cleanup();
    }
  });
});
