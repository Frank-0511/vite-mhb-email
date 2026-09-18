// @ts-check
import { describe, expect, test } from "bun:test";
import { filterDataKeys } from "./esp-data-filter.js";

describe("filterDataKeys", () => {
  test("conserva solo las claves escalares de primer nivel", () => {
    expect(
      filterDataKeys({
        first_name: "Ana",
        total: 1200,
        activo: true,
        vacio: null,
        items: [1, 2],
        config: { a: 1 },
      }),
    ).toEqual(["first_name", "total", "activo", "vacio"]);
  });

  test("descarta las claves de metadata reservadas del frontmatter", () => {
    expect(
      filterDataKeys({
        title: "Bienvenida",
        previewText: "Hola",
        titleTemplate: "%s",
        emailType: "marketing",
        espVariables: "x",
        first_name: "Ana",
      }),
    ).toEqual(["first_name"]);
  });

  test("descarta además las claves planas declaradas en el frontmatter del template", () => {
    const source = "---\nbrandColor: '#fff'\n---\n<p>{{ first_name }}</p>";

    expect(filterDataKeys({ brandColor: "#fff", first_name: "Ana" }, source)).toEqual([
      "first_name",
    ]);
  });

  test("ignora el frontmatter cuando el source no lo incluye", () => {
    expect(filterDataKeys({ brandColor: "#fff" }, "<p>Sin frontmatter</p>")).toEqual([
      "brandColor",
    ]);
  });

  test("devuelve una lista vacía para entradas que no son objetos planos", () => {
    expect(filterDataKeys(null)).toEqual([]);
    expect(filterDataKeys(undefined)).toEqual([]);
    expect(filterDataKeys([1, 2])).toEqual([]);
    expect(filterDataKeys("texto")).toEqual([]);
    expect(filterDataKeys({})).toEqual([]);
  });
});
