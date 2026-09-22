import { EventEmitter } from "node:events";
import type { IncomingMessage, ServerResponse } from "node:http";

export interface SimulatedResponse<T = unknown> {
  status: number;
  body: string;
  json: T;
  headers: Map<string, string>;
}

export interface SimulateRequestOptions {
  method?: string;
  url: string;
  body?: unknown;
}

/**
 * Simula una petición HTTP sobre un middleware sin abrir puertos TCP.
 *
 * @param middleware Middleware de Connect / Vite a probar.
 * @param options Opciones de la petición simulada.
 * @returns Respuesta simulada con status, body, json y headers.
 */
export function simulateRequest<T = unknown>(
  middleware: (
    req: IncomingMessage,
    res: ServerResponse,
    next: (err?: unknown) => void,
  ) => Promise<void> | void,
  { method = "GET", url, body }: SimulateRequestOptions,
): Promise<SimulatedResponse<T>> {
  const req = Object.assign(new EventEmitter(), {
    method,
    url,
    headers: { host: "localhost" },
  }) as unknown as IncomingMessage;
  const headers = new Map<string, string>();

  return new Promise((resolvePromise, rejectPromise) => {
    let statusCode = 200;
    const res = {
      get statusCode() {
        return statusCode;
      },
      set statusCode(code: number) {
        statusCode = code;
      },
      setHeader(name: string, value: unknown) {
        headers.set(name, String(value));
      },
      end(chunk?: unknown) {
        const responseBody = String(chunk ?? "");
        let json: unknown = null;
        try {
          json = JSON.parse(responseBody);
        } catch {
          // No es JSON
        }
        resolvePromise({
          status: statusCode,
          body: responseBody,
          json: json as T,
          headers,
        });
      },
    } as unknown as ServerResponse;

    try {
      const maybePromise = middleware(req, res, () => {
        res.statusCode = 404;
        res.end("Not found");
      });
      if (maybePromise && typeof (maybePromise as Promise<void>).catch === "function") {
        (maybePromise as Promise<void>).catch(rejectPromise);
      }
    } catch (err) {
      rejectPromise(err);
    }

    if (body !== undefined) {
      queueMicrotask(() => {
        const payload = typeof body === "string" ? body : JSON.stringify(body);
        req.emit("data", Buffer.from(payload));
        req.emit("end");
      });
    } else {
      queueMicrotask(() => req.emit("end"));
    }
  });
}
