import { describe, expect, test } from "bun:test";
import {
  frontmatterKeys,
  parseEspFrontmatter,
  stripFrontmatter,
  unquote,
} from "./esp-frontmatter.ts";

describe("unquote", () => {
  test("quita comillas simples o dobles envolventes", () => {
    expect(unquote('"foo"')).toBe("foo");
    expect(unquote("'foo'")).toBe("foo");
  });

  test("respeta el token cuando las comillas no envuelven o no existen", () => {
    expect(unquote("foo")).toBe("foo");
    expect(unquote('"foo')).toBe('"foo');
    expect(unquote("\"foo'")).toBe("\"foo'");
  });

  test("devuelve la cadena vacía sin tocarla", () => {
    expect(unquote("")).toBe("");
  });
});

describe("stripFrontmatter", () => {
  test("elimina el bloque inicial y su salto de línea", () => {
    expect(stripFrontmatter("---\ntitle: Hola\n---\n<p>Cuerpo</p>")).toBe("<p>Cuerpo</p>");
  });

  test("soporta finales de línea CRLF", () => {
    expect(stripFrontmatter("---\r\ntitle: Hola\r\n---\r\n<p>Cuerpo</p>")).toBe("<p>Cuerpo</p>");
  });

  test("devuelve el source intacto si no hay frontmatter", () => {
    expect(stripFrontmatter("<p>Cuerpo</p>")).toBe("<p>Cuerpo</p>");
  });

  test("ignora un bloque que no arranca en la primera línea", () => {
    const source = "<p>Cuerpo</p>\n---\ntitle: Hola\n---\n";

    expect(stripFrontmatter(source)).toBe(source);
  });
});

describe("parseEspFrontmatter", () => {
  test("lee espVariables en formato lista YAML", () => {
    const source =
      "---\ntitle: Hola\nespVariables:\n  - first_name\n  - unsubscribe_url\n---\n<p></p>";

    expect(parseEspFrontmatter(source)).toEqual({
      espVariables: ["first_name", "unsubscribe_url"],
    });
  });

  test("lee espVariables en formato inline JSON-like y desentrecomilla", () => {
    const source = "---\nespVariables: [\"first_name\", 'unsubscribe_url']\n---\n<p></p>";

    expect(parseEspFrontmatter(source)).toEqual({
      espVariables: ["first_name", "unsubscribe_url"],
    });
  });

  test("devuelve un objeto vacío para una lista inline vacía", () => {
    expect(parseEspFrontmatter("---\nespVariables: []\n---\n<p></p>")).toEqual({
      espVariables: [],
    });
  });

  test("no lanza ante frontmatter ausente, vacío o de tipo inesperado", () => {
    expect(parseEspFrontmatter("<p>Sin frontmatter</p>")).toEqual({});
    expect(parseEspFrontmatter("---\ntitle: Hola\n---\n<p></p>")).toEqual({});
    expect(parseEspFrontmatter(null as unknown as string)).toEqual({});
    expect(parseEspFrontmatter(42 as unknown as string)).toEqual({});
  });
});

describe("frontmatterKeys", () => {
  test("devuelve un set vacío si no hay frontmatter", () => {
    expect(frontmatterKeys("<p>Cuerpo</p>").size).toBe(0);
  });

  test("agrega las claves planas declaradas a las reservadas del contrato", () => {
    const keys = frontmatterKeys("---\ntitle: Hola\nbrandColor: '#fff'\n---\n<p></p>");

    expect(keys.has("brandColor")).toBe(true);
    expect(keys.has("title")).toBe(true);
    expect(keys.has("emailType")).toBe(true);
    expect(keys.has("espVariables")).toBe(true);
  });

  test("ignora ítems de lista y líneas sin clave", () => {
    const keys = frontmatterKeys("---\nespVariables:\n  - first_name\n# comentario\n---\n<p></p>");

    expect(keys.has("first_name")).toBe(false);
  });

  test("no lanza con una entrada que no es string", () => {
    expect(frontmatterKeys(undefined as unknown as string).size).toBe(0);
  });
});
