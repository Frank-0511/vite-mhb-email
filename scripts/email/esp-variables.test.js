// @ts-check
/**
 * @fileoverview Tests unitarios del validador de variables ESP `{{ }}`.
 *
 * Cobertura mínima de MHB-06:
 *   - Coincidencia exacta: no emite issues.
 *   - Variable referenciada pero ausente en data → WARNING (missing).
 *   - Clave en data.json no usada en el template → INFO (unused).
 *   - Variable ESP intencional declarada en `espVariables` (frontmatter) →
 *     no se reporta aunque falte en data.json.
 *   - Delimitadores Maizzle (`[[ ]]`, `[[[ ]]]`) y Handlebars triple-stash
 *     (`{{{ }}}`) NO se confunden con ESP `{{ }}`.
 *   - data.json malformado o ausente no rompe la validación.
 *   - Frontmatter ausente o mal formado no rompe la validación.
 */

import { describe, expect, test } from "bun:test";
import { extractEspVariables, parseEspFrontmatter, validateEspVariables } from "./esp-variables.js";
import { collectTemplateSource } from "./esp-sources.js";

// ── extractEspVariables ────────────────────────────────────────────────────────

describe("extractEspVariables", () => {
  test("extrae identificadores simples entre {{ y }}", () => {
    const source = `<p>Hola {{ first_name }} en {{ company }}</p>`;
    const vars = extractEspVariables(source);
    expect([...vars].sort()).toEqual(["company", "first_name"]);
  });

  test("deduplica ocurrencias repetidas", () => {
    const source = `<p>{{ first_name }} - {{ first_name }}</p>`;
    const vars = extractEspVariables(source);
    expect([...vars]).toEqual(["first_name"]);
  });

  test("soporta nombres con guión bajo y dígitos", () => {
    const source = `<a href="{{ dashboard_url }}">{{ user_id_2 }}</a>`;
    const vars = extractEspVariables(source);
    expect([...vars].sort()).toEqual(["dashboard_url", "user_id_2"]);
  });

  test("ignora delimitadores Maizzle [[ ]] y [[[ ]]]", () => {
    const source = `<h1>[[ page.title ]]</h1><p>[[[ raw.html ]]]</p><p>{{ real_var }}</p>`;
    const vars = extractEspVariables(source);
    expect([...vars]).toEqual(["real_var"]);
  });

  test("ignora Handlebars triple-stash {{{ }}}", () => {
    const source = `<div>{{{ html_snippet }}}</div><p>{{ safe_var }}</p>`;
    const vars = extractEspVariables(source);
    expect([...vars]).toEqual(["safe_var"]);
  });

  test("ignora el frontmatter", () => {
    const source = `---
title: "{{title}}"
previewText: "Texto"
espVariables:
  - intentional
---
<p>{{ first_name }}</p>`;
    const vars = extractEspVariables(source);
    // 'title' aparece dentro del frontmatter; no debe contar como ESP del body
    expect([...vars]).toEqual(["first_name"]);
  });

  test("tolerante cuando no hay variables", () => {
    const vars = extractEspVariables("<p>texto estático</p>");
    expect([...vars]).toEqual([]);
  });

  test("ignora bloques Handlebars {{#each}} {{this}}", () => {
    const source = `{{#each items}}<li>{{ this }}</li>{{/each}}<p>{{ footer }}</p>`;
    const vars = extractEspVariables(source);
    // {{ this }} dentro de un each no es una variable ESP del usuario
    expect([...vars]).toEqual(["footer"]);
  });
});

// ── parseEspFrontmatter ────────────────────────────────────────────────────────

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

// ── validateEspVariables ──────────────────────────────────────────────────────

describe("validateEspVariables — coincidencia", () => {
  test("data y template coinciden exactamente → sin issues", () => {
    const source = `<p>{{ first_name }} de {{ company }}</p>`;
    const data = { first_name: "Frank", company: "Mi Empresa" };
    const result = validateEspVariables({ source, data });
    expect(result.missing).toEqual([]);
    expect(result.unused).toEqual([]);
  });
});

