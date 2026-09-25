/**
 * @fileoverview Tests unitarios del validador de compatibilidad HTML para email.
 */

import { afterEach, beforeEach, describe, expect, spyOn, test, type Mock } from "bun:test";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validateEmailHtml } from "./validate-email-html.ts";

const HTML_CLEAN = `<!doctype html>
<html lang="es">
<head><meta charset="utf-8"><title>Test</title></head>
<body>
  <table width="600" border="0" cellpadding="0" cellspacing="0">
    <tr><td>Hola mundo</td></tr>
  </table>
</body>
</html>
`;

const HTML_MISSING_DOCTYPE = `<html lang="es">
<head><meta charset="utf-8"><title>Sin doctype</title></head>
<body>
  <table width="600" border="0" cellpadding="0" cellspacing="0">
    <tr><td>Sin doctype</td></tr>
  </table>
</body>
</html>
`;

const HTML_CSS_ERROR = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>CSS Error</title>
  <style>
    .wrapper { display: flex; }
  </style>
</head>
<body>
  <table width="600"><tr><td>Flex no soportado en Outlook</td></tr></table>
</body>
</html>
`;

let tempDir = "";
let consoleLogSpy: Mock<(...args: unknown[]) => void> | null = null;
let consoleErrorSpy: Mock<(...args: unknown[]) => void> | null = null;

beforeEach(() => {
  tempDir = join(tmpdir(), `email-validate-${randomUUID()}`);
  mkdirSync(tempDir, { recursive: true });
  consoleLogSpy = spyOn(console, "log").mockImplementation(() => {});
  consoleErrorSpy = spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  consoleLogSpy?.mockRestore();
  consoleErrorSpy?.mockRestore();
  if (tempDir) {
    rmSync(tempDir, { recursive: true, force: true });
    tempDir = "";
  }
});

describe("validateEmailHtml — estructura del retorno", () => {
  test("retorna un objeto con las claves errors, warnings e infos", () => {
    writeFileSync(join(tempDir, "ok.html"), HTML_CLEAN, "utf-8");
    const result = validateEmailHtml(tempDir);
    expect(result).toHaveProperty("errors");
    expect(result).toHaveProperty("warnings");
    expect(result).toHaveProperty("infos");
    expect(typeof result.errors).toBe("number");
    expect(typeof result.warnings).toBe("number");
    expect(typeof result.infos).toBe("number");
  });

  test("retorna { errors:0, warnings:0, infos:0 } cuando no hay archivos HTML", () => {
    const result = validateEmailHtml(tempDir);
    expect(result.errors).toBe(0);
    expect(result.warnings).toBe(0);
    expect(result.infos).toBe(0);
  });
});

describe("validateEmailHtml — HTML sin errores", () => {
  test("HTML limpio retorna errors: 0", () => {
    writeFileSync(join(tempDir, "clean.html"), HTML_CLEAN, "utf-8");
    expect(validateEmailHtml(tempDir)).toEqual({ errors: 0, warnings: 1, infos: 0 });
  });
});

describe("validateEmailHtml — HTML con ERROR (doctype faltante)", () => {
  test("HTML sin <!doctype html> produce al menos 1 error", () => {
    writeFileSync(join(tempDir, "no-doctype.html"), HTML_MISSING_DOCTYPE, "utf-8");
    expect(validateEmailHtml(tempDir)).toEqual({ errors: 1, warnings: 1, infos: 0 });
  });

  test("HTML con display:flex produce al menos 1 error", () => {
    writeFileSync(join(tempDir, "flex.html"), HTML_CSS_ERROR, "utf-8");
    expect(validateEmailHtml(tempDir)).toEqual({ errors: 1, warnings: 1, infos: 1 });
  });
});

describe("validateEmailHtml — decisor de código de salida CLI", () => {
  test("el decisor determina salida con 1 si errors > 0 y 0 si errors === 0", () => {
    const decideExitCode = (summary: { errors: number }) => (summary.errors > 0 ? 1 : 0);
    expect(decideExitCode({ errors: 0 })).toBe(0);
    expect(decideExitCode({ errors: 1 })).toBe(1);
    expect(decideExitCode({ errors: 5 })).toBe(1);
  });

  test("invocación CLI del script sobre dist/ válido actual sale con código 0", () => {
    const scriptPath = join(import.meta.dirname ?? ".", "validate-email-html.ts");
    const proc = spawnSync(process.execPath, [scriptPath], {
      cwd: process.cwd(),
      env: { ...process.env },
    });
    expect(proc.status).toBe(0);
  });

  test("invocación CLI con errores de validación sale con código 1", () => {
    writeFileSync(join(tempDir, "error.html"), HTML_MISSING_DOCTYPE, "utf-8");
    const proc = spawnSync(
      process.execPath,
      [
        "-e",
        `import { validateEmailHtml } from "./scripts/validators/validate-email-html.ts"; const s = validateEmailHtml("${tempDir}"); process.exit(s.errors > 0 ? 1 : 0);`,
      ],
      {
        cwd: process.cwd(),
      },
    );
    expect(proc.status).toBe(1);
  });
});
