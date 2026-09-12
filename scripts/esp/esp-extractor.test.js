// @ts-check
import { describe, expect, test } from "bun:test";
import { extractEspVariables, stripEachBlocks } from "./esp-extractor.js";

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

  test("stripEachBlocks conserva el cuerpo si no hay cierre {{/each}}", () => {
    const source = `<p>{{#each items}}<span>{{ item }}</p>`;
    expect(stripEachBlocks(source)).toBe(source);
  });
});
