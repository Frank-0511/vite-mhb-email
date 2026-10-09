import { describe, expect, test } from "vitest";
import { ESP_PROFILES } from "../../shared/contracts/constants/esp-contract.ts";
import { analyzeLegacyCompat, formatSubstitutionTag } from "./legacy-compat.ts";

describe("legacy-compat", () => {
  const legacyProfile = ESP_PROFILES["sendgrid-legacy"];
  const dynamicProfile = ESP_PROFILES.sendgrid;

  describe("formatSubstitutionTag", () => {
    test("formatea la variable con delimitadores de sustitución", () => {
      expect(formatSubstitutionTag(legacyProfile, "first_name")).toBe("-first_name-");
    });

    test("lanza error si el perfil no define delimitadores de sustitución", () => {
      expect(() => formatSubstitutionTag(dynamicProfile, "first_name")).toThrow(
        `El perfil ${dynamicProfile.id} no define delimitadores de sustitución`,
      );
    });
  });

  describe("analyzeLegacyCompat", () => {
    test("retorna sin violaciones ni colisiones para plantilla plana válida", () => {
      const result = analyzeLegacyCompat("<p>{{ first_name }}</p>");
      expect(result.violations).toEqual([]);
      expect(result.collisions).toEqual([]);
    });

    test("detecta violaciones de sintaxis no soportada en legacy", () => {
      const result = analyzeLegacyCompat("<p>{{#if a}}Hola{{/if}}</p>");
      expect(result.violations.length).toBeGreaterThanOrEqual(1);
    });

    test("detecta colisión cuando el texto literal contiene la etiqueta de una variable", () => {
      const html = "<p>Hola {{ first_name }}, tu código temporal es -first_name-.</p>";
      const result = analyzeLegacyCompat(html);
      expect(result.collisions).toEqual(["-first_name-"]);
    });

    test("ignora textos con guiones que no coincidan con variables existentes", () => {
      const html = "<p>{{ first_name }} a-b-c - un-texto-cualquiera</p>";
      const result = analyzeLegacyCompat(html);
      expect(result.collisions).toEqual([]);
    });
  });
});
