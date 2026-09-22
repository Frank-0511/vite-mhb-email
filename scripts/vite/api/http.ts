/**
 * @fileoverview Helpers HTTP compartidos para APIs internas de Vite.
 */

import type { IncomingMessage, ServerResponse } from "node:http";

/**
 * Envía una respuesta JSON.
 */
export function sendJson(res: ServerResponse, statusCode: number, data: unknown): void {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
}

/**
 * Envía una respuesta en texto plano.
 */
export function sendText(res: ServerResponse, statusCode: number, text: string): void {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "text/plain");
  res.end(text);
}

/**
 * Lee el cuerpo de un request como string.
 */
export function readRequestBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk: Buffer | string) => {
      body += chunk.toString();
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

/**
 * Lee y parsea el cuerpo JSON de un request.
 */
export async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const body = await readRequestBody(req);
  return JSON.parse(body);
}

/**
 * Parsea y devuelve la URL del request.
 */
export function getRequestUrl(req: IncomingMessage): URL {
  const host = req.headers.host || "localhost";
  return new URL(req.url || "", `http://${host}`);
}
