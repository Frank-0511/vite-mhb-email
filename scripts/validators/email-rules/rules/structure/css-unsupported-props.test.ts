import { afterEach, describe, expect, test } from "bun:test";
import { cleanupContexts, createContext, ruleById } from "../../rules.fixtures.ts";

afterEach(cleanupContexts);

describe("css-unsupported-props", () => {
  test("acumula una incidencia por propiedad y función", () => {
    const issues = ruleById("css-unsupported-props").check(
      "<style>.a { display: flex; width: calc(100% - 10px); }</style>",
      createContext(),
    );

    expect(issues).toHaveLength(2);
    expect(issues.map((issue) => issue.message).join(" ")).toContain("display: flex");
    expect(issues.map((issue) => issue.message).join(" ")).toContain("calc()");
  });

  test("ignora estilos inline fuera de <style> y prefijos con guion", () => {
    expect(
      ruleById("css-unsupported-props").check('<div style="display: flex"></div>', createContext()),
    ).toEqual([]);
    expect(
      ruleById("css-unsupported-props").check(
        "<style>.a { -webkit-transform: none; }</style>",
        createContext(),
      ),
    ).toEqual([]);
  });
});
