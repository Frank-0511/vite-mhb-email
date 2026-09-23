import { afterEach, describe, expect, test } from "bun:test";
import { cleanupContexts, createContext, ruleById } from "../../rules.fixtures.ts";

afterEach(cleanupContexts);

const nest = (depth: number) => "<table>".repeat(depth) + "</table>".repeat(depth);

describe("nested-tables-depth", () => {
  test("admite 4 niveles y reporta a partir del quinto", () => {
    const rule = ruleById("nested-tables-depth");
    expect(rule.check(nest(4), createContext())).toEqual([]);

    const issues = rule.check(nest(5), createContext());
    expect(issues).toHaveLength(1);
    expect(issues[0].message).toContain("5 niveles");
  });

  test("no acumula profundidad entre tablas hermanas", () => {
    expect(
      ruleById("nested-tables-depth").check("<table></table>".repeat(6), createContext()),
    ).toEqual([]);
  });
});
