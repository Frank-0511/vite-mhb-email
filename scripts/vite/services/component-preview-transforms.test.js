// @ts-check
import { describe, expect, test } from "bun:test";
import {
  convertMaizzleConditionals,
  convertMaizzleDelimiters,
  stripPropsScript,
  wrapTableFragment,
} from "./component-preview-transforms.js";

describe("convertMaizzleDelimiters", () => {
  test("reemplaza delimitadores dobles de corchete por dobles llaves", () => {
    expect(convertMaizzleDelimiters("<h1>[[ title ]]</h1>")).toBe("<h1>{{ title }}</h1>");
    expect(convertMaizzleDelimiters("<div>[[page.url]] - [[author]]</div>")).toBe(
      "<div>{{page.url}} - {{author}}</div>",
    );
  });

  test("no modifica cadenas sin delimitadores", () => {
    const html = "<p>Texto normal sin variables</p>";
    expect(convertMaizzleDelimiters(html)).toBe(html);
  });
});

describe("convertMaizzleConditionals", () => {
  test("convierte condicionales <if> a {{#if}} de Handlebars", () => {
    const input = '<if condition="showButton"> <button>Click</button> </if>';
    expect(convertMaizzleConditionals(input)).toBe(
      "{{#if showButton}}<button>Click</button>{{/if}}",
    );
  });

  test("convierte <elseif> y <else> a sintaxis Handlebars", () => {
    const input = '<if condition="a">A</if><elseif condition="b">B</elseif><else>C';
    const output = convertMaizzleConditionals(input);
    expect(output).toContain("{{else if b}}");
    expect(output).toContain("{{else}}");
  });

  test("convierte <each loop='item in list'> a {{#each list as |item|}}", () => {
    const input = '<each loop="row in rows"><tr><td>[[ row.label ]]</td></tr></each>';
    const output = convertMaizzleConditionals(input);
    expect(output).toBe("{{#each rows as |row|}}<tr><td>[[ row.label ]]</td></tr>{{/each}}");
  });

  test("ignora loop con colección vacía", () => {
    const input = '<each loop="item in ">Body</each>';
    expect(convertMaizzleConditionals(input)).toBe('<each loop="item in ">Body{{/each}}');
  });
});

describe("stripPropsScript", () => {
  test("elimina el bloque <script props>", () => {
    const input = `<script props>
module.exports = { theme: 'dark' };
</script>
<div>Contenido</div>`;
    expect(stripPropsScript(input).trim()).toBe("<div>Contenido</div>");
  });

  test("deja intacto HTML sin script props", () => {
    const input = "<div>Sin script</div>";
    expect(stripPropsScript(input)).toBe("<div>Sin script</div>");
  });
});

describe("wrapTableFragment", () => {
  test("envuelve fragmentos que inician con tr en una tabla mínima", () => {
    const input = "<tr><td>Columna</td></tr>";
    const wrapped = wrapTableFragment(input);
    expect(wrapped).toBe(
      '<table class="w-full" cellpadding="0" cellspacing="0" role="none"><tbody><tr><td>Columna</td></tr></tbody></table>',
    );
  });

  test("envuelve fragmentos con espacios iniciales", () => {
    const input = "   <td>Celda suelta</td>";
    const wrapped = wrapTableFragment(input);
    expect(wrapped).toContain('<table class="w-full"');
    expect(wrapped).toContain("<tbody>   <td>Celda suelta</td></tbody>");
  });

  test("no envuelve elementos estándar que no son fragmentos de tabla", () => {
    const input = '<div class="card">Contenido</div>';
    expect(wrapTableFragment(input)).toBe(input);
  });
});
