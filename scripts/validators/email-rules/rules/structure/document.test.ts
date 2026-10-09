import { afterEach, describe, expect, test } from "vitest";
import { cleanupContexts, createContext, ruleById } from "../../rules.fixtures.ts";

afterEach(cleanupContexts);

describe("doctype-present", () => {
  test("tolera espacios y mayúsculas pero rechaza el doctype XHTML", () => {
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
});

describe("meta-charset", () => {
  test("acepta utf8 sin guion y en mayúsculas", () => {
    expect(ruleById("meta-charset").check('<meta charset="UTF-8">', createContext())).toEqual([]);
    expect(ruleById("meta-charset").check('<meta charset="utf8">', createContext())).toEqual([]);
    expect(
      ruleById("meta-charset").check('<meta charset="iso-8859-1">', createContext()),
    ).toHaveLength(1);
  });
});

describe("color-scheme-meta", () => {
  test("solo reclama cuando hay dark mode sin declarar", () => {
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
});

describe("no-js-in-email", () => {
  test("reporta cada script con su línea y no confunde etiquetas parecidas", () => {
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
});

describe("title-present", () => {
  test("falla sin <title>", () => {
    expect(
      ruleById("title-present").check("<html><head></head></html>", createContext()),
    ).toHaveLength(1);
  });

  test("falla con <title> vacío o solo espacios", () => {
    expect(ruleById("title-present").check("<title></title>", createContext())).toHaveLength(1);
    expect(ruleById("title-present").check("<title>   \n  </title>", createContext())).toHaveLength(
      1,
    );
  });

  test("pasa con título no vacío", () => {
    expect(
      ruleById("title-present").check("<title>Bienvenido a Mi Empresa</title>", createContext()),
    ).toEqual([]);
    expect(ruleById("title-present").check("<title>{{title}}</title>", createContext())).toEqual(
      [],
    );
  });
});
