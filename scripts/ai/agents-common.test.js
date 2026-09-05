import { describe, expect, test } from "bun:test";
import {
  assertInside,
  assertNoTargetOverlaps,
  canonicalPath,
  classifySource,
  classifyTarget,
  configPath,
  copyMarker,
  expectedCopy,
  expectedGitignoreBlock,
  formatError,
  generatedMarker,
  gitignoreEnd,
  gitignoreStart,
  hashFile,
  hashSource,
  inspectPath,
  isInside,
  isManagedCopy,
  loadConfig,
  pathState,
  projectRoot,
  replaceGitignoreBlock,
  scriptDirectory,
  validateRelativePath,
  validateTargetParent,
} from "./agents-common.mjs";

describe("agents-common fachada y re-exports", () => {
  test("re-exporta todas las constantes esperadas", () => {
    expect(scriptDirectory).toBeDefined();
    expect(projectRoot).toBeDefined();
    expect(configPath).toBeDefined();
    expect(generatedMarker).toBeDefined();
    expect(gitignoreStart).toBeDefined();
    expect(gitignoreEnd).toBeDefined();
  });

  test("re-exporta todas las funciones de los submódulos", () => {
    expect(typeof pathState).toBe("function");
    expect(typeof validateRelativePath).toBe("function");
    expect(typeof assertInside).toBe("function");
    expect(typeof isInside).toBe("function");
    expect(typeof inspectPath).toBe("function");
    expect(typeof validateTargetParent).toBe("function");
    expect(typeof canonicalPath).toBe("function");
    expect(typeof expectedGitignoreBlock).toBe("function");
    expect(typeof replaceGitignoreBlock).toBe("function");
    expect(typeof hashFile).toBe("function");
    expect(typeof hashSource).toBe("function");
    expect(typeof copyMarker).toBe("function");
    expect(typeof expectedCopy).toBe("function");
    expect(typeof isManagedCopy).toBe("function");
    expect(typeof classifySource).toBe("function");
    expect(typeof classifyTarget).toBe("function");
    expect(typeof assertNoTargetOverlaps).toBe("function");
    expect(typeof loadConfig).toBe("function");
    expect(typeof formatError).toBe("function");
  });

  test("formatError devuelve message de Error y String para otros tipos", () => {
    expect(formatError(new Error("Fallo de prueba"))).toBe("Fallo de prueba");
    expect(formatError("error en string")).toBe("error en string");
    expect(formatError({ code: 404 })).toBe("[object Object]");
  });
});
