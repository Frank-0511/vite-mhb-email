// @ts-check
import { describe, expect, test } from "bun:test";
import { filterDataKeys } from "./esp-data-filter.js";

describe("filterDataKeys — filtrado de claves de data", () => {
  test("devuelve array vacío ante datos no válidos (null, undefined, primitivos, arrays)", () => {
    expect(filterDataKeys(null)).toEqual([]);
    expect(filterDataKeys(undefined)).toEqual([]);
    expect(filterDataKeys("string")).toEqual([]);
    expect(filterDataKeys(123)).toEqual([]);
    expect(filterDataKeys(true)).toEqual([]);
    expect(filterDataKeys(["a", "b"])).toEqual([]);
  });

  test("devuelve array vacío para objeto vacío", () => {
    expect(filterDataKeys({})).toEqual([]);
  });

  test("conserva propiedades primitivas de primer nivel (string, number, boolean, null)", () => {
    const data = {
      user_name: "Frank",
      login_count: 5,
      is_active: true,
      middle_name: null,
    };
    const keys = filterDataKeys(data);
    expect(keys.sort()).toEqual(["is_active", "login_count", "middle_name", "user_name"]);
  });

  test("excluye propiedades cuyo valor es un objeto o array anidado", () => {
    const data = {
      valid_key: "hello",
      user_profile: { age: 30, role: "admin" },
      tags: ["news", "update"],
      empty_obj: {},
      empty_arr: [],
    };
    const keys = filterDataKeys(data);
    expect(keys).toEqual(["valid_key"]);
  });

  test("excluye claves reservadas de metadatos frontmatter por defecto", () => {
    const data = {
      title: "Título",
      previewText: "Preview",
      titleTemplate: "Plantilla",
      emailType: "marketing",
      espVariables: ["promo"],
      actual_content: "Hola",
    };
    const keys = filterDataKeys(data);
    expect(keys).toEqual(["actual_content"]);
  });

  test("excluye claves adicionales detectadas en el frontmatter del source", () => {
    const source = `---
theme: dark
layout: custom-layout
author: Admin
---
<p>{{ message }}</p>`;
    const data = {
      message: "Contenido",
      theme: "dark",
      layout: "custom-layout",
      author: "Admin",
      extra_var: "Extra",
    };
    const keys = filterDataKeys(data, source);
    expect(keys.sort()).toEqual(["extra_var", "message"]);
  });
});
