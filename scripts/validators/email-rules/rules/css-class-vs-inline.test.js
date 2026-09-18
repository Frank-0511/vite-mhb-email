// @ts-check
import { afterEach, describe, expect, test } from "bun:test";
import { cleanupContexts, createContext, ruleById } from "../test-fixtures.js";

afterEach(cleanupContexts);

describe("css-class-vs-inline", () => {
  test("calla cuando hay estilos inline y pocas reglas", () => {
    expect(
      ruleById("css-class-vs-inline").check(
        '<style>.a{color:red}</style><div style="color:red"></div>',
        createContext(),
      ),
    ).toEqual([]);
  });

  test("reporta muchas reglas con inline insuficiente", () => {
    const manyRules = Array.from({ length: 21 }, (_, index) => `.c${index}{color:red}`).join("");
    const issues = ruleById("css-class-vs-inline").check(
      `<style>${manyRules}</style><div style="color:red"></div>`,
      createContext(),
    );

    expect(issues).toHaveLength(1);
    expect(issues[0].message).toContain("21 reglas CSS");
  });

  test("no opina sobre un HTML sin <style>", () => {
    expect(
      ruleById("css-class-vs-inline").check('<div style="color:red"></div>', createContext()),
    ).toEqual([]);
  });
});
