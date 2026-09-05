// @ts-check
import { describe, expect, test } from "bun:test";

import {
  copyTextToClipboard,
  formatErrorMessage,
  formatLoadingMessage,
  formatSuccessMessage,
  formatValidation,
} from "./copy-html-formatters.js";

describe("formatValidation", () => {
  test("devuelve cadena vacía si no hay objeto de validación o es inválido", () => {
    expect(formatValidation(undefined)).toBe("");
    expect(formatValidation(null)).toBe("");
    // @ts-expect-error probando valor no objeto
    expect(formatValidation("")).toBe("");
    // @ts-expect-error probando valor no objeto
    expect(formatValidation(123)).toBe("");
    expect(formatValidation({})).toBe("");
    expect(formatValidation({ missing: [], unused: [] })).toBe("");
  });

  test("formatea variables faltantes como advertencia", () => {
    const result = formatValidation({ missing: ["customerName", "ctaUrl"] });
    expect(result).toBe(" ⚠️ Variables faltantes: customerName, ctaUrl");
  });

  test("formatea variables sobrantes como información", () => {
    const result = formatValidation({ unused: ["legacyToken", "debugMode"] });
    expect(result).toBe(" ℹ️ Claves sin uso: legacyToken, debugMode");
  });

  test("combina faltantes y sobrantes con el delimitador correspondiente", () => {
    const result = formatValidation({
      missing: ["customerName"],
      unused: ["legacyToken"],
    });
    expect(result).toBe(" ⚠️ Variables faltantes: customerName · ℹ️ Claves sin uso: legacyToken");
  });

  test("se degrada con seguridad ante propiedades que no son arrays", () => {
    // @ts-expect-error propiedades inválidas
    expect(formatValidation({ missing: "cadena", unused: null })).toBe("");
  });
});

describe("formatLoadingMessage", () => {
  test("devuelve mensaje específico de build cuando build es true", () => {
    expect(formatLoadingMessage(true)).toBe("Buildeando template…");
  });

  test("devuelve mensaje de lectura cuando build es false", () => {
    expect(formatLoadingMessage(false)).toBe("Leyendo HTML…");
  });
});

describe("formatSuccessMessage", () => {
  test("formatea mensaje estándar cuando build es false", () => {
    expect(formatSuccessMessage(false)).toBe("✅ HTML copiado al portapapeles.");
    expect(formatSuccessMessage(false, { missing: ["name"] })).toBe(
      "✅ HTML copiado al portapapeles.",
    );
  });

  test("incluye nota de build completado cuando build es true", () => {
    expect(formatSuccessMessage(true)).toBe("✅ Build completado. HTML copiado al portapapeles.");
  });

  test("adjunta notas de validación ESP cuando existen al buildear", () => {
    expect(
      formatSuccessMessage(true, {
        missing: ["accountNumber"],
        unused: ["promoBanner"],
      }),
    ).toBe(
      "✅ Build completado. HTML copiado al portapapeles. ⚠️ Variables faltantes: accountNumber · ℹ️ Claves sin uso: promoBanner",
    );
  });
});

describe("formatErrorMessage", () => {
  test("extrae el mensaje de instancias de Error", () => {
    expect(formatErrorMessage(new Error("Fallo de conexión"))).toBe("❌ Fallo de conexión");
  });

  test("usa strings no vacíos directamente", () => {
    expect(formatErrorMessage("Permiso denegado")).toBe("❌ Permiso denegado");
  });

  test("usa mensaje por defecto ante valores vacíos o no tipados", () => {
    expect(formatErrorMessage("")).toBe("❌ Ocurrió un error.");
    expect(formatErrorMessage("   ")).toBe("❌ Ocurrió un error.");
    expect(formatErrorMessage(null)).toBe("❌ Ocurrió un error.");
    expect(formatErrorMessage(undefined)).toBe("❌ Ocurrió un error.");
    expect(formatErrorMessage({})).toBe("❌ Ocurrió un error.");
  });
});

describe("copyTextToClipboard", () => {
  test("devuelve true si el portapapeles escribe correctamente", async () => {
    let written = "";
    const clipboard = {
      writeText: (text) => {
        written = text;
        return Promise.resolve();
      },
    };

    const success = await copyTextToClipboard("<!DOCTYPE html>", clipboard);
    expect(success).toBe(true);
    expect(written).toBe("<!DOCTYPE html>");
  });

  test("devuelve false si writeText arroja una excepción", async () => {
    const clipboard = {
      writeText: () => Promise.reject(new Error("Clipboard permission denied")),
    };

    const success = await copyTextToClipboard("<p>test</p>", clipboard);
    expect(success).toBe(false);
  });

  test("devuelve false si el objeto clipboard no existe o no tiene writeText", async () => {
    expect(await copyTextToClipboard("html", undefined)).toBe(false);
    // @ts-expect-error clipboard inválido
    expect(await copyTextToClipboard("html", {})).toBe(false);
    // @ts-expect-error clipboard inválido
    expect(await copyTextToClipboard("html", { writeText: "no-function" })).toBe(false);
  });
});
