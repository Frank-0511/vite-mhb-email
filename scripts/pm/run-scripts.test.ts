import { afterEach, beforeEach, describe, expect, test, vi, type MockInstance } from "vitest";
import type { PackageManager } from "../shared/env/detect-pm.ts";
import { runScripts, type ScriptRunner } from "./run-scripts.ts";

describe("runScripts", () => {
  let consoleErrorSpy: MockInstance<(...args: unknown[]) => void> | null = null;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy?.mockRestore();
  });

  test("ejecuta todos los scripts en orden cuando todos terminan con status 0", () => {
    const calls: [PackageManager, string][] = [];
    const runner: ScriptRunner = (pm, script) => {
      calls.push([pm, script]);
      return { status: 0 };
    };

    const status = runScripts(["a", "b"], "yarn", runner);

    expect(status).toBe(0);
    expect(calls).toEqual([
      ["yarn", "a"],
      ["yarn", "b"],
    ]);
  });

  test("se detiene en el primer script que falla y devuelve su status", () => {
    const calls: [PackageManager, string][] = [];
    const runner: ScriptRunner = (pm, script) => {
      calls.push([pm, script]);
      if (script === "a") {
        return { status: 3 };
      }
      return { status: 0 };
    };

    const status = runScripts(["a", "b"], "yarn", runner);

    expect(status).toBe(3);
    expect(calls).toEqual([["yarn", "a"]]);
  });

  test("devuelve 1 si el runner reporta un error de ejecución", () => {
    const runner: ScriptRunner = () => {
      return { status: null, error: new Error("ENOENT") };
    };

    const status = runScripts(["a"], "yarn", runner);

    expect(status).toBe(1);
  });

  test("devuelve 2 y no llama al runner cuando la lista de scripts está vacía", () => {
    let called = false;
    const runner: ScriptRunner = () => {
      called = true;
      return { status: 0 };
    };

    const status = runScripts([], "yarn", runner);

    expect(status).toBe(2);
    expect(called).toBe(false);
  });
});
