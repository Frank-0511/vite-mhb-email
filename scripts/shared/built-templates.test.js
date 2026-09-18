// @ts-check
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getBuiltTemplates, readBuiltTemplate } from "./built-templates.js";

const originalCwd = process.cwd();
let projectRoot = "";

beforeEach(() => {
  projectRoot = mkdtempSync(join(tmpdir(), "built-templates-"));
  process.chdir(projectRoot);
});

afterEach(() => {
  process.chdir(originalCwd);
  rmSync(projectRoot, { recursive: true, force: true });
});

/**
 * @param {Record<string, string>} files
 */
function writeDist(files) {
  const distDir = join(projectRoot, "dist");
  mkdirSync(distDir, { recursive: true });
  for (const [name, content] of Object.entries(files)) {
    writeFileSync(join(distDir, name), content, "utf8");
  }
}

describe("getBuiltTemplates", () => {
  test("devuelve una lista vacía cuando dist/ todavía no existe", () => {
    expect(getBuiltTemplates()).toEqual([]);
  });

  test("devuelve una lista vacía cuando dist/ existe pero está vacío", () => {
    mkdirSync(join(projectRoot, "dist"), { recursive: true });
    expect(getBuiltTemplates()).toEqual([]);
  });

  test("conserva solo archivos .html y los ordena alfabéticamente", () => {
    writeDist({
      "welcome.html": "<p>w</p>",
      "newsletter.html": "<p>n</p>",
      "styles.css": "body{}",
      "data.json": "{}",
    });

    expect(getBuiltTemplates()).toEqual(["newsletter.html", "welcome.html"]);
  });

  test("no confunde una extensión parecida con .html", () => {
    writeDist({ "welcome.htm": "<p>w</p>", "welcome.html.bak": "<p>w</p>" });

    expect(getBuiltTemplates()).toEqual([]);
  });
});

describe("readBuiltTemplate", () => {
  test("lee el HTML compilado tal cual está en disco", () => {
    writeDist({ "welcome.html": "<p>Hola {{ first_name }}</p>" });

    expect(readBuiltTemplate("welcome.html")).toBe("<p>Hola {{ first_name }}</p>");
  });

  test("propaga el error cuando el archivo no existe", () => {
    mkdirSync(join(projectRoot, "dist"), { recursive: true });

    expect(() => readBuiltTemplate("ausente.html")).toThrow();
  });
});
