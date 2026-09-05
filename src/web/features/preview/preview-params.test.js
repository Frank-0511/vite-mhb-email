// @ts-check
import { describe, expect, test } from "bun:test";
import { getTemplateNameFromUrl, renderMissingTemplateError } from "./preview-params.js";

describe("preview-params (gestión de parámetros de URL)", () => {
  describe("getTemplateNameFromUrl", () => {
    test("extrae el nombre de template cuando está presente en la query string", () => {
      expect(getTemplateNameFromUrl("?template=welcome")).toBe("welcome");
      expect(getTemplateNameFromUrl("?other=foo&template=example&theme=dark")).toBe("example");
      expect(getTemplateNameFromUrl("?template=user-created")).toBe("user-created");
    });

    test("recorta espacios en blanco alrededor del nombre", () => {
      expect(getTemplateNameFromUrl("?template=%20welcome%20")).toBe("welcome");
    });

    test("retorna null si el parámetro no existe o está vacío", () => {
      expect(getTemplateNameFromUrl("?template=")).toBeNull();
      expect(getTemplateNameFromUrl("?template=%20%20")).toBeNull();
      expect(getTemplateNameFromUrl("?other=value")).toBeNull();
      expect(getTemplateNameFromUrl("")).toBeNull();
      // @ts-expect-error test defensivo
      expect(getTemplateNameFromUrl(null)).toBeNull();
    });
  });

  describe("renderMissingTemplateError", () => {
    test("inyecta el mensaje de error con alerta roja en el elemento destino", () => {
      const targetBody = { innerHTML: "" };
      renderMissingTemplateError(targetBody);

      expect(targetBody.innerHTML).toContain("Error: No se especificó un template en la URL");
      expect(targetBody.innerHTML).toContain("text-red-500");
    });

    test("no lanza excepción si targetBody es nulo o indefinido", () => {
      expect(() => {
        renderMissingTemplateError(null);
        renderMissingTemplateError(undefined);
      }).not.toThrow();
    });
  });
});
