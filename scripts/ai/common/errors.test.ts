import { describe, expect, test } from "vitest";
import { formatError, isEnoent } from "./errors.ts";

describe("errors / formatError", () => {
  test("extrae message de Error y convierte valores primitivos a string", () => {
    expect(formatError(new Error("falló algo"))).toBe("falló algo");
    expect(formatError("error en texto")).toBe("error en texto");
    expect(formatError(123)).toBe("123");
    expect(formatError(null)).toBe("null");
    expect(formatError(undefined)).toBe("undefined");
  });
});

describe("errors / isEnoent", () => {
  test("reconoce errores con code ENOENT", () => {
    const enoent = Object.assign(new Error("no such file"), { code: "ENOENT" });
    expect(isEnoent(enoent)).toBe(true);

    const otherError = Object.assign(new Error("permission denied"), { code: "EACCES" });
    expect(isEnoent(otherError)).toBe(false);

    expect(isEnoent(new Error("error genérico"))).toBe(false);
    expect(isEnoent({ code: "ENOENT" })).toBe(false);
    expect(isEnoent(null)).toBe(false);
  });
});
