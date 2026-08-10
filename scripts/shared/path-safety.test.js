// @ts-check
/** @fileoverview Regresiones de seguridad para el contrato de nombres de template. */

import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { assertValidTemplateName, isValidTemplateName } from "./path-safety.js";

const projectRoot = process.cwd();

/**
 * Ejecuta un entrypoint con una entrada no confiable y captura el resultado.
 *
 * @param {string} scriptPath
 * @param {string} templateName
 * @returns {ReturnType<typeof spawnSync>}
 */
function runScript(scriptPath, templateName) {
  return spawnSync(process.execPath, [scriptPath, templateName], {
    cwd: projectRoot,
    encoding: "utf-8",
  });
}

describe("template name guard", () => {
  test.each(["welcome", "user-created", "v2", "a1-b2"])("acepta %s", (name) => {
    expect(isValidTemplateName(name)).toBe(true);
  });

  test.each([
    "",
    "../escape",
    "nested/template",
    "nested\\template",
    "/absolute",
    "name with spaces",
    "name;touch-pwned",
    "UPPERCASE",
    42,
    null,
  ])("rechaza %p", (name) => {
    expect(isValidTemplateName(name)).toBe(false);
    expect(() => assertValidTemplateName(name)).toThrow("invalid template name");
  });
});

describe("entrypoints de template", () => {
  const unsafeName = `../mhb-01-guard-${randomUUID()}`;

  test("el generador rechaza traversal sin crear la ruta objetivo", () => {
    const unexpectedDirectory = resolve(projectRoot, "src/emails", unsafeName.slice(3));
    expect(existsSync(unexpectedDirectory)).toBe(false);

    const result = runScript("scripts/generators/generate-email.js", unsafeName);

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("nombre del template");
    expect(existsSync(unexpectedDirectory)).toBe(false);
  });

  test("el exportador rechaza traversal antes de leer dist", () => {
    const result = runScript("scripts/export-screenshot.js", unsafeName);

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("nombre del template");
  });

  test("el build selectivo rechaza traversal sin mutar su configuración", () => {
    const configPath = resolve(projectRoot, "maizzle.config.js");
    const backupPath = resolve(projectRoot, "maizzle.config.js.selective-bak");
    const originalConfig = readFileSync(configPath, "utf-8");
    expect(existsSync(backupPath)).toBe(false);

    const result = runScript("scripts/build/build-selective.js", unsafeName);

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("Template name");
    expect(readFileSync(configPath, "utf-8")).toBe(originalConfig);
    expect(existsSync(backupPath)).toBe(false);
  });
});
