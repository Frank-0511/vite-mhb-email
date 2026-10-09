import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readJsonFile, writeJsonFile } from "./json-file.ts";

describe("json-file", () => {
  let dir = "";

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "json-file-test-"));
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  test("writeJsonFile escribe con sangría de 2 espacios y salto final", () => {
    const file = join(dir, "data.json");
    writeJsonFile(file, { a: 1, b: [2] });
    expect(readFileSync(file, "utf8")).toBe('{\n  "a": 1,\n  "b": [\n    2\n  ]\n}\n');
  });

  test("readJsonFile devuelve el contenido escrito", () => {
    const file = join(dir, "data.json");
    writeJsonFile(file, { ok: true });
    expect(readJsonFile(file)).toEqual({ ok: true });
  });

  test("readJsonFile lanza ante JSON inválido o archivo inexistente", () => {
    const file = join(dir, "bad.json");
    writeFileSync(file, "{ no json", "utf8");
    expect(() => readJsonFile(file)).toThrow();
    expect(() => readJsonFile(join(dir, "missing.json"))).toThrow();
  });
});
