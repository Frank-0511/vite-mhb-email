// @ts-check
import { EventEmitter } from "node:events";

/**
 * Simula una petición HTTP sobre un middleware sin abrir puertos TCP.
 *
 * @param {(req: any, res: any, next: () => void) => Promise<void> | void} middleware
 * @param {{ method?: string, url: string, body?: unknown }} options
 * @returns {Promise<{ status: number, body: string, json: any, headers: Map<string, string> }>}
 */
export function simulateRequest(middleware, { method = "GET", url, body }) {
  const req = Object.assign(new EventEmitter(), {
    method,
    url,
    headers: { host: "localhost" },
  });
  const headers = new Map();

  return new Promise((resolvePromise, rejectPromise) => {
    let statusCode = 200;
    const res = {
      get statusCode() {
        return statusCode;
      },
      set statusCode(code) {
        statusCode = code;
      },
      setHeader(name, value) {
        headers.set(name, String(value));
      },
      end(chunk) {
        const responseBody = String(chunk ?? "");
        let json = null;
        try {
          json = JSON.parse(responseBody);
        } catch {
          // No es JSON
        }
        resolvePromise({
          status: statusCode,
          body: responseBody,
          json,
          headers,
        });
      },
    };

    try {
      const maybePromise = middleware(req, res, () => {
        res.statusCode = 404;
        res.end("Not found");
      });
      if (maybePromise && typeof maybePromise.catch === "function") {
        maybePromise.catch(rejectPromise);
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
