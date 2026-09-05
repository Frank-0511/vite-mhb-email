// @ts-check
import { afterEach, describe, expect, test } from "bun:test";
import { createRenderAPI, parseRenderErrorResponse, RenderApiError } from "./render-api.js";

/**
 * Crea una respuesta simulada compatible con Response.
 *
 * @param {number} status
 * @param {string} body
 * @param {Record<string, string>} [headers]
 * @returns {Response}
 */
function createMockResponse(status, body, headers = {}) {
  const headerMap = new Map(Object.entries(headers));
  return /** @type {Response} */ ({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "Error",
    headers: {
      get: (name) => headerMap.get(name) ?? null,
    },
    text: () => Promise.resolve(body),
    json: () => Promise.resolve(JSON.parse(body)),
  });
}

describe("render-api (cliente seguro de preview)", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  test("convierte el payload 422 versionado en RenderApiError", async () => {
    /** @type {RenderApiError[]} */
    const capturedErrors = [];
    const api = createRenderAPI({
      getTheme: () => "light",
      onSuccess: () => {},
      onStatusChange: () => {},
      onError: (error) => capturedErrors.push(error),
    });

    globalThis.fetch = () =>
      Promise.resolve(
        createMockResponse(
          422,
          JSON.stringify({
            success: false,
            error: {
              version: 1,
              code: "RENDER_FAILED",
              message: "No se pudo renderizar el template.",
              cause: "El template contiene sintaxis inválida.",
              location: { path: "welcome/index.html", line: 9 },
            },
          }),
        ),
      );

    await api.render("welcome", {});
    expect(capturedErrors.length).toBe(1);
    expect(capturedErrors[0]).toBeInstanceOf(RenderApiError);
    expect(capturedErrors[0]).toMatchObject({
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

  test("maneja rechazo de red y emite RenderApiError seguro", async () => {
    /** @type {RenderApiError[]} */
    const capturedErrors = [];
    const api = createRenderAPI({
      getTheme: () => "light",
      onSuccess: () => {},
      onStatusChange: () => {},
      onError: (error) => capturedErrors.push(error),
    });

    globalThis.fetch = () => Promise.reject(new TypeError("Failed to fetch"));

    await api.render("welcome", {});
    expect(capturedErrors.length).toBe(1);
    expect(capturedErrors[0]).toBeInstanceOf(RenderApiError);
    expect(capturedErrors[0].status).toBe(0);
    expect(capturedErrors[0].message).toBe("No se pudo conectar con el servidor de render.");
    expect(JSON.stringify(capturedErrors[0])).not.toContain("Failed to fetch");
  });

  test("conserva flujo de éxito 200 y validación ESP", async () => {
    /** @type {string[]} */
    const successHtml = [];
    /** @type {any[]} */
    const validations = [];

    const api = createRenderAPI({
      getTheme: () => "light",
      onSuccess: (html) => successHtml.push(html),
      onStatusChange: () => {},
      onError: () => {},
      onValidation: (val) => validations.push(val),
    });

    globalThis.fetch = () =>
      Promise.resolve(
        createMockResponse(200, "<h1>Hola</h1>", {
          "X-ESP-Validation": JSON.stringify({ missing: ["first_name"], unused: [] }),
        }),
      );

    await api.render("welcome", { first_name: "Test" });
    expect(successHtml).toEqual(["<h1>Hola</h1>"]);
    expect(validations).toEqual([{ missing: ["first_name"], unused: [] }]);
  });
});
