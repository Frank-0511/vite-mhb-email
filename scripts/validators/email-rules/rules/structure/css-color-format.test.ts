import { afterEach, describe, expect, test } from "bun:test";
import { cleanupContexts, createContext, ruleById } from "../../rules.fixtures.ts";

afterEach(cleanupContexts);

describe("css-color-format", () => {
  test("detecta rgb() con sintaxis CSS Color 4 (espacios y alfa con /)", () => {
    const issues = ruleById("css-color-format").check(
      '<div style="color: rgb(255 255 255 / 1)"></div>',
      createContext(),
    );
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].ruleId).toBe("css-color-format");
  });

  test("detecta hsl/oklch/color-mix en <style>", () => {
    const issues = ruleById("css-color-format").check(
      "<style>.a { background-color: hsl(0 0% 100%); }</style>",
      createContext(),
    );
    expect(issues.length).toBeGreaterThan(0);
  });

  test("detecta var() en estilo inline", () => {
    const issues = ruleById("css-color-format").check(
      '<div style="color: var(--tw-text-opacity)"></div>',
      createContext(),
    );
    expect(issues.length).toBeGreaterThan(0);
  });

  test("permite HEX, rgb(r, g, b) y rgba(r, g, b, a) con comas", () => {
    const issues = ruleById("css-color-format").check(
      '<div style="color:#ffffff;background-color:rgb(1, 2, 3)"><span style="color:rgba(0, 0, 0, 0.1)">x</span></div>',
      createContext(),
    );
    expect(issues).toEqual([]);
  });
});
