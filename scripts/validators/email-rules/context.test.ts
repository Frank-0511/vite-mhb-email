import { describe, expect, test } from "vitest";
import {
  extractInlineStyles,
  extractStyleContent,
  getContext,
  getLineNumber,
  parseCssDeclarations,
} from "./context.ts";

describe("getLineNumber", () => {
  test("cuenta la primera línea como 1", () => {
    expect(getLineNumber("<p>uno</p>\n<p>dos</p>", 0)).toBe(1);
  });

  test("ubica un índice en la línea correcta", () => {
    const html = "uno\ndos\ntres";

    expect(getLineNumber(html, html.indexOf("tres"))).toBe(3);
  });

  test("atribuye el salto de línea a la línea que cierra", () => {
    const html = "uno\ndos";

    expect(getLineNumber(html, html.indexOf("\n"))).toBe(1);
  });
});

describe("getContext", () => {
  test("colapsa espacios y recorta el fragmento alrededor del índice", () => {
    expect(getContext("<p>   hola    mundo   </p>", 3, 16)).toBe("hola mundo…");
  });

  test("no agrega elipsis cuando el fragmento llega al final del HTML", () => {
    expect(getContext("hola", 0, 100)).toBe("hola");
  });

  test("trata un índice negativo como el inicio del documento", () => {
    expect(getContext("hola mundo", -5, 4)).toBe("hola…");
  });

  test("devuelve una cadena vacía si el índice supera el largo del HTML", () => {
    expect(getContext("hola", 99)).toBe("");
  });
});

describe("extractStyleContent", () => {
  test("concatena el contenido de todos los bloques <style>", () => {
    expect(extractStyleContent("<style>.a{}</style><div></div><style>.b{}</style>")).toBe(
      ".a{}\n.b{}",
    );
  });

  test("conserva atributos del tag y respeta mayúsculas", () => {
    expect(extractStyleContent('<STYLE type="text/css">.a{}</STYLE>')).toBe(".a{}");
  });

  test("devuelve una cadena vacía si no hay <style>", () => {
    expect(extractStyleContent('<div style="color:red"></div>')).toBe("");
  });

  test("no arrastra contenido fuera de los bloques <style>", () => {
    expect(extractStyleContent("<style>.a{}</style><p>texto</p>")).not.toContain("texto");
  });
});

describe("extractInlineStyles", () => {
  test("devuelve el contenido de cada atributo style con comillas dobles o simples", () => {
    expect(
      extractInlineStyles("<p style=\"color:red\">a</p><td style='display:flex'>b</td>"),
    ).toEqual(["color:red", "display:flex"]);
  });

  test("no confunde atributos como data-style con style", () => {
    expect(extractInlineStyles('<p data-style="display:flex">a</p>')).toEqual([]);
  });

  test("no toma el contenido de <style> como estilo inline", () => {
    expect(extractInlineStyles("<style>.a{display:flex}</style>")).toEqual([]);
  });
});

describe("parseCssDeclarations", () => {
  test("separa declaraciones por ; y propiedad de valor por el primer :", () => {
    expect(parseCssDeclarations("color: red; background: url(http://a.com/x.png)")).toEqual([
      { property: "color", value: "red" },
      { property: "background", value: "url(http://a.com/x.png)" },
    ]);
  });

  test("normaliza el nombre de la propiedad a minúsculas y recorta espacios", () => {
    expect(parseCssDeclarations("  DISPLAY :  flex ")).toEqual([
      { property: "display", value: "flex" },
    ]);
  });

  test("elimina los comentarios /* */ antes de separar", () => {
    expect(parseCssDeclarations("/* display: flex; */ opacity: .5")).toEqual([
      { property: "opacity", value: ".5" },
    ]);
  });

  test("ignora el contenido de content con comillas", () => {
    expect(parseCssDeclarations('content: "display: flex; float: left"; color: red')).toEqual([
      { property: "content", value: '""' },
      { property: "color", value: "red" },
    ]);
  });

  test("descarta fragmentos sin dos puntos", () => {
    expect(parseCssDeclarations("basura; color: red")).toEqual([
      { property: "color", value: "red" },
    ]);
  });

  test("separa también por llaves para leer bloques de <style> con selectores", () => {
    expect(
      parseCssDeclarations(".a { display: flex } @media (max-width: 600px) { .b { float: left } }"),
    ).toEqual([
      { property: "display", value: "flex" },
      { property: "float", value: "left" },
    ]);
  });
});
