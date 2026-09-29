import { afterEach, describe, expect, test } from "bun:test";
import { cleanupContexts, createContext, ruleById } from "../../rules.fixtures.ts";

afterEach(cleanupContexts);

describe("example-domains", () => {
  test("detecta href hacia example.com", () => {
    const issues = ruleById("example-domains").check(
      '<a href="https://example.com/terms">Términos</a>',
      createContext(),
    );
    expect(issues.length).toBe(1);
    expect(issues[0].severity).toBe("WARNING");
  });

  test("detecta src hacia un TLD .test", () => {
    const issues = ruleById("example-domains").check(
      '<img src="https://cdn.test/icon.png" alt="x">',
      createContext(),
    );
    expect(issues.length).toBe(1);
  });

  test('no duplica href="#", ya cubierto por link-targets', () => {
    const issues = ruleById("example-domains").check('<a href="#">x</a>', createContext());
    expect(issues).toEqual([]);
  });

  test("permite dominios reales", () => {
    const issues = ruleById("example-domains").check(
      '<a href="https://miempresa.com/unsubscribe">Cancelar</a>',
      createContext(),
    );
    expect(issues).toEqual([]);
  });
});
