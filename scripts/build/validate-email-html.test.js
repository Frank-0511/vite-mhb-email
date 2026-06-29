// @ts-check
/**
 * @fileoverview Tests unitarios del validador de compatibilidad HTML para email.
 *
 * Verifica:
 *   - validateEmailHtml() retorna conteos { errors, warnings, infos }.
 *   - HTML sin errores retorna errors: 0.
 *   - HTML con ERROR (doctype faltante) retorna errors >= 1.
 *   - La lógica del gate (errors > 0 → debería fallar el build) es correcta.
 */

import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import { validateEmailHtml } from "./validate-email-html.js";

// ── Fixtures ─────────────────────────────────────────────────────────────────

/** HTML válido: doctype presente, sin CSS problemático, sin imágenes sin dimensiones. */
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

/** HTML con ERROR: falta <!doctype html> → dispara la regla doctype-present. */
const HTML_MISSING_DOCTYPE = `<html lang="es">
<head><meta charset="utf-8"><title>Sin doctype</title></head>
<body>
  <table width="600" border="0" cellpadding="0" cellspacing="0">
    <tr><td>Sin doctype</td></tr>
  </table>
</body>
</html>
`;

/** HTML con ERROR: display:flex en <style> → dispara css-unsupported-props. */
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

// ── Setup / Teardown ──────────────────────────────────────────────────────────

let tempDir = "";

beforeEach(() => {
  tempDir = join(tmpdir(), `email-validate-${randomUUID()}`);
  mkdirSync(tempDir, { recursive: true });
});

afterEach(() => {
  if (tempDir) {
    rmSync(tempDir, { recursive: true, force: true });
    tempDir = "";
  }
});

// ── Tests ─────────────────────────────────────────────────────────────────────

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
    // tempDir vacío
    const result = validateEmailHtml(tempDir);
    expect(result.errors).toBe(0);
    expect(result.warnings).toBe(0);
    expect(result.infos).toBe(0);
  });
});

describe("validateEmailHtml — HTML sin errores", () => {
  test("HTML limpio retorna errors: 0", () => {
    writeFileSync(join(tempDir, "clean.html"), HTML_CLEAN, "utf-8");
    const { errors } = validateEmailHtml(tempDir);
    expect(errors).toBe(0);
  });
});

describe("validateEmailHtml — HTML con ERROR (doctype faltante)", () => {
  test("HTML sin <!doctype html> produce al menos 1 error", () => {
    writeFileSync(join(tempDir, "no-doctype.html"), HTML_MISSING_DOCTYPE, "utf-8");
    const { errors } = validateEmailHtml(tempDir);
    expect(errors).toBeGreaterThanOrEqual(1);
  });

  test("HTML con display:flex produce al menos 1 error", () => {
    writeFileSync(join(tempDir, "flex.html"), HTML_CSS_ERROR, "utf-8");
    const { errors } = validateEmailHtml(tempDir);
    expect(errors).toBeGreaterThanOrEqual(1);
  });
});

describe("lógica del gate de build", () => {
  test("errors > 0 implica que el build debe fallar", () => {
    writeFileSync(join(tempDir, "bad.html"), HTML_MISSING_DOCTYPE, "utf-8");
    const { errors } = validateEmailHtml(tempDir);
    // El gate en build.js hace: if (errors > 0) process.exit(1)
    expect(errors > 0).toBe(true);
  });

  test("errors === 0 implica que el build puede continuar", () => {
    writeFileSync(join(tempDir, "good.html"), HTML_CLEAN, "utf-8");
    const { errors } = validateEmailHtml(tempDir);
    expect(errors > 0).toBe(false);
  });
});
