// @ts-check
import { afterEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Severity } from "./context.js";
import { rules, runRules } from "./rules/index.js";

const temporaryDirectories = [];

/** @returns {{ projectRoot: string, filePath: string }} */
function createContext() {
  const projectRoot = mkdtempSync(join(tmpdir(), "email-validation-"));
  temporaryDirectories.push(projectRoot);
  return { projectRoot, filePath: join(projectRoot, "dist", "example.html") };
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

const cleanHtml =
  '<!doctype html><html><head><meta charset="utf-8"></head><body><a href="https://example.com/unsubscribe">Unsubscribe</a><img src="x" width="1" height="1" alt="x"></body></html>';

const cases = [
  ["img-dimensions", cleanHtml, '<img src="x" alt="x">'],
  ["img-alt", cleanHtml, '<img src="x" width="1" height="1">'],
  ["css-unsupported-props", cleanHtml, "<style>.x { display: flex; }</style>"],
  ["doctype-present", cleanHtml, "<html></html>"],
  ["meta-charset", cleanHtml, "<!doctype html><html></html>"],
  ["link-targets", cleanHtml, '<a href="#">Broken</a>'],
  ["max-width-check", cleanHtml, "<style>.max-w-email{ max-width: 800px; }</style>"],
  ["color-scheme-meta", cleanHtml, "<style>@media (prefers-color-scheme: dark) {}</style>"],
  [
    "unsubscribe-link",
    cleanHtml,
    '<!doctype html><html><head><meta charset="utf-8"></head></html>',
  ],
  ["no-js-in-email", cleanHtml, "<script>alert(1)</script>"],
  [
    "nested-tables-depth",
    cleanHtml,
    "<table><table><table><table><table></table></table></table></table></table>",
  ],
  ["css-class-vs-inline", cleanHtml, "<style>.one { color: red; }</style>"],
];

describe("reglas de compatibilidad", () => {
  test.each(cases)(
    "%s conserva el caso positivo y reporta el negativo",
    (ruleId, positive, negative) => {
      const rule = rules.find((candidate) => candidate.id === ruleId);
      expect(rule).toBeDefined();
      const context = createContext();
      expect(rule.check(positive, context)).toEqual([]);
      const issues = rule.check(negative, context);
      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0].ruleId).toBe(ruleId);
      expect(issues[0].severity).toBe(rule.severity);
    },
  );

  test("esp-variables conserva faltantes como WARNING y sobrantes como INFO", () => {
    const context = createContext();
    const templateRoot = join(context.projectRoot, "src", "emails", "templates", "example");
    mkdirSync(templateRoot, { recursive: true });
    writeFileSync(join(templateRoot, "index.html"), "{{ missing }}", "utf8");
    writeFileSync(join(templateRoot, "data.json"), JSON.stringify({ unused: "value" }), "utf8");
    context.filePath = join(context.projectRoot, "dist", "example.html");

    const rule = rules.find((candidate) => candidate.id === "esp-variables");
    const issues = rule.check(cleanHtml, context);
    expect(issues.map((issue) => issue.severity)).toEqual([Severity.WARNING, Severity.INFO]);
  });

  test("cada regla registrada declara id, severidad y descripción únicos", () => {
    const ids = rules.map((rule) => rule.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const rule of rules) {
      expect(Object.values(Severity)).toContain(rule.severity);
      expect(rule.description.length).toBeGreaterThan(0);
    }
  });

  test("un fallo de regla se informa y no impide las restantes", () => {
    const context = createContext();
    const reported = [];
    const issues = runRules(
      cleanHtml,
      context,
      [
        {
          id: "fails",
          severity: Severity.ERROR,
          description: "fails",
          check: () => {
            throw new Error("boom");
          },
        },
        {
          id: "continues",
          severity: Severity.INFO,
          description: "continues",
          check: () => [{ ruleId: "continues", severity: Severity.INFO, message: "still runs" }],
        },
      ],
      (rule, error) => reported.push([rule.id, error.message]),
    );

    expect(reported).toEqual([["fails", "boom"]]);
    expect(issues).toHaveLength(1);
    expect(issues[0].ruleId).toBe("continues");
  });
});

/**
 * @param {string} ruleId
 * @returns {import("./context.js").Rule}
 */
function ruleById(ruleId) {
  const rule = rules.find((candidate) => candidate.id === ruleId);
  if (!rule) throw new Error(`Regla no registrada: ${ruleId}`);
  return rule;
}

/**
 * Escribe un template fuente con frontmatter para las reglas que leen disco.
 * @param {{ projectRoot: string, filePath: string }} context
 * @param {string} templateName
 * @param {string} source
 * @param {Record<string, unknown>} [data]
 */
