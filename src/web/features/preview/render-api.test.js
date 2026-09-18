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

/**
 * Silencia el `console.error` que `render-api` emite en sus rutas de fallo y
 * devuelve lo registrado. Sin esto, los casos que ejercitan errores a propósito
 * imprimen el stack completo y entierran el resultado de la suite.
 *
 * @returns {unknown[][]} Argumentos de cada llamada capturada.
 */
function captureConsoleError() {
  /** @type {unknown[][]} */
  const calls = [];
  console.error = (...args) => {
    calls.push(args);
  };
  return calls;
}

describe("render-api (cliente de render y re-exports)", () => {
  const originalFetch = globalThis.fetch;
  const originalConsoleError = console.error;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    console.error = originalConsoleError;
  });

  test("re-exporta RenderApiError y parseRenderErrorResponse", () => {
    expect(RenderApiError).toBeDefined();
    expect(parseRenderErrorResponse).toBeDefined();

    const err = parseRenderErrorResponse({ status: 500 }, "error");
    expect(err).toBeInstanceOf(RenderApiError);
    expect(err.message).toBe("No se pudo renderizar el template.");
  });

  test("render exitoso (200) pasa HTML y parsea header de validación ESP", async () => {
    /** @type {string[]} */
    const successHtml = [];
    /** @type {any[]} */
    const validations = [];
    /** @type {string[]} */
    const statusLogs = [];

    const api = createRenderAPI({
      getTheme: () => "dark",
      onSuccess: (html) => successHtml.push(html),
      onStatusChange: (text) => statusLogs.push(text),
      onError: () => {},
      onValidation: (val) => validations.push(val),
    });

    /** @type {string[]} */
    const requestedUrls = [];
    globalThis.fetch = (input) => {
      requestedUrls.push(String(input));
      return Promise.resolve(
        createMockResponse(200, "<h1>Prueba</h1>", {
          "X-ESP-Validation": JSON.stringify({ missing: ["token"], unused: ["extra"] }),
        }),
      );
    };

    await api.render("welcome", { user: "Frank" });

    expect(requestedUrls[0]).toContain("/api/render?template=welcome&theme=dark");
    expect(statusLogs).toContain("Actualizando...");
    expect(successHtml).toEqual(["<h1>Prueba</h1>"]);
    expect(validations).toEqual([{ missing: ["token"], unused: ["extra"] }]);
  });

  test("render exitoso sin cabecera X-ESP-Validation entrega arrays vacíos", async () => {
    /** @type {any[]} */
    const validations = [];

    const api = createRenderAPI({
      getTheme: () => "light",
      onSuccess: () => {},
      onStatusChange: () => {},
      onError: () => {},
      onValidation: (val) => validations.push(val),
    });

    globalThis.fetch = () => Promise.resolve(createMockResponse(200, "<p>Hola</p>"));

    await api.render("welcome", {});
    expect(validations).toEqual([{ missing: [], unused: [] }]);
  });

  test("render con error 422 emite RenderApiError estructurado y actualiza estado", async () => {
    /** @type {RenderApiError[]} */
    const capturedErrors = [];
    /** @type {string[]} */
    const statusLogs = [];

    const api = createRenderAPI({
      getTheme: () => "light",
      onSuccess: () => {},
      onStatusChange: (text) => statusLogs.push(text),
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
              location: { path: "welcome/index.html", line: 5 },
            },
          }),
        ),
      );

    const loggedErrors = captureConsoleError();
    await api.render("welcome", {});

    expect(loggedErrors).toHaveLength(1);
    expect(loggedErrors[0][0]).toBe("Render API error:");
    expect(capturedErrors.length).toBe(1);
    expect(capturedErrors[0]).toBeInstanceOf(RenderApiError);
    expect(capturedErrors[0].status).toBe(422);
    expect(capturedErrors[0].cause).toBe("El template contiene sintaxis inválida.");
    expect(statusLogs).toContain("Error al renderizar");
  });

  test("render con rechazo de red reporta error de conexión", async () => {
    /** @type {RenderApiError[]} */
    const capturedErrors = [];
    /** @type {string[]} */
    const statusLogs = [];

    const api = createRenderAPI({
      onSuccess: () => {},
      onStatusChange: (text) => statusLogs.push(text),
      onError: (error) => capturedErrors.push(error),
    });

    globalThis.fetch = () => Promise.reject(new TypeError("Network error"));

    const loggedErrors = captureConsoleError();
    await api.render("welcome", {});

    expect(loggedErrors).toHaveLength(1);
    expect(loggedErrors[0][0]).toBe("Render API network error:");
    expect(capturedErrors.length).toBe(1);
    expect(capturedErrors[0].status).toBe(0);
    expect(capturedErrors[0].message).toBe("No se pudo conectar con el servidor de render.");
    expect(statusLogs).toContain("Error al renderizar");
  });

  test("invalidateTemplateCache invoca endpoint POST con templateName", async () => {
    /** @type {{ url: string, method?: string }[]} */
    const requests = [];

    const api = createRenderAPI({
      onSuccess: () => {},
      onStatusChange: () => {},
      onError: () => {},
    });

    globalThis.fetch = (url, init) => {
      requests.push({ url: String(url), method: init?.method });
      return Promise.resolve(createMockResponse(200, "OK"));
    };

    await api.invalidateTemplateCache("user-created");

    expect(requests.length).toBe(1);
    expect(requests[0].url).toContain("/api/cache/invalidate?template=user-created");
    expect(requests[0].method).toBe("POST");
  });

  test("createDebouncedRender avisa JSON Inválido cuando el contenido no es JSON válido", async () => {
    /** @type {string[]} */
    const statusLogs = [];

    const api = createRenderAPI({
      onSuccess: () => {},
      onStatusChange: (text) => statusLogs.push(text),
      onError: () => {},
    });

    let renderCalls = 0;
    globalThis.fetch = () => {
      renderCalls++;
      return Promise.resolve(createMockResponse(200, "OK"));
    };

    const debounced = api.createDebouncedRender(
      "welcome",
      () => ({ text: "{ malformed json" }),
      10,
    );
    debounced();

    // Esperar el debounce
    await new Promise((resolve) => setTimeout(resolve, 30));

    expect(statusLogs).toContain("JSON Inválido...");
    expect(renderCalls).toBe(0);
  });

  test("createDebouncedRender ejecuta render cuando el contenido es válido", async () => {
    let renderCalls = 0;

    const api = createRenderAPI({
      onSuccess: () => {},
      onStatusChange: () => {},
      onError: () => {},
    });

    globalThis.fetch = () => {
      renderCalls++;
      return Promise.resolve(createMockResponse(200, "<h1>OK</h1>"));
    };

    const debounced = api.createDebouncedRender(
      "welcome",
      () => ({ json: { user: "Frank" }, text: '{"user":"Frank"}' }),
      10,
    );
    debounced();

    await new Promise((resolve) => setTimeout(resolve, 30));

    expect(renderCalls).toBe(1);
  });
});
