import { afterEach, describe, expect, test } from "vitest";
import { Severity } from "../../context.ts";
import { cleanHtml, cleanupContexts, createContext, ruleById } from "../../rules.fixtures.ts";

afterEach(cleanupContexts);

describe("esp-legacy-compat", () => {
  const rule = ruleById("esp-legacy-compat");

  test("verifica metadatos de la regla", () => {
    expect(rule.id).toBe("esp-legacy-compat");
    expect(rule.severity).toBe(Severity.WARNING);
  });

  test("emite warning ante bloques incompatibles con plantillas legacy", () => {
    const html = "<p>{{#if a}}Bienvenido{{/if}}</p>";
    const issues = rule.check(html, createContext());
    expect(issues.length).toBeGreaterThanOrEqual(1);
    expect(issues[0].severity).toBe(Severity.WARNING);
    expect(issues[0].ruleId).toBe("esp-legacy-compat");
    expect(issues[0].hint).toContain("SendGrid Legacy");
  });

  test("emite warning ante colisión de etiqueta con texto literal", () => {
    const html = "<p>{{ first_name }} Hola -first_name-</p>";
    const issues = rule.check(html, createContext());
    expect(issues.length).toBe(1);
    expect(issues[0].severity).toBe(Severity.WARNING);
    expect(issues[0].ruleId).toBe("esp-legacy-compat");
    expect(issues[0].message).toContain("colisiona con la etiqueta legacy");
  });

  test("no reporta issues en HTML limpio", () => {
    const issues = rule.check(cleanHtml, createContext());
    expect(issues).toEqual([]);
  });
});
