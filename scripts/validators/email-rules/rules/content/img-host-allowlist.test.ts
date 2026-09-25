import { afterEach, describe, expect, test } from "bun:test";
import { cleanupContexts, createContext, ruleById } from "../../rules.fixtures.ts";

afterEach(cleanupContexts);

describe("img-host-allowlist", () => {
  test("detecta host fuera de la allowlist", () => {
    const issues = ruleById("img-host-allowlist").check(
      '<img src="https://api.iconify.design/lucide:rocket.png" alt="x">',
      createContext(),
    );
    expect(issues.length).toBe(1);
  });

  test("detecta ruta relativa", () => {
    const issues = ruleById("img-host-allowlist").check(
      '<img src="/assets/icon.png" alt="x">',
      createContext(),
    );
    expect(issues.length).toBe(1);
  });

  test("detecta http: no seguro", () => {
    const issues = ruleById("img-host-allowlist").check(
      '<img src="http://cdn.jsdelivr.net/icon.png" alt="x">',
      createContext(),
    );
    expect(issues.length).toBe(1);
  });

  test("permite un host de la allowlist", () => {
    const issues = ruleById("img-host-allowlist").check(
      '<img src="https://cdn.jsdelivr.net/gh/org/repo/icon.png" alt="x">',
      createContext(),
    );
    expect(issues).toEqual([]);
  });

  test("omite src con variable ESP sin resolver", () => {
    const issues = ruleById("img-host-allowlist").check(
      '<img src="{{ logo_url }}" alt="x"><img src="*|LOGO_URL|*" alt="y">',
      createContext(),
    );
    expect(issues).toEqual([]);
  });
});
