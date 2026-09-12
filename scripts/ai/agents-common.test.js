import { describe, expect, test } from "bun:test";
import { formatError } from "./agents-common.mjs";

describe("agents-common utilidades", () => {
  test("formatError devuelve message de Error y String para otros tipos", () => {
    expect(formatError(new Error("Fallo de prueba"))).toBe("Fallo de prueba");
    expect(formatError("error en string")).toBe("error en string");
    expect(formatError({ code: 404 })).toBe("[object Object]");
  });
});
