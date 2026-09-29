import { describe, expect, test } from "bun:test";
import { ESP_PROFILES, type EspProfile } from "../../shared/contracts/constants/esp-contract.ts";
import { findUnsupportedSyntax } from "./profile-syntax.ts";

describe("profile-syntax", () => {
  const sendgrid = ESP_PROFILES.sendgrid;
  const legacy = ESP_PROFILES["sendgrid-legacy"];

  describe("perfil sendgrid", () => {
    test("detecta subexpresión con helper no soportado eq", () => {
      const violations = findUnsupportedSyntax("{{#if (eq a b)}}x{{/if}}", sendgrid);
      expect(violations.length).toBe(1);
      expect(violations[0].reason).toContain('"eq"');
    });

    test("permite subexpresión con helper soportado equals", () => {
      const violations = findUnsupportedSyntax("{{#if (equals a b)}}x{{/if}}", sendgrid);
      expect(violations).toEqual([]);
    });

    test("detecta helper en línea no soportado eq", () => {
      const violations = findUnsupportedSyntax("{{ eq a b }}", sendgrid);
      expect(violations.length).toBe(1);
      expect(violations[0].reason).toContain('"eq"');
    });

    test("permite helpers en línea soportados (formatDate, insert, length)", () => {
      expect(findUnsupportedSyntax('{{ formatDate fecha "MM/DD" }}', sendgrid)).toEqual([]);
      expect(findUnsupportedSyntax('{{ insert nombre "Cliente" }}', sendgrid)).toEqual([]);
      expect(findUnsupportedSyntax("{{ length items }}", sendgrid)).toEqual([]);
    });

    test("permite helper como bloque (equals)", () => {
      const violations = findUnsupportedSyntax('{{#equals a "b"}}x{{/equals}}', sendgrid);
      expect(violations).toEqual([]);
    });

    test("permite bloque nativo with y detecta bloque desconocido foo", () => {
      expect(findUnsupportedSyntax("{{#with x}}{{/with}}", sendgrid)).toEqual([]);
      const violations = findUnsupportedSyntax("{{#foo x}}{{/foo}}", sendgrid);
      expect(violations.length).toBeGreaterThanOrEqual(1);
      expect(violations[0].reason).toContain('"foo"');
    });

    test("permite bloque each con variables de contexto, índices y anidadas", () => {
      const template = "{{#each items}}{{this}} {{@index}} {{@key}} {{../padre}} {{a.b}}{{/each}}";
      expect(findUnsupportedSyntax(template, sendgrid)).toEqual([]);
    });

    test("permite estructuras if / else if / else sin helpers inválidos", () => {
      const template = "{{#if a}}x{{else if b}}y{{else}}z{{/if}}";
      expect(findUnsupportedSyntax(template, sendgrid)).toEqual([]);
    });

    test("detecta helper inválido dentro de else if", () => {
      const violations = findUnsupportedSyntax("{{else if (eq a b)}}", sendgrid);
      expect(violations.length).toBe(1);
      expect(violations[0].reason).toContain('"eq"');
    });

    test("detecta llamada a partials", () => {
      const violations = findUnsupportedSyntax("{{> partial}}", sendgrid);
      expect(violations.length).toBe(1);
      expect(violations[0].reason).toContain("partials");
    });

    test("ignora comentarios estándar y con guiones", () => {
      expect(findUnsupportedSyntax("{{! comentario }}", sendgrid)).toEqual([]);
      expect(findUnsupportedSyntax("{{!-- comentario --}}", sendgrid)).toEqual([]);
    });

    test("permite variables simples y raw triple-stash", () => {
      expect(findUnsupportedSyntax("{{ first_name }}", sendgrid)).toEqual([]);
      expect(findUnsupportedSyntax("{{title}}", sendgrid)).toEqual([]);
      expect(findUnsupportedSyntax("{{{ raw_html }}}", sendgrid)).toEqual([]);
    });

    test("permite HTML plano sin mustaches", () => {
      expect(findUnsupportedSyntax("<div><p>Hola mundo</p></div>", sendgrid)).toEqual([]);
    });

    test("admite perfil personalizado con allowlist configurable", () => {
      const customProfile: EspProfile = {
        id: "custom",
        label: "Custom Profile",
        syntax: "handlebars",
        blocks: ["if"],
        helpers: ["eq"],
      };
      expect(findUnsupportedSyntax("{{ eq a b }}", customProfile)).toEqual([]);
    });
  });

  describe("perfil sendgrid-legacy", () => {
    test("permite variable plana simple", () => {
      expect(findUnsupportedSyntax("{{ first_name }}", legacy)).toEqual([]);
    });

    test("detecta bloques condicionales (sin lógica)", () => {
      const violations = findUnsupportedSyntax("{{#if a}}x{{/if}}", legacy);
      expect(violations.length).toBeGreaterThanOrEqual(1);
      expect(violations[0].reason).toContain("sin lógica ni helpers");
    });

    test("detecta helpers en modo sustitución", () => {
      const violations = findUnsupportedSyntax('{{ formatDate f "x" }}', legacy);
      expect(violations.length).toBe(1);
      expect(violations[0].reason).toContain("sin lógica ni helpers");
    });

    test("detecta rutas anidadas y variables especiales de Handlebars", () => {
      const nested = findUnsupportedSyntax("{{ a.b }}", legacy);
      expect(nested.length).toBe(1);
      expect(nested[0].reason).toContain("sin lógica ni helpers");

      const thisVar = findUnsupportedSyntax("{{this}}", legacy);
      expect(thisVar.length).toBe(1);
      expect(thisVar[0].reason).toContain("sin lógica ni helpers");

      const indexVar = findUnsupportedSyntax("{{@index}}", legacy);
      expect(indexVar.length).toBe(1);
      expect(indexVar[0].reason).toContain("sin lógica ni helpers");

      const parentVar = findUnsupportedSyntax("{{../x}}", legacy);
      expect(parentVar.length).toBe(1);
      expect(parentVar[0].reason).toContain("sin lógica ni helpers");
    });
  });
});
