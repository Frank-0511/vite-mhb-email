// @ts-check
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checkEnv, loadEnv } from "./env.js";

const originalCwd = process.cwd();
/** Claves de prueba: se borran de process.env tras cada caso. */
const TEST_KEYS = ["MHB_TEST_TOKEN", "MHB_TEST_INBOX", "MHB_TEST_QUOTED", "MHB_TEST_EMPTY"];
let projectRoot = "";

beforeEach(() => {
  projectRoot = mkdtempSync(join(tmpdir(), "env-helper-"));
  process.chdir(projectRoot);
  for (const key of TEST_KEYS) delete process.env[key];
});

afterEach(() => {
  process.chdir(originalCwd);
  rmSync(projectRoot, { recursive: true, force: true });
  for (const key of TEST_KEYS) delete process.env[key];
});

/** @param {string} content */
function writeEnvFile(content) {
  writeFileSync(join(projectRoot, ".env"), content, "utf8");
}

describe("loadEnv", () => {
  test("carga pares clave=valor y descarta comentarios y líneas sin '='", () => {
    writeEnvFile("# comentario\n\nMHB_TEST_TOKEN=abc123\nSIN_IGUAL\nMHB_TEST_INBOX=42\n");
    loadEnv();

    expect(process.env.MHB_TEST_TOKEN).toBe("abc123");
    expect(process.env.MHB_TEST_INBOX).toBe("42");
  });

  test("quita comillas envolventes y espacios alrededor del valor", () => {
    writeEnvFile('MHB_TEST_QUOTED = "xxxx xxxx"\n');
    loadEnv();

    expect(process.env.MHB_TEST_QUOTED).toBe("xxxx xxxx");
  });

  test("conserva los '=' internos del valor", () => {
    writeEnvFile("MHB_TEST_TOKEN=a=b=c\n");
    loadEnv();

    expect(process.env.MHB_TEST_TOKEN).toBe("a=b=c");
  });

  test("no sobreescribe una variable ya presente en el entorno", () => {
    process.env.MHB_TEST_TOKEN = "del-entorno";
    writeEnvFile("MHB_TEST_TOKEN=del-archivo\n");
    loadEnv();

    expect(process.env.MHB_TEST_TOKEN).toBe("del-entorno");
  });
});

describe("checkEnv", () => {
  test("informa que no existe .env y devuelve todas las claves como faltantes", () => {
    expect(checkEnv(["MHB_TEST_TOKEN", "MHB_TEST_INBOX"])).toEqual({
      exists: false,
      missing: ["MHB_TEST_TOKEN", "MHB_TEST_INBOX"],
    });
  });

  test("no reporta faltantes cuando no se exige ninguna clave", () => {
    writeEnvFile("MHB_TEST_TOKEN=abc123\n");

    expect(checkEnv()).toEqual({ exists: true, missing: [] });
  });

  test("considera faltante una clave con valor placeholder del .env.example", () => {
    writeEnvFile("MHB_TEST_TOKEN=your_api_token_here\nMHB_TEST_INBOX=42\n");

    expect(checkEnv(["MHB_TEST_TOKEN", "MHB_TEST_INBOX"])).toEqual({
      exists: true,
      missing: ["MHB_TEST_TOKEN"],
    });
  });

  test("considera faltante una clave declarada con valor vacío", () => {
    writeEnvFile("MHB_TEST_EMPTY=\n");

    expect(checkEnv(["MHB_TEST_EMPTY"])).toEqual({ exists: true, missing: ["MHB_TEST_EMPTY"] });
  });

  test("no expone el valor de las credenciales en su resultado", () => {
    writeEnvFile("MHB_TEST_TOKEN=secreto-real\n");
    const result = checkEnv(["MHB_TEST_TOKEN"]);

    expect(result).toEqual({ exists: true, missing: [] });
    expect(JSON.stringify(result)).not.toContain("secreto-real");
  });
});
