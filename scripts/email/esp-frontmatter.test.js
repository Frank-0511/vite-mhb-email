// @ts-check
import { describe, expect, test } from "bun:test";
import { FRONTMATTER_METADATA_KEYS } from "./esp-constants.js";
import {
  frontmatterKeys,
  parseEspFrontmatter,
  stripFrontmatter,
  unquote,
} from "./esp-frontmatter.js";

describe("unquote", () => {
  test("elimina comillas dobles y simples envolventes", () => {
    expect(unquote('"hola"')).toBe("hola");
    expect(unquote("'mundo'")).toBe("mundo");
    expect(unquote("sin_comillas")).toBe("sin_comillas");
    expect(unquote("")).toBe("");
  });
});

describe("stripFrontmatter", () => {
  test("elimina el bloque frontmatter inicial", () => {
    const source = `---
title: Test
---
<p>Body</p>`;
    expect(stripFrontmatter(source)).toBe("<p>Body</p>");
  });

  test("devuelve el contenido intacto si no hay frontmatter", () => {
    expect(stripFrontmatter("<p>Sin frontmatter</p>")).toBe("<p>Sin frontmatter</p>");
  });
});

describe("parseEspFrontmatter", () => {
  test("extrae espVariables como array de strings", () => {
    const source = `---
title: Test
espVariables:
  - opt_in_url
  - promo_code
---`;
    const fm = parseEspFrontmatter(source);
    expect(fm.espVariables).toEqual(["opt_in_url", "promo_code"]);
  });

  test("espVariables admite formato inline JSON-like", () => {
    const source = `---
espVariables: ["a", "b"]
---`;
    const fm = parseEspFrontmatter(source);
    expect(fm.espVariables).toEqual(["a", "b"]);
  });

  test("devuelve objeto vacío si no hay frontmatter", () => {
    expect(parseEspFrontmatter("<p>{{ var }}</p>")).toEqual({});
  });

  test("devuelve objeto vacío si el frontmatter está mal formado", () => {
    const source = `---
title: : : :
---`;
    const fm = parseEspFrontmatter(source);
    expect(fm).toEqual({});
  });
});

describe("FRONTMATTER_METADATA_KEYS y frontmatterKeys", () => {
  test("FRONTMATTER_METADATA_KEYS contiene los campos estándar esperados", () => {
    expect(FRONTMATTER_METADATA_KEYS.has("title")).toBe(true);
    expect(FRONTMATTER_METADATA_KEYS.has("previewText")).toBe(true);
    expect(FRONTMATTER_METADATA_KEYS.has("titleTemplate")).toBe(true);
    expect(FRONTMATTER_METADATA_KEYS.has("emailType")).toBe(true);
    expect(FRONTMATTER_METADATA_KEYS.has("espVariables")).toBe(true);
  });

  test("frontmatterKeys devuelve conjunto vacío ante entrada sin frontmatter", () => {
    const keys = frontmatterKeys("<p>Contenido sin frontmatter</p>");
    expect(keys.size).toBe(0);
  });

  test("frontmatterKeys devuelve conjunto vacío ante entradas no string", () => {
    // @ts-expect-error probando robustez runtime
    expect(frontmatterKeys(null).size).toBe(0);
    // @ts-expect-error probando robustez runtime
    expect(frontmatterKeys(undefined).size).toBe(0);
  });

  test("frontmatterKeys incluye metadatos estándar y claves personalizadas del bloque", () => {
    const source = `---
title: Mi Email
layout: newsletter
theme: dark
customProp: valor
---
<p>Cuerpo con key: value en texto no debe ser tomado</p>`;
    const keys = frontmatterKeys(source);
    expect(keys.has("title")).toBe(true);
    expect(keys.has("layout")).toBe(true);
    expect(keys.has("theme")).toBe(true);
    expect(keys.has("customProp")).toBe(true);
    expect(keys.has("Cuerpo")).toBe(false);
  });
});
