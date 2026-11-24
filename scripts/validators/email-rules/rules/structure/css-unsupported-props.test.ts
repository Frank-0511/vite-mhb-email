import { afterEach, describe, expect, test } from "vitest";
import { Severity, type Issue } from "../../context.ts";
import { cleanupContexts, createContext, ruleById } from "../../rules.fixtures.ts";

afterEach(cleanupContexts);

function check(html: string): Issue[] {
  return ruleById("css-unsupported-props").check(html, createContext());
}

describe("css-unsupported-props", () => {
  test("acumula una incidencia por propiedad y función", () => {
    const issues = ruleById("css-unsupported-props").check(
      "<style>.a { display: flex; width: calc(100% - 10px); }</style>",
      createContext(),
    );

    expect(issues).toHaveLength(2);
    expect(issues.map((issue) => issue.message).join(" ")).toContain("display: flex");
    expect(issues.map((issue) => issue.message).join(" ")).toContain("calc()");
  });

  test("detecta estilos inline con comillas dobles o simples, además de <style>", () => {
    const inline = check('<div style="display: flex"></div>');
    const inlineSingle = check("<td style='float: left'></td>");

    expect(inline).toHaveLength(1);
    expect(inline[0].message).toContain("display: flex");
    expect(inline[0].message).toContain("en estilo inline");
    expect(inlineSingle).toHaveLength(1);
    expect(inlineSingle[0].message).toContain("float");
  });

  test("indica si la propiedad aparece en <style>, inline o ambos, y lo deduplica", () => {
    const styleOnly = check("<style>.a { display: flex; }</style>");
    const both = check('<style>.a { display: flex; }</style><div style="display: flex"></div>');

    expect(styleOnly).toHaveLength(1);
    expect(styleOnly[0].message).toContain("en <style>");
    expect(both).toHaveLength(1);
    expect(both[0].message).toContain("en <style> y en estilo inline");
  });

  test("una propiedad repetida en varios bloques produce una sola incidencia", () => {
    const issues = check('<style>.a{opacity:.5}.b{opacity:.2}</style><p style="opacity:1"></p>');

    expect(issues).toHaveLength(1);
    expect(issues[0].severity).toBe(Severity.WARNING);
  });

  test("prefijos con guion (-webkit-transform, -webkit-box-shadow) siguen ignorados", () => {
    expect(
      check(
        '<style>.a { -webkit-transform: none; -webkit-box-shadow: none; }</style><p style="-webkit-transform: none"></p>',
      ),
    ).toEqual([]);
  });

  test("detecta inline-flex, inline-grid, row-gap, column-gap y grid-gap", () => {
    const messages = check(
      "<style>.a{display:inline-flex}.b{display:inline-grid}.c{row-gap:4px}.d{column-gap:4px}.e{grid-gap:4px}</style>",
    ).map((issue) => issue.message);

    expect(messages).toHaveLength(4);
    expect(messages.join(" ")).toContain("display: flex/grid/inline-flex/inline-grid");
    expect(messages.join(" ")).toContain("row-gap");
    expect(messages.join(" ")).toContain("column-gap");
    expect(messages.join(" ")).toContain("grid-gap");
  });

  test("detecta display: flex dentro de @media", () => {
    const issues = check("<style>@media (max-width: 600px) { .a { display: flex } }</style>");

    expect(issues).toHaveLength(1);
    expect(issues[0].severity).toBe(Severity.ERROR);
  });

  test("una propiedad dentro de un comentario CSS no genera incidencia", () => {
    expect(check("<style>/* display: flex; */ .a { color: red; }</style>")).toEqual([]);
    expect(check('<div style="/* float: left */ color: red"></div>')).toEqual([]);
  });

  test("una palabra dentro de content: no genera incidencia", () => {
    expect(check('<style>.a::before { content: "display: flex; float: left"; }</style>')).toEqual(
      [],
    );
  });

  test.each([
    { label: "display: flex", css: ".a{display:flex}" },
    { label: "display: grid", css: ".a{display:grid}" },
    { label: "display: inline-flex", css: ".a{display:inline-flex}" },
    { label: "display: inline-grid", css: ".a{display:inline-grid}" },
    { label: "float", css: ".a{float:left}" },
    { label: "position: absolute", css: ".a{position:absolute}" },
    { label: "position: fixed", css: ".a{position:fixed}" },
    { label: "position: sticky", css: ".a{position:sticky}" },
    { label: "gap", css: ".a{gap:8px}" },
    { label: "row-gap", css: ".a{row-gap:8px}" },
    { label: "column-gap", css: ".a{column-gap:8px}" },
    { label: "grid-gap", css: ".a{grid-gap:8px}" },
    { label: "calc()", css: ".a{width:calc(100% - 10px)}" },
    { label: "var()", css: ".a{color:var(--brand)}" },
    { label: "clamp()", css: ".a{width:clamp(1px,2vw,3px)}" },
  ])("ERROR para $label", ({ css }) => {
    const issues = check(`<style>${css}</style>`);

    expect(issues).toHaveLength(1);
    expect(issues[0].severity).toBe(Severity.ERROR);
  });

  test.each([
    { label: "opacity", css: ".a{opacity:.5}" },
    { label: "transform", css: ".a{transform:scale(2)}" },
    { label: "transition", css: ".a{transition:all 1s}" },
    { label: "animation", css: ".a{animation:spin 1s}" },
    { label: "aspect-ratio", css: ".a{aspect-ratio:16/9}" },
    { label: "object-fit", css: ".a{object-fit:cover}" },
    { label: "box-shadow", css: ".a{box-shadow:0 1px red}" },
    { label: "linear-gradient()", css: ".a{background:linear-gradient(red,blue)}" },
    { label: "filter", css: ".a{filter:blur(2px)}" },
    { label: "backdrop-filter", css: ".a{backdrop-filter:blur(2px)}" },
  ])("WARNING para $label", ({ css }) => {
    const issues = check(`<style>${css}</style>`);

    expect(issues).toHaveLength(1);
    expect(issues[0].severity).toBe(Severity.WARNING);
    expect(issues[0].ruleId).toBe("css-unsupported-props");
  });

  test("una plantilla con ERROR y WARNING emite cada incidencia con su severidad", () => {
    const issues = check("<style>.a{display:flex;opacity:.5}</style>");

    expect(issues.map((issue) => issue.severity)).toEqual([Severity.ERROR, Severity.WARNING]);
  });

  test("position: relative y display: block/table no generan incidencia", () => {
    expect(check("<style>.a{position:relative}.b{display:block}.c{display:table}</style>")).toEqual(
      [],
    );
  });

  test("CSS limpio (tablas, colores hex, px) no genera incidencias", () => {
    expect(
      check(
        '<style>table{width:600px;border-collapse:collapse}.c{color:#1a2b3c;padding:0}</style><table style="background-color:#fff;width:100%"></table>',
      ),
    ).toEqual([]);
  });
});
