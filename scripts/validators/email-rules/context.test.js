// @ts-check
import { describe, expect, test } from "bun:test";
import { extractStyleContent, getContext, getLineNumber, Severity } from "./context.js";

describe("Severity", () => {
  test("declara exactamente las tres severidades del contrato", () => {
    expect(Severity).toEqual({ ERROR: "ERROR", WARNING: "WARNING", INFO: "INFO" });
  });
});

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
