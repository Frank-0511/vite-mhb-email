// @ts-check
import { afterEach, describe, expect, test } from "bun:test";
import { cleanupContexts, createContext, ruleById } from "../test-fixtures.js";

afterEach(cleanupContexts);

describe("img-alt", () => {
  test("distingue alt ausente de alt vacío o en blanco", () => {
    const issues = ruleById("img-alt").check(
      '<img src="a" width="1" height="1"><img src="b" width="1" height="1" alt=""><img src="c" width="1" height="1" alt="   ">',
      createContext(),
    );

    expect(issues).toHaveLength(3);
    expect(issues[0].message).toContain("sin atributo alt");
    expect(issues[1].message).toContain('alt=""');
    expect(issues[2].message).toContain('alt=""');
  });
});
