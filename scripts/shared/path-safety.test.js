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
 * Ejecuta un entrypoint a través de un alias de Bun.
 *
 * @param {string} scriptAlias
 * @param {string} [templateName]
 * @returns {ReturnType<typeof spawnSync>}
 */
function runBunAlias(scriptAlias, templateName) {
  const args =
    templateName === undefined ? ["run", scriptAlias] : ["run", scriptAlias, templateName];
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
  const invalidNames = [
    { name: "", label: "vacío" },
    { name: traversalProbe(), label: "traversal" },
    { name: "name with spaces", label: "espacios" },
    { name: "name;touch-pwned", label: "metacaracter-punto-y-coma" },
    { name: "name&&touch-pwned", label: "metacaracter-ampersand" },
    { name: "UPPERCASE", label: "mayúsculas" },
  ];

  test.each(invalidNames)("el generador rechaza $label y no crea directorio", ({ name }) => {
    const escaped = name.startsWith("../")
      ? resolve(projectRoot, "src/emails", name.slice(3))
      : null;
    if (escaped) {
      expect(existsSync(escaped)).toBe(false);
    }

    const result = runScript("scripts/generators/generate-email.js", name);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("nombre del template");
    if (escaped) {
      expect(existsSync(escaped)).toBe(false);
    }
  });

  test.each(invalidNames)("el exportador rechaza $label antes de leer dist", ({ name }) => {
    const result = runScript("scripts/export-screenshot.js", name);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("nombre del template");
  });

  test.each(invalidNames)("el build selectivo rechaza $label sin mutar config", ({ name }) => {
    const originalConfig = readMaizzleConfig();
    const backupPath = resolve(projectRoot, "maizzle.config.js.selective-bak");
    expect(existsSync(backupPath)).toBe(false);

    const result = runScript("scripts/build/build-selective.js", name);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Template name");
    expect(readMaizzleConfig()).toBe(originalConfig);
    expect(existsSync(backupPath)).toBe(false);
  });

  test("el generador rechaza un argumento ausente", () => {
    const result = runScript("scripts/generators/generate-email.js");

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("nombre del template");
  });

  test("el exportador rechaza un argumento ausente", () => {
    const result = runScript("scripts/export-screenshot.js");

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("nombre del template");
  });

  test("el build selectivo rechaza un argumento ausente", () => {
    const result = runScript("scripts/build/build-selective.js");

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Template name");
  });

  test("el alias de Bun generate:email rechaza traversal", () => {
    const name = traversalProbe();
    const escaped = resolve(projectRoot, "src/emails", name.slice(3));
    expect(existsSync(escaped)).toBe(false);

    const result = runBunAlias("generate:email", name);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("nombre del template");
    expect(existsSync(escaped)).toBe(false);
  });

  test("el alias de Bun build-selective rechaza traversal sin mutar config", () => {
    const name = traversalProbe();
    const originalConfig = readMaizzleConfig();
    const backupPath = resolve(projectRoot, "maizzle.config.js.selective-bak");
    expect(existsSync(backupPath)).toBe(false);

    const result = runBunAlias("build-selective", name);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Template name");
    expect(readMaizzleConfig()).toBe(originalConfig);
    expect(existsSync(backupPath)).toBe(false);
  });
});
