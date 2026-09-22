import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { collectTemplateSource } from "./esp-sources.ts";
import { validateEspVariables } from "./esp-variables.ts";

describe("esp-sources", () => {
  test("collectTemplateSource incluye el layout y componentes realmente usados por welcome", () => {
    const source = collectTemplateSource(process.cwd(), "welcome");
    expect(source).toContain("{{ unsubscribe_url }}");
    expect(source).toContain("[[component.buttonUrl]]");
    const data = {
      first_name: "Frank",
      dashboard_url: "https://example.com",
      unsubscribe_url: "https://example.com/unsubscribe",
    };
    expect(validateEspVariables({ source, data }).missing).toEqual([]);
  });

  const testCases = [
    { templateName: "password-reset", criticalVariable: "{{ reset_url }}" },
    { templateName: "receipt", criticalVariable: "{{ total_amount }}" },
    { templateName: "newsletter", criticalVariable: "{{ unsubscribe_url }}" },
  ];

  test.each(testCases)(
    "$templateName conserva su variable ESP crítica y fixture completo",
    ({ templateName, criticalVariable }) => {
      const source = collectTemplateSource(process.cwd(), templateName);
      const data = JSON.parse(
        readFileSync(
          join(process.cwd(), "src/emails/templates", templateName, "data.json"),
          "utf8",
        ),
      );

      expect(source).toContain(criticalVariable);
      expect(validateEspVariables({ source, data }).missing).toEqual([]);
    },
  );
});
