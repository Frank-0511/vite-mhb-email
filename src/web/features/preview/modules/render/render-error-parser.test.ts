import { describe, expect, test } from "bun:test";
import { RENDER_ERROR_MESSAGE } from "../../../../../../scripts/shared/contracts/constants/render-error.ts";
import {
  parseRenderErrorResponse,
  parseSafeRenderLocation,
  RenderApiError,
} from "./render-error-parser.ts";

describe("render-error-parser (parser seguro de errores de render)", () => {
  describe("parseSafeRenderLocation", () => {
    test("acepta rutas relativas válidas sin línea ni columna", () => {
      expect(parseSafeRenderLocation({ path: "welcome/index.html" })).toEqual({
        path: "welcome/index.html",
      });
    });

    test("incluye línea y columna si son enteros positivos", () => {
      expect(parseSafeRenderLocation({ path: "template/hero.html", line: 12, column: 5 })).toEqual({
        path: "template/hero.html",
        line: 12,
        column: 5,
      });
    });

    test("descarta línea o columna si son negativos, cero o no enteros", () => {
      expect(parseSafeRenderLocation({ path: "template/hero.html", line: 0, column: -1 })).toEqual({
        path: "template/hero.html",
      });

      expect(
        parseSafeRenderLocation({ path: "template/hero.html", line: 2.5, column: "4" }),
      ).toEqual({
        path: "template/hero.html",
      });
    });

    test("rechaza entradas no objeto, nulas o con path inválido", () => {
      expect(parseSafeRenderLocation(null)).toBeUndefined();
      expect(parseSafeRenderLocation(undefined)).toBeUndefined();
      expect(parseSafeRenderLocation("welcome/index.html")).toBeUndefined();
      expect(parseSafeRenderLocation({ path: "" })).toBeUndefined();
      expect(parseSafeRenderLocation({ path: 12345 })).toBeUndefined();
      expect(parseSafeRenderLocation({ path: "/absolute/path.html" })).toBeUndefined();
      expect(parseSafeRenderLocation({ path: "../traversal.html" })).toBeUndefined();
      expect(parseSafeRenderLocation({ path: "welcome\\index.html" })).toBeUndefined();
    });
  });

  describe("RenderApiError", () => {
    test("instancia correctamente con propiedades requeridas y por defecto", () => {
      const err = new RenderApiError({
        status: 422,
        message: RENDER_ERROR_MESSAGE,
      });

      expect(err).toBeInstanceOf(Error);
      expect(err.name).toBe("RenderApiError");
      expect(err.status).toBe(422);
      expect(err.code).toBe("RENDER_FAILED");
      expect(err.message).toBe(RENDER_ERROR_MESSAGE);
      expect(err.cause).toBeUndefined();
      expect(err.location).toBeUndefined();
    });
  });

  describe("parseRenderErrorResponse", () => {
    test("convierte payload 422 versionado en RenderApiError", () => {
      const body = JSON.stringify({
        success: false,
        error: {
          version: 1,
          code: "RENDER_FAILED",
          message: "No se pudo renderizar el template.",
          cause: "El template contiene sintaxis inválida.",
          location: { path: "welcome/index.html", line: 9 },
        },
      });

      const error = parseRenderErrorResponse({ status: 422 }, body);
      expect(error).toBeInstanceOf(RenderApiError);
      expect(error).toMatchObject({
        status: 422,
        code: "RENDER_FAILED",
        message: "No se pudo renderizar el template.",
        cause: "El template contiene sintaxis inválida.",
        location: { path: "welcome/index.html", line: 9 },
      });
    });

    test("no refleja un cuerpo no JSON ni un schema inválido", () => {
      const error = parseRenderErrorResponse({ status: 500 }, "token=secret");
      expect(error).toBeInstanceOf(RenderApiError);
      expect(error).toMatchObject({
        status: 500,
        code: "RENDER_FAILED",
        message: "No se pudo renderizar el template.",
        cause: undefined,
        location: undefined,
      });
      expect(JSON.stringify(error)).not.toContain("secret");
    });

    test("ignora versiones de error distintas a 1", () => {
      const body = JSON.stringify({
        success: false,
        error: {
          version: 2,
          code: "RENDER_FAILED",
          message: "Versión no soportada.",
        },
      });
      const error = parseRenderErrorResponse({ status: 422 }, body);
      expect(error.message).toBe("No se pudo renderizar el template.");
    });

    test("omite location si location.path no es string", () => {
      const body = JSON.stringify({
        success: false,
        error: {
          version: 1,
          code: "RENDER_FAILED",
          message: "No se pudo renderizar el template.",
          location: { path: 12345 },
        },
      });
      const error = parseRenderErrorResponse({ status: 422 }, body);
      expect(error.location).toBeUndefined();
    });

    test("descarta campos de diagnóstico seguros en apariencia pero con contenido sensible", () => {
      const body = JSON.stringify({
        success: false,
        error: {
          version: 1,
          code: "RENDER_FAILED",
          message: "token=secret /Users/fankvillanueva/private",
          cause: "Error: stack trace at /Users/fankvillanueva/private",
          location: { path: "/Users/fankvillanueva/private/index.html", line: 9 },
        },
      });

      const error = parseRenderErrorResponse({ status: 422 }, body);

      expect(error).toMatchObject({
        message: "No se pudo renderizar el template.",
        cause: undefined,
        location: undefined,
      });
      expect(JSON.stringify(error)).not.toContain("secret");
      expect(JSON.stringify(error)).not.toContain("/Users/fankvillanueva");
      expect(JSON.stringify(error)).not.toContain("stack trace");
    });

    test("descarta rutas relativas con traversal o separadores de Windows", () => {
      for (const path of [
        "../private/index.html",
        "welcome\\index.html",
        "welcome/../../private.html",
      ]) {
        const body = JSON.stringify({
          success: false,
          error: {
            version: 1,
            code: "RENDER_FAILED",
            message: "No se pudo renderizar el template.",
            cause: "El template contiene sintaxis inválida.",
            location: { path, line: 9 },
          },
        });

        const error = parseRenderErrorResponse({ status: 422 }, body);
        expect(error.cause).toBe("El template contiene sintaxis inválida.");
        expect(error.location).toBeUndefined();
      }
    });

    test("maneja respuesta sin status o con formato inválido", () => {
      const error = parseRenderErrorResponse(null, "{}");
      expect(error.status).toBe(0);
      expect(error.message).toBe("No se pudo renderizar el template.");
    });
  });
});
