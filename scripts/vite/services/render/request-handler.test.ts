import { afterAll, describe, expect, test } from "bun:test";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { simulateRequest as request } from "../../test-helpers.ts";
import { createRenderRequestHandler } from "./request-handler.ts";

const originalConsole = {
  log: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error,
};

// El handler informa caché, variables ESP y errores por consola; los tests
// comprueban la respuesta HTTP, así que se silencia para no ensuciar la suite.
console.log = () => {};
console.info = () => {};
console.warn = () => {};
console.error = () => {};

afterAll(() => {
  Object.assign(console, originalConsole);
});

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");

describe("render-request-handler (caracterización)", () => {
  test("conserva 200 text/html y X-ESP-Validation al renderizar", async () => {
    const handler = createRenderRequestHandler({ rootDir: projectRoot });
    const response = await request(handler, {
      method: "POST",
      url: "/api/render?template=welcome&theme=light",
      body: JSON.stringify({ first_name: "Ana" }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/html");
    expect(JSON.parse(response.headers.get("X-ESP-Validation") || "{}")).toMatchObject({
      missing: expect.any(Array),
      unused: expect.any(Array),
    });
    expect(response.body).toContain("Ana");
  });

  test("conserva 400 de JSON inválido", async () => {
    const handler = createRenderRequestHandler({ rootDir: projectRoot });
    const response = await request(handler, {
      method: "POST",
      url: "/api/render?template=welcome",
      body: "{",
    });
    expect(response).toMatchObject({ status: 400, body: "Invalid JSON body" });
  });

  test("conserva 400 de template inválido", async () => {
    const handler = createRenderRequestHandler({ rootDir: projectRoot });
    const response = await request(handler, {
      method: "POST",
      url: "/api/render?template=../secret",
      body: "{}",
    });
    expect(response).toMatchObject({ status: 400, body: "Invalid template name" });
  });

  test("conserva 404 de template inexistente", async () => {
    const handler = createRenderRequestHandler({ rootDir: projectRoot });
    const response = await request(handler, {
      method: "POST",
      url: "/api/render?template=non-existent-template",
      body: "{}",
    });
    expect(response).toMatchObject({ status: 404, body: "Template not found" });
  });

  test("ignora solicitudes fuera de /api/render llamando a next", async () => {
    const handler = createRenderRequestHandler({ rootDir: projectRoot });
    const response = await request(handler, {
      method: "GET",
      url: "/api/other",
    });
    expect(response.status).toBe(404);
    expect(response.body).toBe("Not found");
  });

  test("devuelve 422 JSON seguro cuando el compilador falla", async () => {
    const handler = createRenderRequestHandler({
      rootDir: projectRoot,
      compileTemplate: () => {
        return Promise.reject(
          Object.assign(new SyntaxError("/private/token"), {
            path: path.join(projectRoot, "src/emails/templates/welcome/index.html"),
            line: 9,
          }),
        );
      },
      cacheManager: {
        isCacheValid: () => false,
        readFromCache: () => Promise.resolve(""),
        saveToCache: () => Promise.resolve(),
      },
      applyPreviewTheme: (html) => html,
    });
    const response = await request(handler, {
      method: "POST",
      url: "/api/render?template=welcome&theme=light",
      body: JSON.stringify({ name: "Ana" }),
    });

    expect(response.status).toBe(422);
    expect(response.headers.get("Content-Type")).toBe("application/json");
    const json = JSON.parse(response.body);
    expect(json.success).toBe(false);
    expect(json.error).toMatchObject({
      version: 1,
      code: "RENDER_FAILED",
      message: "No se pudo renderizar el template.",
      cause: "El template contiene sintaxis inválida.",
      location: { path: "welcome/index.html", line: 9 },
    });
    expect(response.body).not.toContain(projectRoot);
    expect(response.body).not.toContain("token");
  });

  test("devuelve 500 genérico cuando el normalizador o serialización falla", async () => {
    const handler = createRenderRequestHandler({
      rootDir: projectRoot,
      compileTemplate: () => {
        return Promise.reject(new Error("fail"));
      },
      cacheManager: {
        isCacheValid: () => false,
        readFromCache: () => Promise.resolve(""),
        saveToCache: () => Promise.resolve(),
      },
      // Inyectar un normalizador roto para forzar fallback de emergencia
      normalizeError: () => {
        throw new Error("crashed normalizer");
      },
    });

    const response = await request(handler, {
      method: "POST",
      url: "/api/render?template=welcome",
      body: JSON.stringify({ name: "Ana" }),
    });

    expect(response.status).toBe(500);
    expect(response.headers.get("Content-Type")).toBe("text/plain");
    expect(response.body).toBe("Internal server error");
    expect(response.body).not.toContain("crashed normalizer");
  });
});
