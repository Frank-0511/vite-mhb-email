import { describe, expect, test } from "bun:test";
import { resolve } from "node:path";
import { getArchetypeById, getAvailableArchetypes } from "./archetypes.js";

const rootDir = resolve(import.meta.dir, "../..");

describe("archetypes (descubrimiento dinámico)", () => {
  describe("getAvailableArchetypes", () => {
    test("descubre dinámicamente todos los arquetipos en src/emails/partials/templates", () => {
      const archetypes = getAvailableArchetypes(rootDir);
      expect(archetypes.length).toBeGreaterThanOrEqual(5);

      const ids = archetypes.map((a) => a.id);
      expect(ids).toContain("starter");
      expect(ids).toContain("welcome");
      expect(ids).toContain("password-reset");
      expect(ids).toContain("receipt");
      expect(ids).toContain("newsletter");

      for (const a of archetypes) {
        expect(a.id).toBeString();
        expect(a.name).toBeString();
        expect(a.description).toBeString();
        expect(a.category).toBeString();
        expect(Array.isArray(a.espVariables)).toBe(true);
        expect(a.dirPath).toContain("src/emails/partials/templates");
      }
    });

    test("retorna array vacío si el directorio no existe", () => {
      const archetypes = getAvailableArchetypes("/non/existent/path");
      expect(archetypes).toEqual([]);
    });
  });

  describe("getArchetypeById", () => {
    test("obtiene la metadata de un arquetipo existente", () => {
      const welcome = getArchetypeById("welcome", rootDir);
      expect(welcome).not.toBeNull();
      expect(welcome?.id).toBe("welcome");
      expect(welcome?.category).toBe("Onboarding");

      const passReset = getArchetypeById("password-reset", rootDir);
      expect(passReset).not.toBeNull();
      expect(passReset?.id).toBe("password-reset");
      expect(passReset?.category).toBe("Transaccional");
    });

    test("retorna null para arquetipos inexistentes o rutas inválidas", () => {
      expect(getArchetypeById("non-existent", rootDir)).toBeNull();
      expect(getArchetypeById("../escape", rootDir)).toBeNull();
    });
  });
});
