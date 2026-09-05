import path from "node:path";
import { describe, expect, test } from "bun:test";
import { projectRoot } from "./constants.mjs";
import {
  assertInside,
  canonicalPath,
  inspectPath,
  isInside,
  pathState,
  validateRelativePath,
} from "./paths.mjs";

describe("paths / validateRelativePath", () => {
  test("acepta rutas relativas válidas", () => {
    expect(validateRelativePath("docs/ai/AGENTS.md", "source")).toBe("docs/ai/AGENTS.md");
    expect(validateRelativePath("AGENTS.md", "target")).toBe("AGENTS.md");
  });

  test("rechaza no-strings o valores vacíos", () => {
    expect(() => validateRelativePath("", "source")).toThrow("no vacía");
    expect(() => validateRelativePath("   ", "source")).toThrow("no vacía");
    expect(() => validateRelativePath(null, "source")).toThrow("no vacía");
    expect(() => validateRelativePath(123, "source")).toThrow("no vacía");
  });

  test("rechaza rutas absolutas y traversal", () => {
    expect(() => validateRelativePath("/etc/passwd", "target")).toThrow("permanecer dentro");
    expect(() => validateRelativePath("..", "target")).toThrow("permanecer dentro");
    expect(() => validateRelativePath("../escaped", "target")).toThrow("permanecer dentro");
    expect(() => validateRelativePath(`..${path.sep}secret`, "target")).toThrow(
      "permanecer dentro",
    );
  });
});

describe("paths / contención e inspección", () => {
  test("isInside y assertInside verifican la contención estricta de rutas", () => {
    const parent = "/repo/docs/ai";
    const child = "/repo/docs/ai/skills/skill-1";
    const outside = "/repo/docs/other";

    expect(isInside(parent, child)).toBe(true);
    expect(isInside(parent, parent)).toBe(false);
    expect(isInside(parent, outside)).toBe(false);

    expect(() => assertInside(parent, child, "test")).not.toThrow();
    expect(() => assertInside(parent, outside, "test")).toThrow("permanecer dentro");
  });

  test("pathState devuelve Stats para archivos existentes y null para ausentes", async () => {
    const state = await pathState(path.join(projectRoot, "package.json"));
    expect(state).not.toBeNull();
    expect(state?.isFile()).toBe(true);

    const absent = await pathState(path.join(projectRoot, "non-existent-file.xyz"));
    expect(absent).toBeNull();
  });

  test("inspectPath clasifica correctamente archivos, directorios y ausentes", async () => {
    const fileResult = await inspectPath(path.join(projectRoot, "package.json"));
    expect(fileResult.kind).toBe("file");

    const dirResult = await inspectPath(path.join(projectRoot, "scripts"));
    expect(dirResult.kind).toBe("directory");

    const absentResult = await inspectPath(path.join(projectRoot, "definitely-not-here.xyz"));
    expect(absentResult.kind).toBe("absent");
  });

  test("canonicalPath resuelve la ruta real o la ruta absoluta si no existe", async () => {
    const resolved = await canonicalPath(path.join(projectRoot, "package.json"));
    expect(resolved).toContain("package.json");

    const absent = await canonicalPath(path.join(projectRoot, "absent.txt"));
    expect(absent).toBe(path.resolve(projectRoot, "absent.txt"));
  });
});
