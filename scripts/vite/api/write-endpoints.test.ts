/**
 * @fileoverview Pruebas de integración para validar el rechazo de peticiones cross-site
 * en los 6 endpoints de escritura de la API local de Vite (MHB-46).
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { EventEmitter } from "node:events";
import { existsSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { readJsonFile, writeJsonFile } from "../../shared/index.ts";
import os from "node:os";
import path from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { ViteDevServer } from "vite";
import { setupCacheApi } from "./cache.ts";
import { setupComponentsApi } from "./components.ts";
import { setupCopyHtmlApi } from "./copy-html.ts";
import { setupDataApi } from "./data.ts";
import { createRenderRequestHandler } from "../services/render/request-handler.ts";

type MiddlewareFn = (
  req: IncomingMessage,
  res: ServerResponse,
  next: (err?: unknown) => void,
) => void | Promise<void>;

function captureMiddleware(registerFn: (server: ViteDevServer) => void): MiddlewareFn {
  let captured: MiddlewareFn | undefined;
  const fakeServer = {
    middlewares: {
      use(fn: MiddlewareFn) {
        captured = fn;
      },
    },
  };
  registerFn(fakeServer as unknown as ViteDevServer);
  if (!captured) throw new Error("No middleware captured");
  return captured;
}

function createMockResponse() {
  let statusCode = 200;
  let body = "";
  let headersSent = false;
  const headers = new Map<string, string>();

  const res = {
    get statusCode() {
      return statusCode;
    },
    set statusCode(code: number) {
      statusCode = code;
    },
    get headersSent() {
      return headersSent;
    },
    setHeader(name: string, value: string) {
      headers.set(name.toLowerCase(), value);
    },
    end(chunk?: unknown) {
      if (chunk) body += String(chunk);
      headersSent = true;
    },
    get body() {
      return body;
    },
    get headers() {
      return headers;
    },
  };

  return res as unknown as ServerResponse & {
    body: string;
    headers: Map<string, string>;
  };
}

async function invokeEndpoint(
  middleware: MiddlewareFn,
  options: {
    url: string;
    headers?: Record<string, string | string[] | undefined>;
    body?: string;
  },
): Promise<{ res: ReturnType<typeof createMockResponse>; nextCalled: boolean }> {
  const req = Object.assign(new EventEmitter(), {
    method: "POST",
    url: options.url,
    headers: options.headers ?? {},
  }) as unknown as IncomingMessage;

  const res = createMockResponse();
  let nextCalled = false;
  const next = () => {
    nextCalled = true;
  };

  const promiseOrVoid = middleware(req, res, next);
  if (options.body !== undefined) {
    queueMicrotask(() => {
      req.emit("data", Buffer.from(options.body ?? ""));
      req.emit("end");
    });
  } else {
    queueMicrotask(() => req.emit("end"));
  }

  if (promiseOrVoid && typeof (promiseOrVoid as Promise<void>).then === "function") {
    await promiseOrVoid;
  }
  await new Promise((r) => setTimeout(r, 15));

  return { res, nextCalled };
}

function assertRejected403(res: ReturnType<typeof createMockResponse>, nextCalled: boolean): void {
  expect(nextCalled).toBe(false);
  expect(res.statusCode).toBe(403);
  expect(res.headers.get("content-type")).toBe("application/json");
  const parsed = JSON.parse(res.body) as { success: boolean; error: string };
  expect(parsed.success).toBe(false);
  expect(typeof parsed.error).toBe("string");
  expect(parsed.error.trim().length).toBeGreaterThan(0);
}

describe("Rechazo cross-site en endpoints de escritura (MHB-46)", () => {
  let tempDir: string;
  let dataFilePath: string;

  beforeAll(() => {
    tempDir = mkdtempSync(path.join(os.tmpdir(), "vite-api-test-"));
    dataFilePath = path.join(tempDir, "src/emails/templates/welcome/data.json");
    mkdirSync(path.dirname(dataFilePath), { recursive: true });
    writeJsonFile(dataFilePath, { preserved: "original" });
  });

  afterAll(() => {
    if (tempDir && existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe("1. POST /api/data?template=welcome", () => {
    test("rechaza text/plain con 403 y no muta data.json", async () => {
      const middleware = captureMiddleware((server) => setupDataApi(server, tempDir));
      const { res, nextCalled } = await invokeEndpoint(middleware, {
        url: "/api/data?template=welcome",
        headers: { "content-type": "text/plain", host: "localhost:5173" },
        body: JSON.stringify({ hacked: true }),
      });

      assertRejected403(res, nextCalled);
      const fileContent = readJsonFile(dataFilePath) as { preserved: string };
      expect(fileContent.preserved).toBe("original");
    });

    test("rechaza Origin externo y Sec-Fetch-Site cross-site sin mutar data.json", async () => {
      const middleware = captureMiddleware((server) => setupDataApi(server, tempDir));
      const byOrigin = await invokeEndpoint(middleware, {
        url: "/api/data?template=welcome",
        headers: {
          "content-type": "application/json",
          host: "localhost:5173",
          origin: "https://evil.example",
        },
        body: JSON.stringify({ hacked: true }),
      });
      assertRejected403(byOrigin.res, byOrigin.nextCalled);

      const bySecFetch = await invokeEndpoint(middleware, {
        url: "/api/data?template=welcome",
        headers: { "content-type": "application/json", "sec-fetch-site": "cross-site" },
        body: JSON.stringify({ hacked: true }),
      });
      assertRejected403(bySecFetch.res, bySecFetch.nextCalled);

      const fileContent = readJsonFile(dataFilePath) as { preserved: string };
      expect(fileContent.preserved).toBe("original");
    });
  });

  describe("2. POST /api/cache/invalidate?template=welcome", () => {
    test("rechaza Origin externo y Sec-Fetch-Site cross-site con 403", async () => {
      const middleware = captureMiddleware((server) => setupCacheApi(server, tempDir));
      const byOrigin = await invokeEndpoint(middleware, {
        url: "/api/cache/invalidate?template=welcome",
        headers: { host: "localhost:5173", origin: "https://evil.example" },
      });
      assertRejected403(byOrigin.res, byOrigin.nextCalled);

      const bySecFetch = await invokeEndpoint(middleware, {
        url: "/api/cache/invalidate?template=welcome",
        headers: { "sec-fetch-site": "cross-site" },
      });
      assertRejected403(bySecFetch.res, bySecFetch.nextCalled);
    });
  });

  describe("3. POST /api/cache/clean", () => {
    test("rechaza Origin externo y Sec-Fetch-Site cross-site con 403", async () => {
      const middleware = captureMiddleware((server) => setupCacheApi(server, tempDir));
      const byOrigin = await invokeEndpoint(middleware, {
        url: "/api/cache/clean",
        headers: { host: "localhost:5173", origin: "https://evil.example" },
      });
      assertRejected403(byOrigin.res, byOrigin.nextCalled);

      const bySecFetch = await invokeEndpoint(middleware, {
        url: "/api/cache/clean",
        headers: { "sec-fetch-site": "cross-site" },
      });
      assertRejected403(bySecFetch.res, bySecFetch.nextCalled);
    });
  });

  describe("4. POST /api/copy-html?template=welcome", () => {
    test("rechaza text/plain con 403", async () => {
      const middleware = captureMiddleware((server) => setupCopyHtmlApi(server, tempDir));
      const { res, nextCalled } = await invokeEndpoint(middleware, {
        url: "/api/copy-html?template=welcome",
        headers: { "content-type": "text/plain", host: "localhost:5173" },
        body: JSON.stringify({ build: false }),
      });
      assertRejected403(res, nextCalled);
    });

    test("rechaza Origin externo y Sec-Fetch-Site cross-site con 403", async () => {
      const middleware = captureMiddleware((server) => setupCopyHtmlApi(server, tempDir));
      const byOrigin = await invokeEndpoint(middleware, {
        url: "/api/copy-html?template=welcome",
        headers: {
          "content-type": "application/json",
          host: "localhost:5173",
          origin: "https://evil.example",
        },
        body: JSON.stringify({ build: false }),
      });
      assertRejected403(byOrigin.res, byOrigin.nextCalled);

      const bySecFetch = await invokeEndpoint(middleware, {
        url: "/api/copy-html?template=welcome",
        headers: { "content-type": "application/json", "sec-fetch-site": "cross-site" },
        body: JSON.stringify({ build: false }),
      });
      assertRejected403(bySecFetch.res, bySecFetch.nextCalled);
    });
  });

  describe("5. POST /api/render?template=welcome", () => {
    test("rechaza text/plain con 403", async () => {
      const handler = createRenderRequestHandler({ rootDir: tempDir });
      const { res, nextCalled } = await invokeEndpoint(handler, {
        url: "/api/render?template=welcome",
        headers: { "content-type": "text/plain", host: "localhost:5173" },
        body: JSON.stringify({}),
      });
      assertRejected403(res, nextCalled);
    });

    test("rechaza Origin externo y Sec-Fetch-Site cross-site con 403", async () => {
      const handler = createRenderRequestHandler({ rootDir: tempDir });
      const byOrigin = await invokeEndpoint(handler, {
        url: "/api/render?template=welcome",
        headers: {
          "content-type": "application/json",
          host: "localhost:5173",
          origin: "https://evil.example",
        },
        body: JSON.stringify({}),
      });
      assertRejected403(byOrigin.res, byOrigin.nextCalled);

      const bySecFetch = await invokeEndpoint(handler, {
        url: "/api/render?template=welcome",
        headers: { "content-type": "application/json", "sec-fetch-site": "cross-site" },
        body: JSON.stringify({}),
      });
      assertRejected403(bySecFetch.res, bySecFetch.nextCalled);
    });
  });

  describe("6. POST /api/components/:name/render", () => {
    test("rechaza text/plain con 403", async () => {
      const middleware = captureMiddleware((server) => setupComponentsApi(server, tempDir));
      const { res, nextCalled } = await invokeEndpoint(middleware, {
        url: "/api/components/button/render",
        headers: { "content-type": "text/plain", host: "localhost:5173" },
        body: JSON.stringify({ variant: "primary", props: {} }),
      });
      assertRejected403(res, nextCalled);
    });

    test("rechaza Origin externo y Sec-Fetch-Site cross-site con 403", async () => {
      const middleware = captureMiddleware((server) => setupComponentsApi(server, tempDir));
      const byOrigin = await invokeEndpoint(middleware, {
        url: "/api/components/button/render",
        headers: {
          "content-type": "application/json",
          host: "localhost:5173",
          origin: "https://evil.example",
        },
        body: JSON.stringify({ variant: "primary", props: {} }),
      });
      assertRejected403(byOrigin.res, byOrigin.nextCalled);

      const bySecFetch = await invokeEndpoint(middleware, {
        url: "/api/components/button/render",
        headers: { "content-type": "application/json", "sec-fetch-site": "cross-site" },
        body: JSON.stringify({ variant: "primary", props: {} }),
      });
      assertRejected403(bySecFetch.res, bySecFetch.nextCalled);
    });
  });
});
