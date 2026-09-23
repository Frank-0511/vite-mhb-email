import { describe, expect, test } from "bun:test";
import { renderMissingTemplateError } from "./preview-params.ts";

describe("preview-params (gestión de parámetros de URL)", () => {
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