describe("validateEspVariables — faltante (WARNING)", () => {
  test("variable referenciada pero ausente en data → missing", () => {
    const source = `<p>{{ first_name }} - {{ company }}</p>`;
    const data = { first_name: "Frank" };
    const result = validateEspVariables({ source, data });
    expect(result.missing).toEqual(["company"]);
    expect(result.unused).toEqual([]);
  });

  test("data vacío con template que tiene variables → todas missing", () => {
    const source = `<p>{{ a }} y {{ b }}</p>`;
    const result = validateEspVariables({ source, data: {} });
    expect(result.missing.sort()).toEqual(["a", "b"]);
  });

  test("data null/undefined → todas las variables del template son missing", () => {
    const source = `<p>{{ only }}</p>`;
    const result = validateEspVariables({ source, data: null });
    expect(result.missing).toEqual(["only"]);
  });
});

describe("validateEspVariables — sobrante (INFO)", () => {
  test("clave en data que no se usa en el template → unused", () => {
    const source = `<p>{{ first_name }}</p>`;
    const data = { first_name: "Frank", company: "Mi Empresa" };
    const result = validateEspVariables({ source, data });
    expect(result.unused).toEqual(["company"]);
    expect(result.missing).toEqual([]);
  });
});

describe("validateEspVariables — variables ESP intencionales", () => {
  test("variable listada en espVariables NO aparece como missing", () => {
    const source = `---
espVariables:
  - opt_in_url
---
<p>Confirma {{ opt_in_url }}</p>`;
    const data = { first_name: "Frank" };
    const result = validateEspVariables({ source, data });
    expect(result.missing).toEqual([]);
  });

  test("variable intencional sigue contando como ESP referenciada (no unused)", () => {
    const source = `---
espVariables:
  - opt_in_url
---
<p>Confirma {{ opt_in_url }}</p>`;
    const data = { first_name: "Frank" };
    const result = validateEspVariables({ source, data });
    // opt_in_url está referenciada; no debe aparecer como unused.
    expect(result.unused).toEqual(["first_name"]);
  });

  test("mezcla: intencional no genera missing, y variables usadas no son unused", () => {
    const source = `---
espVariables:
  - reserved
---
<p>{{ reserved }} - {{ dynamic }}</p>`;
    const data = { dynamic: "X" };
    const result = validateEspVariables({ source, data });
    expect(result.missing).toEqual([]);
    // dynamic está referenciada → no es unused.
    // reserved está en espVariables → excluida de unused por convención.
    expect(result.unused).toEqual([]);
  });

  test("espVariables en formato inline JSON-like funciona igual", () => {
    const source = `---
espVariables: ["x"]
---
<p>{{ x }} {{ y }}</p>`;
    const data = { y: "Y" };
    const result = validateEspVariables({ source, data });
    expect(result.missing).toEqual([]);
    // y está referenciada y en data → no unused.
    // x está en espVariables → excluida de unused.
    expect(result.unused).toEqual([]);
  });
});

describe("validateEspVariables — robustez", () => {
  test("data.json inválido (no objeto) no rompe la validación", () => {
    const source = `<p>{{ a }}</p>`;
    const result = validateEspVariables({ source, data: "string" });
    // 'a' queda como missing; no hay unused (no es objeto enumerable).
    expect(result.missing).toEqual(["a"]);
    expect(result.unused).toEqual([]);
  });

  test("data con valores anidados no añade claves de sub-objeto a unused", () => {
    const source = `<p>{{ first_name }}</p>`;
    const data = { first_name: "Frank", meta: { tag: "x" } };
    const result = validateEspVariables({ source, data });
    // Solo se consideran claves de primer nivel.
    expect(result.unused).toEqual([]);
  });

  test("frontmatter metadata no se considera variable ESP sobrante", () => {
    const source = `---\ntitleTemplate: Demo\n---\n<p>{{ first_name }}</p>`;
    const result = validateEspVariables({
      source,
      data: { first_name: "Frank", titleTemplate: "Demo" },
    });
    expect(result.unused).toEqual([]);
  });
});

describe("collectTemplateSource", () => {
  test("incluye el layout y componentes realmente usados por welcome", () => {
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
