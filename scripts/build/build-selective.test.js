// @ts-check
/** @fileoverview Regresiones de restauración del build selectivo ante fallos. */

import { afterEach, describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { delimiter, resolve } from "node:path";
import { tmpdir } from "node:os";

const projectRoot = process.cwd();
const buildSelectiveScript = resolve(projectRoot, "scripts/build/build-selective.js");

/**
 * Crea un directorio temporal con una maizzle.config.js mínima y un template.
 *
 * @param {Object} options
 * @param {boolean} [options.withGlob] - Si la config debe incluir el glob esperado.
 * @returns {{ tempDir: string, templateName: string, binDir: string }}
 */
function createTempFixture({ withGlob = true } = {}) {
  const tempDir = mkdtempSync(resolve(tmpdir(), "mhb-05-selective-"));
  const templateName = "welcome";

  const content = withGlob
    ? `export default {\n  build: {\n    content: ["src/emails/templates/**/*.html"],\n    output: { path: "dist" }\n  }\n};\n`
    : `export default {\n  build: {\n    output: { path: "dist" }\n  }\n};\n`;

  writeFileSync(resolve(tempDir, "maizzle.config.js"), content);

  mkdirSync(resolve(tempDir, "src/emails/templates/welcome"), { recursive: true });
  writeFileSync(
    resolve(tempDir, "src/emails/templates/welcome/index.html"),
    "---\ntitle: Welcome\n---\n<x-main><p>Hello</p></x-main>\n",
  );

  const binDir = resolve(tempDir, "bin");
  mkdirSync(binDir, { recursive: true });

  return { tempDir, templateName, binDir };
}

/**
 * Crea un ejecutable falso de maizzle que falla con el código y mensaje indicados.
 *
 * ponytail: El wrapper es SO-dependiente porque execSync busca `maizzle` en PATH.
 * El test solo se ejecuta en plataformas donde este wrapper sea invocable (Unix/macOS).
 * Si se migra a Windows, crear un `maizzle.cmd` equivalente en el mismo directorio.
 *
 * @param {string} binDir
 * @param {number} exitCode
 * @param {string} message
 */
function createFailingMaizzle(binDir, exitCode, message) {
  if (process.platform === "win32") {
    writeFileSync(
      resolve(binDir, "maizzle.cmd"),
      `@echo off\r\necho ${message} >&2\r\nexit /b ${exitCode}\r\n`,
    );
    return;
  }

  const maizzlePath = resolve(binDir, "maizzle");
  writeFileSync(maizzlePath, `#!/bin/sh\necho "${message}" >&2\nexit ${exitCode}\n`);
  chmodSync(maizzlePath, 0o755);
}

/**
 * Ejecuta build-selective.js desde un directorio temporal.
 *
 * @param {string} tempDir
 * @param {string} binDir
 * @param {string} templateName
 * @returns {ReturnType<typeof spawnSync>}
 */
function runBuildSelective(tempDir, binDir, templateName) {
  return spawnSync(process.execPath, [buildSelectiveScript, templateName], {
    cwd: tempDir,
    encoding: "utf-8",
    env: { ...process.env, PATH: `${binDir}${delimiter}${process.env.PATH}` },
  });
}

/**
 * Lee el contenido de maizzle.config.js para comparar antes/después.
 *
 * @param {string} tempDir
 * @returns {string}
 */
function readConfig(tempDir) {
  return readFileSync(resolve(tempDir, "maizzle.config.js"), "utf-8");
}

describe("build selectivo restaura config ante fallos", () => {
  /** @type {string | null} */
  let tempDir = null;

  afterEach(() => {
    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
      tempDir = null;
    }
  });

  test("restaura maizzle.config.js cuando maizzle build falla", () => {
    const fixture = createTempFixture({ withGlob: true });
    tempDir = fixture.tempDir;
    createFailingMaizzle(fixture.binDir, 7, "maizzle build failed");

    const originalConfig = readConfig(tempDir);
    const backupPath = resolve(tempDir, "maizzle.config.js.selective-bak");

    const result = runBuildSelective(tempDir, fixture.binDir, fixture.templateName);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("maizzle build failed");
    expect(readConfig(tempDir)).toBe(originalConfig);
    expect(() => readFileSync(backupPath, "utf-8")).toThrow();
  });

  test("restaura maizzle.config.js cuando el glob no se encuentra", () => {
    const fixture = createTempFixture({ withGlob: false });
    tempDir = fixture.tempDir;

    const originalConfig = readConfig(tempDir);
    const backupPath = resolve(tempDir, "maizzle.config.js.selective-bak");

    const result = runBuildSelective(tempDir, fixture.binDir, fixture.templateName);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Maizzle config glob not found");
    expect(readConfig(tempDir)).toBe(originalConfig);
    expect(() => readFileSync(backupPath, "utf-8")).toThrow();
  });
});
