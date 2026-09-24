/**
 * @fileoverview Pruebas unitarias para helpers HTTP y asyncHandler en scripts/vite/api/http.ts.
 */

import { describe, expect, test } from "bun:test";
import { EventEmitter } from "node:events";
import type { IncomingMessage, ServerResponse } from "node:http";
import {
  asyncHandler,
  getRequestUrl,
  readJsonBody,
  readRequestBody,
  sendJson,
  sendText,
} from "./http.ts";

function createMockResponse(initialHeadersSent = false, onEnd?: () => void) {
  let body = "";
  let headersSent = initialHeadersSent;
  const headers = new Map<string, string>();

  const res = {
    statusCode: 200,
    get headersSent() {
      return headersSent;
    },
    setHeader(name: string, value: string) {
      headers.set(name.toLowerCase(), value);
    },
    end(chunk?: unknown) {
      if (chunk) {
        body += String(chunk);
      }
      headersSent = true;
      onEnd?.();
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

describe("asyncHandler", () => {
  test("éxito: ejecuta la función asíncrona sin responder con error", async () => {
    let executed = false;
    const req = {} as IncomingMessage;
    const res = createMockResponse();

    const handler = asyncHandler(async () => {
      await Promise.resolve();
      executed = true;
    });

    handler(req, res, () => {});
    await new Promise((r) => setTimeout(r, 10));

    expect(executed).toBe(true);
    expect(res.statusCode).toBe(200);
    expect(res.body).toBe("");
  });

  test("rechazo con respuesta JSON 500 cuando headersSent es falso", async () => {
    const req = {} as IncomingMessage;
    const res = createMockResponse(false);

    const handler = asyncHandler(async () => {
      await Promise.resolve();
      throw new Error("Fallo controlado en test");
    });

    handler(req, res, () => {});
    await new Promise((r) => setTimeout(r, 10));

    expect(res.statusCode).toBe(500);
    expect(res.headers.get("content-type")).toBe("application/json");
    expect(JSON.parse(res.body)).toEqual({ error: "Fallo controlado en test" });
  });

  test("rechazo con headers ya enviados: finaliza respuesta sin sobrescribir con JSON 500", async () => {
    let endCalled = false;
    const req = {} as IncomingMessage;
    const res = createMockResponse(true, () => {
      endCalled = true;
    });

    const handler = asyncHandler(async () => {
      await Promise.resolve();
      throw new Error("Error después de enviar cabeceras");
    });

    handler(req, res, () => {});
    await new Promise((r) => setTimeout(r, 10));

    expect(endCalled).toBe(true);
    expect(res.statusCode).toBe(200);
    expect(res.body).toBe("");
  });
});

describe("helpers HTTP", () => {
  test("sendJson serializa y asigna Content-Type", () => {
    const res = createMockResponse();
    sendJson(res, 201, { ok: true });
    expect(res.statusCode).toBe(201);
    expect(res.headers.get("content-type")).toBe("application/json");
    expect(JSON.parse(res.body)).toEqual({ ok: true });
  });

  test("sendText envía texto plano", () => {
    const res = createMockResponse();
    sendText(res, 200, "Hola mundo");
    expect(res.statusCode).toBe(200);
    expect(res.headers.get("content-type")).toBe("text/plain");
    expect(res.body).toBe("Hola mundo");
  });

  test("getRequestUrl resuelve URL completa con host por defecto", () => {
    const req = { url: "/api/test?foo=bar", headers: {} } as IncomingMessage;
    const url = getRequestUrl(req);
    expect(url.pathname).toBe("/api/test");
    expect(url.searchParams.get("foo")).toBe("bar");
    expect(url.host).toBe("localhost");
  });

  test("readRequestBody y readJsonBody leen el stream del request", async () => {
    const emitter = new EventEmitter();
    const readPromise = readJsonBody(emitter as unknown as IncomingMessage);
    emitter.emit("data", Buffer.from('{"hello":'));
    emitter.emit("data", Buffer.from('"world"}'));
    emitter.emit("end");
    const parsed = await readPromise;
    expect(parsed).toEqual({ hello: "world" });

    const rawEmitter = new EventEmitter();
    const rawPromise = readRequestBody(rawEmitter as unknown as IncomingMessage);
    rawEmitter.emit("data", "texto plano");
    rawEmitter.emit("end");
    const raw = await rawPromise;
    expect(raw).toBe("texto plano");
  });
});
