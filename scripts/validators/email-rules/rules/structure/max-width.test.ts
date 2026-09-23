import { afterEach, describe, expect, test } from "bun:test";
import { cleanupContexts, createContext, ruleById } from "../../rules.fixtures.ts";

afterEach(cleanupContexts);

describe("max-width-check", () => {
  test("usa 700px como límite inclusivo en px y rem", () => {
    const rule = ruleById("max-width-check");
    expect(rule.check("<style>.max-w-email{max-width:700px}</style>", createContext())).toEqual([]);
    expect(rule.check("<style>.max-w-email{max-width:43.75rem}</style>", createContext())).toEqual(
      [],
    );
    expect(
      rule.check("<style>.max-w-email{max-width:701px}</style>", createContext()),
    ).toHaveLength(1);
    expect(
      rule.check("<style>.max-w-email{max-width:44rem}</style>", createContext()),
    ).toHaveLength(1);
  });

  test("no opina si no hay clase .max-w-*", () => {
    expect(
      ruleById("max-width-check").check(
        "<style>.wrapper{max-width:900px}</style>",
        createContext(),
      ),
    ).toEqual([]);
  });
});
