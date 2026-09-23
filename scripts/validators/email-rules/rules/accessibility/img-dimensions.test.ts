import { afterEach, describe, expect, test } from "bun:test";
import { cleanupContexts, createContext, ruleById } from "../../rules.fixtures.ts";

afterEach(cleanupContexts);

describe("img-dimensions", () => {
  test("nombra solo el atributo ausente y reporta cada imagen", () => {
    const issues = ruleById("img-dimensions").check(
      '<img src="a" height="1" alt="a"><img src="b" width="1" alt="b">',
      createContext(),
    );

    expect(issues).toHaveLength(2);
    expect(issues[0].message).toContain("width");
    expect(issues[0].message).not.toContain("height");
    expect(issues[1].message).toContain("height");
    expect(issues[1].message).not.toContain("width");
  });

  test("acepta comillas simples y no exige unidades", () => {
    expect(
      ruleById("img-dimensions").check(
        "<img src='a' width='600' height='200' alt='a'>",
        createContext(),
      ),
    ).toEqual([]);
  });
});
