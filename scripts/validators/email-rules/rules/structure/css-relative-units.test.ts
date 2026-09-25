import { afterEach, describe, expect, test } from "bun:test";
import { cleanupContexts, createContext, ruleById } from "../../rules.fixtures.ts";

afterEach(cleanupContexts);

describe("css-relative-units", () => {
  test("detecta rem en estilo inline", () => {
    const issues = ruleById("css-relative-units").check(
      '<p style="margin-top: 0.625rem">x</p>',
      createContext(),
    );
    expect(issues.length).toBe(1);
    expect(issues[0].message).toContain("rem");
  });

  test("detecta em negativo en <style>", () => {
    const issues = ruleById("css-relative-units").check(
      "<style>.a { letter-spacing: -0.025em; }</style>",
      createContext(),
    );
    expect(issues.length).toBe(1);
  });

  test("ignora la palabra em/rem en texto visible del body", () => {
    const issues = ruleById("css-relative-units").check(
      "<p>Usá 1rem de harina y otros 2em de manteca en el texto</p>",
      createContext(),
    );
    expect(issues).toEqual([]);
  });

  test("permite px", () => {
    const issues = ruleById("css-relative-units").check(
      '<p style="font-size: 24px">x</p>',
      createContext(),
    );
    expect(issues).toEqual([]);
  });
});
