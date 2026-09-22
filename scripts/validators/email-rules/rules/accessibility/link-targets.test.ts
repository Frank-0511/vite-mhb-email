import { afterEach, describe, expect, test } from "bun:test";
import { cleanupContexts, createContext, ruleById } from "../../test-fixtures.ts";

afterEach(cleanupContexts);

describe("link-targets", () => {
  test("omite placeholders ESP, merge tags y mailto", () => {
    expect(
      ruleById("link-targets").check(
        '<a href="{{ unsubscribe_url }}">a</a><a href="*|UNSUB|*">b</a><a href="mailto:hola@example.com">c</a>',
        createContext(),
      ),
    ).toEqual([]);
  });

  test("reporta href vacío distingviéndolo del ancla", () => {
    const issues = ruleById("link-targets").check(
      '<a href="">a</a><a href="#">b</a>',
      createContext(),
    );

    expect(issues).toHaveLength(2);
    expect(issues[0].message).toContain("(vacío)");
    expect(issues[1].message).toContain('href="#"');
  });
});
