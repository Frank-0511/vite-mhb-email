import { afterEach, describe, expect, test } from "vitest";
import { cleanupContexts, createContext, ruleById } from "../../rules.fixtures.ts";

afterEach(cleanupContexts);

describe("img-svg-source", () => {
  test("detecta .svg por extensión, incluso con query string", () => {
    const issues = ruleById("img-svg-source").check(
      '<img src="https://api.iconify.design/lucide:bell.svg?color=%23fff" alt="x">',
      createContext(),
    );
    expect(issues.length).toBe(1);
  });

  test("detecta data:image/svg+xml", () => {
    const issues = ruleById("img-svg-source").check(
      '<img src="data:image/svg+xml;base64,PHN2Zz4=" alt="x">',
      createContext(),
    );
    expect(issues.length).toBe(1);
  });

  test("permite PNG", () => {
    const issues = ruleById("img-svg-source").check(
      '<img src="https://cdn.jsdelivr.net/gh/org/repo/icon.png" alt="x">',
      createContext(),
    );
    expect(issues).toEqual([]);
  });
});
