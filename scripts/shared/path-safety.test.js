// @ts-check
/** @fileoverview Regresiones de seguridad para el contrato de nombres de template. */

import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { assertValidTemplateName, isPathInside, isValidTemplateName } from "./path-safety.js";

const projectRoot = process.cwd();

/**
 * Ejecuta un entrypoint con una entrada opcional y captura el resultado.
 *
 * @param {string} scriptPath
 * @param {string} [templateName]
 * @returns {ReturnType<typeof spawnSync>}
 */
function runScript(scriptPath, templateName) {
  const args = templateName === undefined ? [scriptPath] : [scriptPath, templateName];
  return spawnSync(process.execPath, args, {
    cwd: projectRoot,
    encoding: "utf-8",
  });
}

/**
 * Lee el contenido de maizzle.config.js para comparar antes/después.
 *
 * @returns {string}
 */
function readMaizzleConfig() {
  return readFileSync(resolve(projectRoot, "maizzle.config.js"), "utf-8");
}

/**
 * Devuelve una sonda de traversal única por prueba.
 *
 * @returns {string}
 */
function traversalProbe() {
  return `../mhb-05-traversal-${randomUUID()}`;
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
    "name&&touch-pwned",
    "name$(touch-pwned)",
    "`touch-pwned`",
    "UPPERCASE",
    "with_underscore",
    "with.dot",
    42,
    null,
    undefined,
  ])("rechaza %p", (name) => {
    expect(isValidTemplateName(name)).toBe(false);
    expect(() => assertValidTemplateName(name)).toThrow("invalid template name");
  });
});

describe("isPathInside", () => {
  const base = resolve(projectRoot, "src", "emails", "templates");

  test("acepta un hijo directo", () => {
    expect(isPathInside(base, resolve(base, "welcome"))).toBe(true);
  });

  test("acepta un nieto", () => {
    expect(isPathInside(base, resolve(base, "welcome", "index.html"))).toBe(true);
  });

  test("rechaza un directorio hermano con prefijo similar", () => {
    expect(isPathInside(base, resolve(base, "..", "templates-evil"))).toBe(false);
  });

  test("rechaza escape mediante ..", () => {
    expect(isPathInside(base, resolve(base, "..", "..", "etc"))).toBe(false);
  });

  test("rechaza la ruta base misma", () => {
    expect(isPathInside(base, base)).toBe(false);
  });

  test("rechaza una ruta vacía relativa", () => {
    expect(isPathInside(base, "src/emails/templates")).toBe(false);
  });
});

describe("entrypoints de template", () => {
  test("el generador rechaza traversal y no crea directorio", () => {
    const name = traversalProbe();
    const escaped = resolve(projectRoot, "src/emails", name.slice(3));
    expect(existsSync(escaped)).toBe(false);

    const result = runScript("scripts/generators/generate-email.js", name);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("nombre del template");
    expect(existsSync(escaped)).toBe(false);
  });

  test("el generador rechaza un argumento ausente", () => {
    const result = runScript("scripts/generators/generate-email.js");

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("nombre del template");
  });

  test("el exportador rechaza traversal antes de leer dist", () => {
    const result = runScript("scripts/export/export-screenshot.js", traversalProbe());

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("nombre del template");
  });

  test("el exportador rechaza un argumento ausente", () => {
    const result = runScript("scripts/export/export-screenshot.js");

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("nombre del template");
  });

  test("el build selectivo rechaza traversal sin mutar config", () => {
    const originalConfig = readMaizzleConfig();
    const backupPath = resolve(projectRoot, "maizzle.config.js.selective-bak");
    expect(existsSync(backupPath)).toBe(false);

    const result = runScript("scripts/build/build-selective.js", traversalProbe());

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Template name");
    expect(readMaizzleConfig()).toBe(originalConfig);
    expect(existsSync(backupPath)).toBe(false);
  });

  test("el build selectivo rechaza un argumento ausente", () => {
    const result = runScript("scripts/build/build-selective.js");

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Template name");
  });
});
