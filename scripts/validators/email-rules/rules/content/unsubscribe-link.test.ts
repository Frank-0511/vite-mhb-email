import { afterEach, describe, expect, test } from "bun:test";
import {
  cleanupContexts,
  createContext,
  ruleById,
  writeTemplateSource,
} from "../../rules.fixtures.ts";

afterEach(cleanupContexts);

describe("unsubscribe-link", () => {
  test("exime a los templates transaccionales declarados", () => {
    const context = createContext();
    writeTemplateSource(context, "receipt", "---\nemailType: transactional\n---\n<p>Hola</p>");

    expect(ruleById("unsubscribe-link").check("<p>Sin baja</p>", context)).toEqual([]);
  });

  test("acepta variantes en español e ignora mayúsculas", () => {
    const rule = ruleById("unsubscribe-link");
    expect(rule.check("<a href='x'>Darse de Baja</a>", createContext())).toEqual([]);
    expect(rule.check("<a href='x'>Cancelar Suscripción</a>", createContext())).toEqual([]);
  });

  test("reclama en un template de marketing sin baja", () => {
    const context = createContext();
    writeTemplateSource(context, "newsletter", "---\nemailType: marketing\n---\n<p>Hola</p>");

    expect(ruleById("unsubscribe-link").check("<p>Sin baja</p>", context)).toHaveLength(1);
  });
});
