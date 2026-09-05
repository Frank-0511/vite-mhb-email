// @ts-check
/**
 * @fileoverview Tests de integración del validador de variables ESP `{{ }}` y su fachada.
 */

import { describe, expect, test } from "bun:test";
import {
  ESP_SEVERITY,
  FRONTMATTER_METADATA_KEYS,
  extractEspVariables,
  filterDataKeys,
  frontmatterKeys,
  parseEspFrontmatter,
  validateEspVariables,
} from "./esp-variables.js";

describe("esp-variables fachada y contratos públicos", () => {
  test("re-exporta todas las funciones y constantes de los submódulos", () => {
    expect(typeof validateEspVariables).toBe("function");
    expect(typeof extractEspVariables).toBe("function");
    expect(typeof filterDataKeys).toBe("function");
    expect(typeof parseEspFrontmatter).toBe("function");
    expect(typeof frontmatterKeys).toBe("function");
    expect(ESP_SEVERITY).toBeDefined();
    expect(FRONTMATTER_METADATA_KEYS).toBeDefined();
  });

  test("define severidad WARNING para missing e INFO para unused", () => {
    expect(ESP_SEVERITY.missing).toBe("WARNING");
    expect(ESP_SEVERITY.unused).toBe("INFO");
  });

  test("el objeto de severidades está congelado contra mutaciones", () => {
    expect(Object.isFrozen(ESP_SEVERITY)).toBe(true);
  });
});

describe("validateEspVariables — coincidencia", () => {
  test("data y template coinciden exactamente → sin issues", () => {
    const source = `<p>{{ first_name }} de {{ company }}</p>`;
    const data = { first_name: "Frank", company: "Mi Empresa" };
    const result = validateEspVariables({ source, data });
    expect(result.missing).toEqual([]);
    expect(result.unused).toEqual([]);
  });
});

describe("validateEspVariables — faltante (WARNING)", () => {
  test("variable referenciada pero ausente en data → missing", () => {
    const source = `<p>{{ first_name }} - {{ company }}</p>`;
    const data = { first_name: "Frank" };
    const result = validateEspVariables({ source, data });
    expect(result.missing).toEqual(["company"]);
    expect(result.unused).toEqual([]);
  });

  test("data vacío con template que tiene variables → todas missing", () => {
    const source = `<p>{{ a }} y {{ b }}</p>`;
    const result = validateEspVariables({ source, data: {} });
    expect(result.missing.sort()).toEqual(["a", "b"]);
  });

  test("data null/undefined → todas las variables del template son missing", () => {
    const source = `<p>{{ only }}</p>`;
    const result = validateEspVariables({ source, data: null });
    expect(result.missing).toEqual(["only"]);
  });
});

describe("validateEspVariables — sobrante (INFO)", () => {
  test("clave en data que no se usa en el template → unused", () => {
    const source = `<p>{{ first_name }}</p>`;
    const data = { first_name: "Frank", company: "Mi Empresa" };
    const result = validateEspVariables({ source, data });
    expect(result.unused).toEqual(["company"]);
    expect(result.missing).toEqual([]);
  });
});

describe("validateEspVariables — variables ESP intencionales", () => {
  test("variable listada en espVariables NO aparece como missing", () => {
    const source = `---
espVariables:
  - opt_in_url
---
<p>Confirma {{ opt_in_url }}</p>`;
    const data = { first_name: "Frank" };
    const result = validateEspVariables({ source, data });
    expect(result.missing).toEqual([]);
  });

  test("variable intencional sigue contando como ESP referenciada (no unused)", () => {
    const source = `---
espVariables:
  - opt_in_url
---
<p>Confirma {{ opt_in_url }}</p>`;
    const data = { first_name: "Frank" };
    const result = validateEspVariables({ source, data });
    // opt_in_url está referenciada; no debe aparecer como unused.
    expect(result.unused).toEqual(["first_name"]);
  });

  test("mezcla: intencional no genera missing, y variables usadas no son unused", () => {
    const source = `---
espVariables:
  - reserved
---
<p>{{ reserved }} - {{ dynamic }}</p>`;
    const data = { dynamic: "X" };
    const result = validateEspVariables({ source, data });
    expect(result.missing).toEqual([]);
    expect(result.unused).toEqual([]);
  });

  test("espVariables en formato inline JSON-like funciona igual", () => {
    const source = `---
espVariables: ["x"]
---
<p>{{ x }} {{ y }}</p>`;
    const data = { y: "Y" };
    const result = validateEspVariables({ source, data });
    expect(result.missing).toEqual([]);
    expect(result.unused).toEqual([]);
  });
});

describe("validateEspVariables — robustez", () => {
  test("data.json inválido (no objeto) no rompe la validación", () => {
    const source = `<p>{{ a }}</p>`;
    const result = validateEspVariables({ source, data: "string" });
    expect(result.missing).toEqual(["a"]);
    expect(result.unused).toEqual([]);
  });

  test("data con valores anidados no añade claves de sub-objeto a unused", () => {
    const source = `<p>{{ first_name }}</p>`;
    const data = { first_name: "Frank", meta: { tag: "x" } };
    const result = validateEspVariables({ source, data });
    expect(result.unused).toEqual([]);
  });

  test("frontmatter metadata no se considera variable ESP sobrante", () => {
    const source = `---\ntitleTemplate: Demo\n---\n<p>{{ first_name }}</p>`;
    const result = validateEspVariables({
      source,
      data: { first_name: "Frank", titleTemplate: "Demo" },
    });
    expect(result.unused).toEqual([]);
  });
});

describe("validateEspVariables — orden estable y composición", () => {
  test("ordena alfabéticamente los arrays missing y unused", () => {
    const source = `<p>{{ zebra }} {{ alpha }} {{ mango }}</p>`;
    const data = {
      zoo: "1",
      apple: "2",
      banana: "3",
    };
    const result = validateEspVariables({ source, data });
    expect(result.missing).toEqual(["alpha", "mango", "zebra"]);
    expect(result.unused).toEqual(["apple", "banana", "zoo"]);
  });

  test("respeta espVariables intencionales combinadas con claves normales y layout", () => {
    const source = `---
espVariables:
  - unsubscribe_url
  - web_version_url
---
<p>Hola {{ first_name }}, puedes darte de baja en {{ unsubscribe_url }}.</p>`;
    const data = {
      first_name: "Frank",
      unused_prop: "valor",
    };
    const result = validateEspVariables({ source, data });
    expect(result.missing).toEqual([]);
    expect(result.unused).toEqual(["unused_prop"]);
  });
});
