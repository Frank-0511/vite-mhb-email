import { describe, expect, test } from "vitest";
import { isEspManifest } from "./guard.ts";
import type { EspManifest } from "./types.ts";

describe("isEspManifest", () => {
  const validManifest: EspManifest = {
    version: 1,
    profiles: ["sendgrid", "sendgrid-legacy"],
    templates: {
      welcome: {
        file: "welcome.html",
        requiredVariables: ["dashboard_url", "first_name"],
        intentionalVariables: ["role"],
        exampleData: {
          first_name: "<first_name>",
          dashboard_url: "https://miempresa.com",
        },
        legacy: {
          convertible: true,
          tags: {
            dashboard_url: "-dashboard_url-",
            first_name: "-first_name-",
          },
          issues: [],
        },
      },
    },
  };

  test("retorna true para un manifiesto válido", () => {
    expect(isEspManifest(validManifest)).toBe(true);
  });

  test("retorna false para valores nulos o no objetos", () => {
    expect(isEspManifest(null)).toBe(false);
    expect(isEspManifest(undefined)).toBe(false);
    expect(isEspManifest("cadena")).toBe(false);
    expect(isEspManifest(123)).toBe(false);
    expect(isEspManifest([])).toBe(false);
  });

  test("retorna false si version no es 1", () => {
    expect(isEspManifest({ ...validManifest, version: 2 })).toBe(false);
    expect(isEspManifest({ ...validManifest, version: "1" })).toBe(false);
  });

  test("retorna false si profiles contiene IDs desconocidos o no es array", () => {
    expect(isEspManifest({ ...validManifest, profiles: "sendgrid" })).toBe(false);
    expect(isEspManifest({ ...validManifest, profiles: ["unknown-profile"] })).toBe(false);
  });

  test("retorna false si templates no es objeto o falta", () => {
    expect(isEspManifest({ ...validManifest, templates: null })).toBe(false);
    expect(isEspManifest({ ...validManifest, templates: [] })).toBe(false);
  });

  test("retorna false si un template carece de file o no es string", () => {
    const invalid = {
      ...validManifest,
      templates: {
        welcome: { ...validManifest.templates.welcome, file: 123 },
      },
    };
    expect(isEspManifest(invalid)).toBe(false);
  });

  test("retorna false si requiredVariables o intentionalVariables no son arrays de strings", () => {
    const invalidReq = {
      ...validManifest,
      templates: {
        welcome: { ...validManifest.templates.welcome, requiredVariables: "var" },
      },
    };
    expect(isEspManifest(invalidReq)).toBe(false);

    const invalidInt = {
      ...validManifest,
      templates: {
        welcome: { ...validManifest.templates.welcome, intentionalVariables: [123] },
      },
    };
    expect(isEspManifest(invalidInt)).toBe(false);
  });

  test("retorna false si exampleData contiene valores no string o no es objeto", () => {
    const invalidObj = {
      ...validManifest,
      templates: {
        welcome: { ...validManifest.templates.welcome, exampleData: null },
      },
    };
    expect(isEspManifest(invalidObj)).toBe(false);

    const invalidVal = {
      ...validManifest,
      templates: {
        welcome: {
          ...validManifest.templates.welcome,
          exampleData: { first_name: 123 },
        },
      },
    };
    expect(isEspManifest(invalidVal)).toBe(false);
  });

  test("retorna false si legacy es inválido (convertible, tags o issues)", () => {
    const invalidConvertible = {
      ...validManifest,
      templates: {
        welcome: {
          ...validManifest.templates.welcome,
          legacy: { ...validManifest.templates.welcome.legacy, convertible: "true" },
        },
      },
    };
    expect(isEspManifest(invalidConvertible)).toBe(false);

    const invalidTags = {
      ...validManifest,
      templates: {
        welcome: {
          ...validManifest.templates.welcome,
          legacy: { ...validManifest.templates.welcome.legacy, tags: { a: 123 } },
        },
      },
    };
    expect(isEspManifest(invalidTags)).toBe(false);

    const invalidIssues = {
      ...validManifest,
      templates: {
        welcome: {
          ...validManifest.templates.welcome,
          legacy: { ...validManifest.templates.welcome.legacy, issues: [404] },
        },
      },
    };
    expect(isEspManifest(invalidIssues)).toBe(false);
  });
});
