import { describe, expect, test } from "bun:test";
import { buildExampleData } from "./example-data.ts";

describe("buildExampleData", () => {
  test("copia valores primitivos normales como strings", () => {
    const data = {
      dashboard_url: "https://miempresa.com/dashboard",
      year: 2026,
      is_active: true,
    };
    const result = buildExampleData(["dashboard_url", "year", "is_active"], data);
    expect(result).toEqual({
      dashboard_url: "https://miempresa.com/dashboard",
      is_active: "true",
      year: "2026",
    });
  });

  test("reemplaza claves sensibles por placeholder <clave>", () => {
    const data = {
      email: "frank@miempresa.com",
      temp_password: "Xk9#mP2!",
      first_name: "Frank",
      customer_name: "Acme Corp",
      phone: "+1234567890",
    };
    const result = buildExampleData(
      ["email", "temp_password", "first_name", "customer_name", "phone"],
      data,
    );
    expect(result).toEqual({
      customer_name: "<customer_name>",
      email: "<email>",
      first_name: "<first_name>",
      phone: "<phone>",
      temp_password: "<temp_password>",
    });
  });

  test("reemplaza valores sensibles como tokens por placeholder <clave>", () => {
    const data = {
      reset_url: "https://miempresa.com/reset?token=secret123",
      login_link: "https://miempresa.com/login?magic_token=abc",
    };
    const result = buildExampleData(["reset_url", "login_link"], data);
    expect(result).toEqual({
      login_link: "<login_link>",
      reset_url: "<reset_url>",
    });
  });

  test("omite claves sin dato en data.json", () => {
    const data = { title: "Bienvenido" };
    const result = buildExampleData(["title", "subtitle", "missing_var"], data);
    expect(result).toEqual({ title: "Bienvenido" });
  });

  test("omite valores complejos (objetos, arrays, null, undefined)", () => {
    const data = {
      items: ["uno", "dos"],
      nested: { a: 1 },
      empty_null: null,
      empty_undef: undefined,
      valid: "ok",
    };
    const result = buildExampleData(
      ["items", "nested", "empty_null", "empty_undef", "valid"],
      data,
    );
    expect(result).toEqual({ valid: "ok" });
  });

  test("devuelve objeto vacío ante data no objeto o inválido", () => {
    expect(buildExampleData(["var1"], null)).toEqual({});
    expect(buildExampleData(["var1"], undefined)).toEqual({});
    expect(buildExampleData(["var1"], "cadena")).toEqual({});
    expect(buildExampleData(["var1"], 123)).toEqual({});
    expect(buildExampleData(["var1"], ["item"])).toEqual({});
  });

  test("devuelve las claves en orden alfabético", () => {
    const data = { z: "1", a: "2", m: "3" };
    const result = buildExampleData(["z", "a", "m"], data);
    expect(Object.keys(result)).toEqual(["a", "m", "z"]);
  });
});
