import { describe, expect, test } from "bun:test";
import { render } from "@maizzle/framework";
import { applyLegacySendGridSubstitutions } from "./handlebars.js";

describe("applyLegacySendGridSubstitutions", () => {
  test("sustituye placeholders Legacy solo cuando el dato local existe", () => {
    expect(
      applyLegacySendGridSubstitutions("Hola -first_name- / -missing-", { first_name: "Ana" }),
    ).toBe("Hola Ana / -missing-");
  });

  test("preserva el placeholder Legacy para el build final cuando no se aplica data local", () => {
    expect(applyLegacySendGridSubstitutions("Hola -first_name-", {})).toBe("Hola -first_name-");
  });

  test("Maizzle conserva los placeholders Legacy en el HTML de build", async () => {
    const { html } = await render("<p>Hola -first_name-</p>", {
      expressions: { delimiters: ["[[", "]]"], missingLocal: "{{ local }}" },
    });

    expect(html).toContain("-first_name-");
  });
});
