/** @fileoverview Contratos del CLI de build selectivo. */

import { afterEach, describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

const projectRoot = process.cwd();
const buildSelectiveScript = resolve(projectRoot, "scripts/build/selective.ts");

interface Fixture {
  tempDir: string;
  templateName: string;
}

function createFixture(): Fixture {
  const tempDir = mkdtempSync(resolve(tmpdir(), "selective-build-"));
  const templateName = "welcome";
  writeFileSync(
    resolve(tempDir, "maizzle.config.js"),
    `export default { build: { content: ["src/emails/templates/**/*.html"], output: { path: "dist" } } };\n`,
  );
  mkdirSync(resolve(tempDir, "src/emails/templates/welcome"), { recursive: true });
  writeFileSync(
    resolve(tempDir, "src/emails/templates/welcome/index.html"),
    "<!doctype html><html><body><p>Welcome</p></body></html>\n",
  );
  return { tempDir, templateName };
}

describe("build-selective CLI", () => {
  let tempDir: string | null = null;

  afterEach(() => {
    if (tempDir) rmSync(tempDir, { recursive: true, force: true });
    tempDir = null;
  });

  test("compila mediante el servicio programático sin requerir escritura de maizzle.config.js", () => {
    const fixture = createFixture();
    tempDir = fixture.tempDir;
    const configPath = resolve(tempDir, "maizzle.config.js");
    const originalConfig = readFileSync(configPath, "utf8");
    chmodSync(configPath, 0o444);

    const result = spawnSync(process.execPath, [buildSelectiveScript, fixture.templateName], {
      cwd: tempDir,
      encoding: "utf8",
      env: process.env,
    });

    expect(result.status).toBe(0);
    expect(readFileSync(configPath, "utf8")).toBe(originalConfig);
    expect(readFileSync(resolve(tempDir, "dist/welcome.html"), "utf8")).toContain("Welcome");
  });

  test("conserva el error accionable para un template inexistente", () => {
    const fixture = createFixture();
    tempDir = fixture.tempDir;
    const configPath = resolve(tempDir, "maizzle.config.js");
    const originalConfig = readFileSync(configPath, "utf8");

    const result = spawnSync(process.execPath, [buildSelectiveScript, "missing-template"], {
      cwd: tempDir,
      encoding: "utf8",
      env: process.env,
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Template not found:");
    expect(result.stderr).toContain("missing-template");
    expect(readFileSync(configPath, "utf8")).toBe(originalConfig);
  });
});
