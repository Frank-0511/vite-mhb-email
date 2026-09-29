import { afterEach, describe, expect, test } from "bun:test";
import { Severity } from "../../context.ts";
import { cleanHtml, cleanupContexts, createContext, ruleById } from "../../rules.fixtures.ts";

afterEach(cleanupContexts);

describe("esp-syntax-profile", () => {
  const rule = ruleById("esp-syntax-profile");

  test("verifica metadatos de la regla", () => {
    expect(rule.id).toBe("esp-syntax-profile");
    expect(rule.severity).toBe(Severity.ERROR);
  });

  test("produce error con line y hint para helper no admitido en sendgrid", () => {
    const html = "<p>{{#if (eq a b)}}Contenido{{/if}}</p>";
    const issues = rule.check(html, createContext());
    expect(issues.length).toBe(1);
    expect(issues[0].severity).toBe(Severity.ERROR);
    expect(issues[0].ruleId).toBe("esp-syntax-profile");
    expect(issues[0].line).toBe(1);
    expect(issues[0].hint).toContain("sendgrid");
    expect(issues[0].message).toContain('"eq"');
  });

  test("no reporta issues en HTML limpio sin mustaches inválidos", () => {
    const issues = rule.check(cleanHtml, createContext());
    expect(issues).toEqual([]);
  });
});
