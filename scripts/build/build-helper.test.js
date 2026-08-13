// @ts-check
/** @fileoverview Regresiones para el build iniciado desde el CLI. */

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

mock.module("node:child_process", () => ({ spawn: spawnMock }));

const { buildIfNeeded } = await import("./build-helper.js");

function createReadline(answer) {
  return {
    question(_question, callback) {
      callback(answer);
    },
  };
}

beforeEach(() => {
  spawnCalls.length = 0;
  children.length = 0;
});

afterEach(() => {
  mock.restore();
});

describe("buildIfNeeded", () => {
  test("cancela sin iniciar un proceso", async () => {
    expect(await buildIfNeeded(createReadline("N"))).toBe(false);
    expect(spawnCalls).toHaveLength(0);
  });

  test("inicia el build sin shell", async () => {
    const result = buildIfNeeded(createReadline("s"));
    await Promise.resolve();

    children[0].emit("close", 0, null);

    expect(await result).toBe(true);
    expect(spawnCalls[0]).toEqual(["bun", ["run", "build"], { stdio: "inherit" }]);
  });

  test("devuelve false cuando el build falla", async () => {
    const result = buildIfNeeded(createReadline("y"));
    await Promise.resolve();

    children[0].emit("close", 7, null);

    expect(await result).toBe(false);
  });

  test("rechaza si el build no puede iniciar", async () => {
    const result = buildIfNeeded(createReadline("S"));
    await Promise.resolve();

    children[0].emit("error", new Error("ENOENT"));

    await expect(result).rejects.toThrow('No se pudo iniciar "bun run build": ENOENT');
  });

  test("rechaza si el build termina por señal", async () => {
    const result = buildIfNeeded(createReadline("s"));
    await Promise.resolve();

    children[0].emit("close", null, "SIGTERM");

    await expect(result).rejects.toThrow('"bun run build" terminó por la señal SIGTERM');
  });
});
