// @ts-check
import { describe, expect, test } from "bun:test";
import { collectTemplateSource, getSourceName } from "./esp-sources.js";
import { validateEspVariables } from "./esp-variables.js";

describe("esp-sources", () => {
  test("getSourceName devuelve el nombre base del archivo", () => {
    expect(getSourceName("/path/to/template.html")).toBe("template.html");
  });

  test("collectTemplateSource devuelve string vacío si no existe el template", () => {
    expect(collectTemplateSource(process.cwd(), "non-existent-template-xyz")).toBe("");
  });

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
});
