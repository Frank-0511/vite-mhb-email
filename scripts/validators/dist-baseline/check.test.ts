/**
 * @fileoverview Pruebas para check.ts y update.ts.
 */

import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { checkDistBaseline } from "./check.ts";
import {
  createTempDist,
  FIXTURE_HTML_WELCOME,
  FIXTURE_HTML_WELCOME_BYTE_CHANGED,
} from "./dist-baseline.fixtures.ts";
import { createDistSnapshot, writeBaseline } from "./snapshot.ts";
import { updateDistBaseline } from "./update.ts";

describe("check.ts y update.ts", () => {
  test("checkDistBaseline reporta éxito cuando el directorio coincide con el baseline", () => {
    const { dir, cleanup } = createTempDist({
      "welcome.html": FIXTURE_HTML_WELCOME,
    });
    const tempBaseline = path.join(dir, "baseline.json");

    try {
      const snap = createDistSnapshot(dir);
      writeBaseline(snap, tempBaseline);

      const result = checkDistBaseline({ distDir: dir, baselinePath: tempBaseline });
      expect(result.success).toBe(true);
      expect(result.message).toContain("coincide exactamente");
    } finally {
      cleanup();
    }
  });

  test("checkDistBaseline reporta fallo cuando hay diferencias en dist", () => {
    const baseDir = createTempDist({ "welcome.html": FIXTURE_HTML_WELCOME });
    const modDir = createTempDist({ "welcome.html": FIXTURE_HTML_WELCOME_BYTE_CHANGED });
    const tempBaseline = path.join(baseDir.dir, "baseline.json");

    try {
      const snap = createDistSnapshot(baseDir.dir);
      writeBaseline(snap, tempBaseline);

      const result = checkDistBaseline({ distDir: modDir.dir, baselinePath: tempBaseline });
      expect(result.success).toBe(false);
      expect(result.message).toContain("[hash-modificado] welcome.html");
    } finally {
      baseDir.cleanup();
      modDir.cleanup();
    }
  });

  test("checkDistBaseline falla si el baseline no existe", () => {
    const result = checkDistBaseline({
      distDir: os.tmpdir(),
      baselinePath: "/ruta/falsa/inexistente.json",
    });
    expect(result.success).toBe(false);
    expect(result.message).toContain("❌ Error al verificar baseline");
  });

  test("updateDistBaseline crea y actualiza el baseline persistido", () => {
    const { dir, cleanup } = createTempDist({
      "welcome.html": FIXTURE_HTML_WELCOME,
    });
    const tempBaseline = path.join(dir, "baseline.json");

    try {
      updateDistBaseline({ distDir: dir, baselinePath: tempBaseline });
      expect(fs.existsSync(tempBaseline)).toBe(true);

      const check = checkDistBaseline({ distDir: dir, baselinePath: tempBaseline });
      expect(check.success).toBe(true);
    } finally {
      cleanup();
    }
  });

  test("CLI check.ts sale con código 0 ante baseline limpio", () => {
    const checkCliPath = path.join(import.meta.dirname ?? ".", "check.ts");
    const proc = spawnSync(process.execPath, [checkCliPath], {
      cwd: process.cwd(),
      env: {
        ...process.env,
      },
    });
    expect(proc.status).toBe(0);
  });

  test("proceso sale con código 1 ante fallo de verificación de baseline", () => {
    const proc = spawnSync(
      process.execPath,
      [
        "-e",
        'import { checkDistBaseline } from "./scripts/validators/dist-baseline/check.ts"; const res = checkDistBaseline({ baselinePath: "/inexistente.json" }); process.exit(res.success ? 0 : 1);',
      ],
      {
        cwd: process.cwd(),
      },
    );
    expect(proc.status).toBe(1);
  });
});