function writeTemplateSource(context, templateName, source, data) {
  const templateRoot = join(context.projectRoot, "src", "emails", "templates", templateName);
  mkdirSync(templateRoot, { recursive: true });
  writeFileSync(join(templateRoot, "index.html"), source, "utf8");
  if (data !== undefined) {
    writeFileSync(join(templateRoot, "data.json"), JSON.stringify(data), "utf8");
  }
  context.filePath = join(context.projectRoot, "dist", `${templateName}.html`);
}

describe("casos borde por regla de compatibilidad", () => {
  test("img-dimensions nombra solo el atributo ausente y reporta cada imagen", () => {
    const issues = ruleById("img-dimensions").check(
      '<img src="a" height="1" alt="a"><img src="b" width="1" alt="b">',
      createContext(),
    );

    expect(issues).toHaveLength(2);
    expect(issues[0].message).toContain("width");
    expect(issues[0].message).not.toContain("height");
    expect(issues[1].message).toContain("height");
    expect(issues[1].message).not.toContain("width");
  });

  test("img-dimensions acepta comillas simples y no exige unidades", () => {
    expect(
      ruleById("img-dimensions").check(
        "<img src='a' width='600' height='200' alt='a'>",
        createContext(),
      ),
    ).toEqual([]);
  });

  test("img-alt distingue alt ausente de alt vacío o en blanco", () => {
    const issues = ruleById("img-alt").check(
      '<img src="a" width="1" height="1"><img src="b" width="1" height="1" alt=""><img src="c" width="1" height="1" alt="   ">',
      createContext(),
    );

    expect(issues).toHaveLength(3);
    expect(issues[0].message).toContain("sin atributo alt");
    expect(issues[1].message).toContain('alt=""');
    expect(issues[2].message).toContain('alt=""');
  });

  test("css-unsupported-props acumula una incidencia por propiedad y función", () => {
    const issues = ruleById("css-unsupported-props").check(
      "<style>.a { display: flex; width: calc(100% - 10px); }</style>",
      createContext(),
    );

    expect(issues).toHaveLength(2);
    expect(issues.map((issue) => issue.message).join(" ")).toContain("display: flex");
    expect(issues.map((issue) => issue.message).join(" ")).toContain("calc()");
  });

  test("css-unsupported-props ignora estilos inline fuera de <style> y prefijos con guion", () => {
    expect(
      ruleById("css-unsupported-props").check('<div style="display: flex"></div>', createContext()),
    ).toEqual([]);
    expect(
      ruleById("css-unsupported-props").check(
        "<style>.a { -webkit-transform: none; }</style>",
        createContext(),
      ),
    ).toEqual([]);
  });

  test("doctype-present tolera espacios y mayúsculas pero rechaza el doctype XHTML", () => {
    expect(
      ruleById("doctype-present").check("\n  <!DOCTYPE HTML><html></html>", createContext()),
    ).toEqual([]);
    expect(
      ruleById("doctype-present").check(
        '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN"><html></html>',
        createContext(),
      ),
    ).toHaveLength(1);
  });

  test("meta-charset acepta utf8 sin guion y en mayúsculas", () => {
    expect(ruleById("meta-charset").check('<meta charset="UTF-8">', createContext())).toEqual([]);
    expect(ruleById("meta-charset").check('<meta charset="utf8">', createContext())).toEqual([]);
    expect(
      ruleById("meta-charset").check('<meta charset="iso-8859-1">', createContext()),
    ).toHaveLength(1);
  });

  test("link-targets omite placeholders ESP, merge tags y mailto", () => {
    expect(
      ruleById("link-targets").check(
        '<a href="{{ unsubscribe_url }}">a</a><a href="*|UNSUB|*">b</a><a href="mailto:hola@example.com">c</a>',
        createContext(),
      ),
    ).toEqual([]);
  });

  test("link-targets reporta href vacío distinguiéndolo del ancla", () => {
    const issues = ruleById("link-targets").check(
      '<a href="">a</a><a href="#">b</a>',
      createContext(),
    );

    expect(issues).toHaveLength(2);
    expect(issues[0].message).toContain("(vacío)");
    expect(issues[1].message).toContain('href="#"');
  });

  test("max-width-check usa 700px como límite inclusivo en px y rem", () => {
    const rule = ruleById("max-width-check");
    expect(rule.check("<style>.max-w-email{max-width:700px}</style>", createContext())).toEqual([]);
    expect(rule.check("<style>.max-w-email{max-width:43.75rem}</style>", createContext())).toEqual(
      [],
    );
    expect(
      rule.check("<style>.max-w-email{max-width:701px}</style>", createContext()),
    ).toHaveLength(1);
    expect(
      rule.check("<style>.max-w-email{max-width:44rem}</style>", createContext()),
    ).toHaveLength(1);
  });

  test("max-width-check no opina si no hay clase .max-w-*", () => {
    expect(
      ruleById("max-width-check").check(
        "<style>.wrapper{max-width:900px}</style>",
        createContext(),
      ),
    ).toEqual([]);
  });

  test("color-scheme-meta solo reclama cuando hay dark mode sin declarar", () => {
    const rule = ruleById("color-scheme-meta");
    expect(rule.check("<style>.a{color:red}</style>", createContext())).toEqual([]);
    expect(
      rule.check(
        '<meta name="color-scheme" content="light dark"><style>@media (prefers-color-scheme: dark){}</style>',
        createContext(),
      ),
    ).toEqual([]);
    expect(rule.check("<style>.dark-bg{color:#fff}</style>", createContext())).toHaveLength(1);
  });

  test("no-js-in-email reporta cada script con su línea y no confunde etiquetas parecidas", () => {
    const issues = ruleById("no-js-in-email").check(
      "<script>a()</script>\n<div></div>\n<script src='x'></script>",
      createContext(),
    );

    expect(issues).toHaveLength(2);
    expect(issues[0].line).toBe(1);
    expect(issues[1].line).toBe(3);
    expect(
      ruleById("no-js-in-email").check("<noscript>sin js</noscript>", createContext()),
    ).toEqual([]);
  });

  test("nested-tables-depth admite 4 niveles y reporta a partir del quinto", () => {
    const rule = ruleById("nested-tables-depth");
    const nest = (depth) => "<table>".repeat(depth) + "</table>".repeat(depth);
    expect(rule.check(nest(4), createContext())).toEqual([]);
    const issues = rule.check(nest(5), createContext());
    expect(issues).toHaveLength(1);
    expect(issues[0].message).toContain("5 niveles");
  });

  test("nested-tables-depth no acumula profundidad entre tablas hermanas", () => {
    expect(
      ruleById("nested-tables-depth").check("<table></table>".repeat(6), createContext()),
    ).toEqual([]);
  });

  test("css-class-vs-inline calla cuando hay estilos inline y pocas reglas", () => {
    expect(
      ruleById("css-class-vs-inline").check(
        '<style>.a{color:red}</style><div style="color:red"></div>',
        createContext(),
      ),
    ).toEqual([]);
  });

  test("css-class-vs-inline reporta muchas reglas con inline insuficiente", () => {
    const manyRules = Array.from({ length: 21 }, (_, index) => `.c${index}{color:red}`).join("");
    const issues = ruleById("css-class-vs-inline").check(
      `<style>${manyRules}</style><div style="color:red"></div>`,
      createContext(),
    );

    expect(issues).toHaveLength(1);
    expect(issues[0].message).toContain("21 reglas CSS");
  });

  test("css-class-vs-inline no opina sobre un HTML sin <style>", () => {
    expect(
      ruleById("css-class-vs-inline").check('<div style="color:red"></div>', createContext()),
    ).toEqual([]);
  });

  test("unsubscribe-link exime a los templates transaccionales declarados", () => {
    const context = createContext();
    writeTemplateSource(context, "receipt", "---\nemailType: transactional\n---\n<p>Hola</p>");

    expect(ruleById("unsubscribe-link").check("<p>Sin baja</p>", context)).toEqual([]);
  });

  test("unsubscribe-link acepta variantes en español e ignora mayúsculas", () => {
    const rule = ruleById("unsubscribe-link");
    expect(rule.check("<a href='x'>Darse de Baja</a>", createContext())).toEqual([]);
    expect(rule.check("<a href='x'>Cancelar Suscripción</a>", createContext())).toEqual([]);
  });

  test("unsubscribe-link reclama en un template de marketing sin baja", () => {
    const context = createContext();
    writeTemplateSource(context, "newsletter", "---\nemailType: marketing\n---\n<p>Hola</p>");

    expect(ruleById("unsubscribe-link").check("<p>Sin baja</p>", context)).toHaveLength(1);
  });

  test("esp-variables no opina si el template fuente no existe", () => {
    expect(ruleById("esp-variables").check(cleanHtml, createContext())).toEqual([]);
  });

  test("esp-variables trata un data.json ilegible como datos vacíos", () => {
    const context = createContext();
    writeTemplateSource(context, "broken", "{{ first_name }}");
    writeFileSync(
      join(context.projectRoot, "src", "emails", "templates", "broken", "data.json"),
      "{ no es json",
      "utf8",
    );

    const issues = ruleById("esp-variables").check(cleanHtml, context);
    expect(issues).toHaveLength(1);
    expect(issues[0].severity).toBe(Severity.WARNING);
    expect(issues[0].message).toContain("first_name");
  });

  test("esp-variables queda en silencio cuando template y data.json coinciden", () => {
    const context = createContext();
    writeTemplateSource(context, "aligned", "{{ first_name }}", { first_name: "Ana" });

    expect(ruleById("esp-variables").check(cleanHtml, context)).toEqual([]);
  });
});
