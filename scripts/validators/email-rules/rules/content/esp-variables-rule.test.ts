import { afterEach, describe, expect, test } from "bun:test";
import { Severity } from "../../context.ts";
import {
  cleanHtml,
  cleanupContexts,
  createContext,
  ruleById,
  writeTemplateFile,
  writeTemplateSource,
} from "../../test-fixtures.ts";

afterEach(cleanupContexts);

describe("esp-variables", () => {
  test("conserva faltantes como WARNING y sobrantes como INFO", () => {
    const context = createContext();
    writeTemplateSource(context, "example", "{{ missing }}", { unused: "value" });

    const issues = ruleById("esp-variables").check(cleanHtml, context);

    expect(issues.map((issue) => issue.severity)).toEqual([Severity.WARNING, Severity.INFO]);
  });

  test("no opina si el template fuente no existe", () => {
    expect(ruleById("esp-variables").check(cleanHtml, createContext())).toEqual([]);
  });

  test("trata un data.json ilegible como datos vacíos", () => {
    const context = createContext();
    writeTemplateSource(context, "broken", "{{ first_name }}");
    writeTemplateFile(context, "broken", "data.json", "{ no es json");

    const issues = ruleById("esp-variables").check(cleanHtml, context);

    expect(issues).toHaveLength(1);
    expect(issues[0].severity).toBe(Severity.WARNING);
    expect(issues[0].message).toContain("first_name");
  });

  test("queda en silencio cuando template y data.json coinciden", () => {
    const context = createContext();
    writeTemplateSource(context, "aligned", "{{ first_name }}", { first_name: "Ana" });

    expect(ruleById("esp-variables").check(cleanHtml, context)).toEqual([]);
  });
});
