// @ts-check
import { afterEach, describe, expect, test } from "bun:test";
import {
  createDebounceTimer,
  debounce,
  fetchJSON,
  fetchText,
  postJSON,
  postText,
  sendRequest,
} from "./http-helpers.js";

/**
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

describe("http-helpers", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  test("debounce retrasa la ejecución y cancela llamadas intermedias", async () => {
    let callCount = 0;
    const debounced = debounce(() => {
      callCount++;
    }, 20);

    debounced();
    debounced();
    debounced();

    expect(callCount).toBe(0);
    await new Promise((resolve) => setTimeout(resolve, 35));
    expect(callCount).toBe(1);
  });

  test("createDebounceTimer resetea el timer en cada llamada", async () => {
    let executed = false;
    const reset = createDebounceTimer(() => {
      executed = true;
    }, 20);

    reset();
    await new Promise((resolve) => setTimeout(resolve, 10));
    reset();
    await new Promise((resolve) => setTimeout(resolve, 15));
    expect(executed).toBe(false);

    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(executed).toBe(true);
  });

  test("fetchJSON devuelve el JSON parseado cuando la respuesta es OK", async () => {
    globalThis.fetch = () => Promise.resolve(createMockResponse(200, JSON.stringify({ ok: true })));
    const result = await fetchJSON("/api/test");
    expect(result).toEqual({ ok: true });
  });

  test("fetchJSON lanza error si el status no es 2xx", async () => {
    globalThis.fetch = () => Promise.resolve(createMockResponse(500, "Server Error"));
    await expect(fetchJSON("/api/test")).rejects.toThrow("HTTP 500: Error");
  });

  test("fetchText devuelve el texto cuando la respuesta es OK", async () => {
    globalThis.fetch = () => Promise.resolve(createMockResponse(200, "<h1>Test</h1>"));
    const result = await fetchText("/api/html");
    expect(result).toBe("<h1>Test</h1>");
  });

  test("fetchText lanza error si el status no es 2xx", async () => {
    globalThis.fetch = () => Promise.resolve(createMockResponse(404, "Not Found"));
    await expect(fetchText("/api/html")).rejects.toThrow("HTTP 404: Error");
  });

  test("postJSON envía cabecera application/json y serializa el body", async () => {
    /** @type {any} */
    let capturedInit;
    globalThis.fetch = (_url, init) => {
      capturedInit = init;
      return Promise.resolve(createMockResponse(200, JSON.stringify({ success: true })));
    };

    const result = await postJSON("/api/save", { item: 1 });
    expect(capturedInit.method).toBe("POST");
    expect(capturedInit.headers["Content-Type"]).toBe("application/json");
    expect(capturedInit.body).toBe(JSON.stringify({ item: 1 }));
    expect(result).toEqual({ success: true });
  });

  test("postText envía POST con JSON y devuelve el texto de respuesta", async () => {
    /** @type {any} */
    let capturedInit;
    globalThis.fetch = (_url, init) => {
      capturedInit = init;
      return Promise.resolve(createMockResponse(200, '<div class="preview">Item</div>'));
    };

    const result = await postText("/api/render", { variant: "v1" });
    expect(capturedInit.method).toBe("POST");
    expect(capturedInit.headers["Content-Type"]).toBe("application/json");
    expect(capturedInit.body).toBe(JSON.stringify({ variant: "v1" }));
    expect(result).toBe('<div class="preview">Item</div>');
  });

  test("sendRequest delega directamente a fetch sin lanzar por status", async () => {
    globalThis.fetch = () => Promise.resolve(createMockResponse(422, "Unprocessable"));
    const response = await sendRequest("/api/custom");
    expect(response.status).toBe(422);
  });
});
