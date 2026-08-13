// @ts-check
/** @fileoverview Regresiones para la ejecución segura de procesos del CLI. */

import { EventEmitter } from "node:events";
import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";

const spawnCalls = [];
const children = [];

function spawnMock(...args) {
  const child = new EventEmitter();
  spawnCalls.push(args);
  children.push(child);
  return child;
}

mock.module("child_process", () => ({ spawn: spawnMock }));

const { run } = await import("./helpers.js");

beforeEach(() => {
  spawnCalls.length = 0;
  children.length = 0;
});

afterEach(() => {
  mock.restore();
});

describe("run", () => {
  test("pasa los argumentos literalmente y sin shell", async () => {
    const args = ["scripts/generators/generate-email.js", "nombre con espacios; exit 47"];
    const result = run("bun", args);

    children[0].emit("close", 0, null);

    expect(await result).toBe(0);
    expect(spawnCalls[0]).toEqual(["bun", args, { stdio: "inherit" }]);
  });

  test("preserva un código de salida distinto de cero", async () => {
    const result = run("bun", ["run", "build"]);

    children[0].emit("close", 23, null);

    expect(await result).toBe(23);
  });

  test("rechaza cuando el proceso no puede iniciar", async () => {
    const result = run("missing-command", []);

    children[0].emit("error", new Error("ENOENT"));

    await expect(result).rejects.toThrow('No se pudo iniciar "missing-command": ENOENT');
  });

  test("rechaza cuando el proceso termina por señal", async () => {
    const result = run("bun", ["run", "dev"]);

    children[0].emit("close", null, "SIGTERM");

    await expect(result).rejects.toThrow('"bun" terminó por la señal SIGTERM');
  });

  test("resuelve una sola vez si llegan error y close", async () => {
    const result = run("bun", ["run", "build"]);

    children[0].emit("close", 0, null);
    children[0].emit("error", new Error("late error"));

    expect(await result).toBe(0);
  });
});
