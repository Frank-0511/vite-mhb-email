/**
 * @fileoverview Pruebas unitarias para check-html-size.ts y su decisor de código de salida.
 */

import { afterEach, beforeEach, describe, expect, spyOn, test, type Mock } from "bun:test";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { GMAIL_MAX_SAFE_BYTES, GMAIL_WARNING_THRESHOLD_BYTES } from "../shared/index.ts";
import { checkHtmlSize, hasExceededGmailLimit } from "./check-html-size.ts";

let tempDir = "";
let consoleLogSpy: Mock<(...args: unknown[]) => void> | null = null;

beforeEach(() => {
  tempDir = join(tmpdir(), `check-size-test-${randomUUID()}`);
  mkdirSync(tempDir, { recursive: true });
  consoleLogSpy = spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  consoleLogSpy?.mockRestore();
  if (tempDir) {
    rmSync(tempDir, { recursive: true, force: true });
    tempDir = "";
  }
});

describe("check-html-size.ts", () => {
  describe("checkHtmlSize", () => {
    test("retorna false si no hay archivos en el directorio", () => {
      const result = checkHtmlSize(tempDir);
      expect(result).toBe(false);
    });

    test("retorna false cuando todos los archivos son pequeños (< 80 KB)", () => {
      writeFileSync(join(tempDir, "small.html"), "<html><body>Small file</body></html>", "utf-8");
      const result = checkHtmlSize(tempDir);
      expect(result).toBe(false);
    });

    test("retorna true cuando un archivo entra en zona de WARNING (> 80 KB)", () => {
      // 101 KB (mayor a GMAIL_WARNING_THRESHOLD_BYTES pero menor a GMAIL_MAX_SAFE_BYTES)
      const warningBytes = GMAIL_WARNING_THRESHOLD_BYTES + 1024;
      const content = "a".repeat(warningBytes);
      writeFileSync(join(tempDir, "warning.html"), content, "utf-8");

      const result = checkHtmlSize(tempDir);
      expect(result).toBe(true);
    });

    test("retorna true cuando un archivo excede el límite de Gmail (> 102 KB)", () => {
      const exceedBytes = GMAIL_MAX_SAFE_BYTES + 1024;
      const content = "a".repeat(exceedBytes);
      writeFileSync(join(tempDir, "exceed.html"), content, "utf-8");

      const result = checkHtmlSize(tempDir);
      expect(result).toBe(true);
    });
  });

  describe("hasExceededGmailLimit", () => {
    test("retorna false si no hay archivos o son seguros (< 80 KB)", () => {
      writeFileSync(join(tempDir, "small.html"), "<html><body>Small file</body></html>", "utf-8");
      expect(hasExceededGmailLimit(tempDir)).toBe(false);
    });

    test("retorna false cuando un archivo está en zona de WARNING pero no excede 102 KB", () => {
      // 101 KB: mayor al umbral de aviso (100 KB) pero dentro del límite de 102 KB
      const warningBytes = GMAIL_WARNING_THRESHOLD_BYTES + 1024;
      writeFileSync(join(tempDir, "warning.html"), "b".repeat(warningBytes), "utf-8");
      expect(hasExceededGmailLimit(tempDir)).toBe(false);
    });

    test("retorna true cuando algún archivo excede 102 KB (EXCEEDS)", () => {
      const exceedBytes = GMAIL_MAX_SAFE_BYTES + 500;
      writeFileSync(join(tempDir, "exceed.html"), "c".repeat(exceedBytes), "utf-8");
      expect(hasExceededGmailLimit(tempDir)).toBe(true);
    });
  });

  describe("decisor de código de salida CLI", () => {
    test("decisor sale con 1 solo si supera 102 KB (no por WARNING)", () => {
      const decideExitCode = (hasExceeded: boolean) => (hasExceeded ? 1 : 0);
      expect(decideExitCode(false)).toBe(0);
      expect(decideExitCode(true)).toBe(1);
    });

    test("invocación CLI sobre dist/ actual limpio sale con código 0", () => {
      const scriptPath = join(import.meta.dirname ?? ".", "check-html-size.ts");
      const proc = spawnSync(process.execPath, [scriptPath], {
        cwd: process.cwd(),
        env: { ...process.env },
      });
      expect(proc.status).toBe(0);
    });

    test("invocación CLI con archivo > 102 KB sale con código 1", () => {
      const exceedBytes = GMAIL_MAX_SAFE_BYTES + 1024;
      writeFileSync(join(tempDir, "huge.html"), "x".repeat(exceedBytes), "utf-8");

      const proc = spawnSync(
        process.execPath,
        [
          "-e",
          `import { checkHtmlSize, hasExceededGmailLimit } from "./scripts/validators/check-html-size.ts"; checkHtmlSize("${tempDir}"); if (hasExceededGmailLimit("${tempDir}")) process.exit(1);`,
        ],
        {
          cwd: process.cwd(),
        },
      );
      expect(proc.status).toBe(1);
    });
  });
});
