// @ts-check
import { describe, expect, test } from "bun:test";
import Handlebars from "handlebars";
import {
  convertCondition,
  convertMaizzleConditionals,
  convertMaizzleDelimiters,
  registerConditionHelpers,
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

  test("convierte la cadena if/elseif/else en un único bloque cerrado una vez", () => {
    const input = [
      "<if condition=\"variant === 'v1'\">A</if>",
      "<elseif condition=\"variant === 'v2'\">B</elseif>",
      "<else>C</else>",
    ].join("\n");
    expect(convertMaizzleConditionals(input)).toBe(
      '{{#if (eq variant "v1")}}A{{else if (eq variant "v2")}}B{{else}}C{{/if}}',
    );
  });

  test("cierra la cadena aunque el <else> quede sin etiqueta de cierre", () => {
    const input = '<if condition="a">A</if><elseif condition="b">B</elseif><else>C';
    expect(convertMaizzleConditionals(input)).toBe("{{#if a}}A{{else if b}}B{{else}}C{{/if}}");
  });

  test("evalúa como falsa una condición que no puede traducir", () => {
    const input = '<if condition="items.filter(Boolean).length">A</if>';
    expect(convertMaizzleConditionals(input)).toBe("{{#if false}}A{{/if}}");
  });

  test("conserva el texto fuera de la cadena sin recortarlo", () => {
    const input = 'antes <if condition="a">A</if> despues';
    expect(convertMaizzleConditionals(input)).toBe("antes {{#if a}}A{{/if}} despues");
  });
});

describe("convertCondition", () => {
  test("traduce comparaciones a subexpresiones con helper", () => {
    expect(convertCondition("variant === 'v2'")).toBe('(eq variant "v2")');
    expect(convertCondition("variant !== 'v2'")).toBe('(ne variant "v2")');
    expect(convertCondition("total >= 3")).toBe("(gte total 3)");
    expect(convertCondition("page.count < 10")).toBe("(lt page.count 10)");
  });

  test("traduce paths, literales y negación", () => {
    expect(convertCondition("showButton")).toBe("showButton");
    expect(convertCondition("page.title")).toBe("page.title");
    expect(convertCondition("!showButton")).toBe("(not showButton)");
  });

  test("traduce operadores lógicos respetando la precedencia", () => {
    expect(convertCondition("a && b")).toBe("(and a b)");
    expect(convertCondition("a || variant === 'v2'")).toBe('(or a (eq variant "v2"))');
    expect(convertCondition("a || b && c")).toBe("(or a (and b c))");
  });

  test("devuelve null cuando la expresión no es traducible", () => {
    expect(convertCondition("items.filter(Boolean).length")).toBeNull();
    expect(convertCondition("")).toBeNull();
    expect(convertCondition("a + b")).toBeNull();
  });
});

describe("registerConditionHelpers", () => {
  const handlebars = registerConditionHelpers(Handlebars.create());

  /**
   * @param {string} condition
   * @param {Record<string, unknown>} data
   * @returns {string}
   */
  const run = (condition, data) =>
    handlebars.compile(convertMaizzleConditionals(`<if condition="${condition}">SI</if>`))(data);

  test("resuelve comparaciones e igualdad estricta", () => {
    expect(run("variant === 'v2'", { variant: "v2" })).toBe("SI");
    expect(run("variant === 'v2'", { variant: "v1" })).toBe("");
    expect(run("total >= 3", { total: 3 })).toBe("SI");
    expect(run("total >= 3", { total: 2 })).toBe("");
  });

  test("resuelve negación y operadores lógicos", () => {
    expect(run("!showButton", { showButton: false })).toBe("SI");
    expect(run("a && b", { a: true, b: false })).toBe("");
    expect(run("a || b", { a: false, b: true })).toBe("SI");
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
