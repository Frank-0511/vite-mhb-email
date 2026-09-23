/** @fileoverview Regresiones para la ejecución segura de procesos del CLI. */

import { EventEmitter } from "node:events";
import type { Interface } from "readline";
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { run, type SpawnFunction } from "./process-runner.ts";
import { askArchetype, askCreationMode, askSelectArchetype } from "./prompts.ts";

const spawnCalls: unknown[][] = [];
const children: EventEmitter[] = [];
const originalConsoleLog = console.log;

function spawnMock(...args: unknown[]): EventEmitter {
  const child = new EventEmitter();
  spawnCalls.push(args);
  children.push(child);
  return child;
}

beforeEach(() => {
  spawnCalls.length = 0;
  children.length = 0;
  // Los prompts del CLI imprimen sus menús por diseño; aquí solo interesa el
  // valor que devuelven, así que se silencian para no ensuciar la suite.
  console.log = () => {};
});

afterEach(() => {
  console.log = originalConsoleLog;
});

describe("run", () => {
  test("pasa los argumentos literalmente y sin shell", async () => {
    const args = ["scripts/generators/generate-email.ts", "nombre con espacios; exit 47"];
    const result = run("bun", args, spawnMock as unknown as SpawnFunction);

    children[0].emit("close", 0, null);

    expect(await result).toBe(0);
    expect(spawnCalls[0]).toEqual(["bun", args, { stdio: "inherit" }]);
  });

  test("preserva un código de salida distinto de cero", async () => {
    const result = run("bun", ["run", "build"], spawnMock as unknown as SpawnFunction);

    children[0].emit("close", 23, null);

    expect(await result).toBe(23);
  });

  test("rechaza cuando el proceso no puede iniciar", async () => {
    const result = run("missing-command", [], spawnMock as unknown as SpawnFunction);

    children[0].emit("error", new Error("ENOENT"));

    await expect(result).rejects.toThrow('No se pudo iniciar "missing-command": ENOENT');
  });

  test("rechaza cuando el proceso termina por señal", async () => {
    const result = run("bun", ["run", "dev"], spawnMock as unknown as SpawnFunction);

    children[0].emit("close", null, "SIGTERM");

    await expect(result).rejects.toThrow('"bun" terminó por la señal SIGTERM');
  });

  test("resuelve una sola vez si llegan error y close", async () => {
    const result = run("bun", ["run", "build"], spawnMock as unknown as SpawnFunction);

    children[0].emit("close", 0, null);
    children[0].emit("error", new Error("late error"));

    expect(await result).toBe(0);
  });
});

describe("askArchetype", () => {
  test("solicita arquetipo y devuelve respuesta trimeada", async () => {
    const rlMock = {
      question: (_query: string, callback: (answer: string) => void) => callback("  starter  "),
    };
    const result = await askArchetype(rlMock as unknown as Interface, ["starter"]);
    expect(result).toBe("starter");
  });

  test("devuelve vacío si el usuario presiona Enter", async () => {
    const rlMock = {
      question: (_query: string, callback: (answer: string) => void) => callback("   "),
    };
    const result = await askArchetype(rlMock as unknown as Interface);
    expect(result).toBe("");
  });
});

describe("askCreationMode", () => {
  test("devuelve 'zero' cuando el usuario presiona Enter o 1", async () => {
    const rlMock1 = {
      question: (_query: string, callback: (answer: string) => void) => callback(""),
    };
    expect(await askCreationMode(rlMock1 as unknown as Interface)).toBe("zero");

    const rlMock2 = {
      question: (_query: string, callback: (answer: string) => void) => callback(" 1 "),
    };
    expect(await askCreationMode(rlMock2 as unknown as Interface)).toBe("zero");
  });

  test("devuelve 'template' cuando el usuario responde 2", async () => {
    const rlMock = {
      question: (_query: string, callback: (answer: string) => void) => callback(" 2 "),
    };
    expect(await askCreationMode(rlMock as unknown as Interface)).toBe("template");
  });
});

describe("askSelectArchetype", () => {
  const sampleArchetypes = [
    { id: "starter", name: "Starter Base", category: "Base", description: "Base limpia" },
    {
      id: "welcome",
      name: "Welcome Onboarding",
      category: "Onboarding",
      description: "Bienvenida",
    },
    {
      id: "password-reset",
      name: "Password Reset",
      category: "Transaccional",
      description: "Seguridad",
    },
  ];

  test("retorna null si availableArchetypes está vacío o es nulo", async () => {
    const rlMock = { question: () => {} };
    expect(await askSelectArchetype(rlMock as unknown as Interface, [])).toBeNull();
  });

  test("selecciona por número de índice (1-indexed)", async () => {
    const rlMock = {
      question: (_query: string, callback: (answer: string) => void) => callback(" 2 "),
    };
    const selected = await askSelectArchetype(rlMock as unknown as Interface, sampleArchetypes);
    expect(selected).toBe("welcome");
  });

  test("selecciona por ID exacto de arquetipo", async () => {
    const rlMock = {
      question: (_query: string, callback: (answer: string) => void) => callback("password-reset"),
    };
    const selected = await askSelectArchetype(rlMock as unknown as Interface, sampleArchetypes);
    expect(selected).toBe("password-reset");
  });

  test("selecciona por nombre case-insensitive", async () => {
    const rlMock = {
      question: (_query: string, callback: (answer: string) => void) => callback("starter base"),
    };
    const selected = await askSelectArchetype(rlMock as unknown as Interface, sampleArchetypes);
    expect(selected).toBe("starter");
  });

  test("retorna null si el usuario ingresa una opción inválida o vacía", async () => {
    const rlMock1 = {
      question: (_query: string, callback: (answer: string) => void) => callback(""),
    };
    expect(await askSelectArchetype(rlMock1 as unknown as Interface, sampleArchetypes)).toBeNull();

    const rlMock2 = {
      question: (_query: string, callback: (answer: string) => void) => callback("999"),
    };
    expect(await askSelectArchetype(rlMock2 as unknown as Interface, sampleArchetypes)).toBeNull();
  });
});
