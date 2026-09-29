/**
 * @fileoverview Helpers HTTP compartidos para APIs internas de Vite.
 */

import type { IncomingMessage, ServerResponse } from "node:http";
import {
  CONTENT_TYPE_JSON,
  HEADER_CONTENT_TYPE,
  HEADER_ORIGIN,
  HEADER_SEC_FETCH_SITE,
  HTTP_WRITE_METHODS,
  SEC_FETCH_SITE_TRUSTED,
} from "../../shared/contracts/constants/http-security.ts";

const WRITE_METHODS = new Set<string>(HTTP_WRITE_METHODS);
const TRUSTED_SEC_FETCH_SITE = new Set<string>(SEC_FETCH_SITE_TRUSTED);

/**
 * Normaliza y extrae el primer valor de una cabecera HTTP.
 */
function firstHeader(headers: IncomingMessage["headers"], name: string): string | undefined {
  const value = headers[name.toLowerCase()];
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export interface WriteGuardOptions {
  /** Exige Content-Type application/json (por defecto true). */
  requireJson?: boolean;
}

/**
 * Rechaza con 403 las escrituras que no provengan del propio dashboard.
 *
 * @param req Objeto de petición HTTP entrante.
 * @param res Objeto de respuesta HTTP del servidor.
 * @param options Opciones de configuración de la guarda.
 * @returns true si la petición fue rechazada (respuesta ya enviada); false si puede continuar.
 */
export function rejectUnsafeWrite(
  req: IncomingMessage,
  res: ServerResponse,
  options: WriteGuardOptions = {},
): boolean {
  if (!req.method || !WRITE_METHODS.has(req.method.toUpperCase())) {
    return false;
  }

  const secFetchSite = firstHeader(req.headers, HEADER_SEC_FETCH_SITE);
  if (secFetchSite !== undefined) {
    const normalizedSite = secFetchSite.trim().toLowerCase();
    if (!TRUSTED_SEC_FETCH_SITE.has(normalizedSite)) {
      sendJson(res, 403, {
        success: false,
        error: "Petición cross-site bloqueada: la API local solo acepta llamadas del dashboard.",
      });
      return true;
    }
  }

  const origin = firstHeader(req.headers, HEADER_ORIGIN);
  if (origin !== undefined) {
    let originHost: string | undefined;
    try {
      originHost = new URL(origin).host;
    } catch {
      originHost = undefined;
    }

    const expectedHost = firstHeader(req.headers, "host");
    if (!originHost || !expectedHost || originHost !== expectedHost) {
      sendJson(res, 403, {
        success: false,
        error: `Origin no permitido: ${origin}. Abre el dashboard desde este mismo servidor.`,
      });
      return true;
    }
  }

  if (options.requireJson !== false) {
    const contentType = firstHeader(req.headers, HEADER_CONTENT_TYPE);
    const mediaType = contentType ? contentType.split(";")[0]?.trim().toLowerCase() : undefined;
    if (mediaType !== CONTENT_TYPE_JSON) {
      sendJson(res, 403, {
        success: false,
        error: "Content-Type debe ser application/json.",
      });
      return true;
    }
  }

  return false;
}

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

/**
 * Envuelve un middleware async para capturar errores y devolver JSON 500.
 */
export function asyncHandler(
  fn: (req: IncomingMessage, res: ServerResponse, next: () => void) => Promise<void>,
): (req: IncomingMessage, res: ServerResponse, next: () => void) => void {
  return (req, res, next) => {
    fn(req, res, next).catch((err: unknown) => {
      if (res.headersSent) {
        res.end();
        return;
      }
      sendJson(res, 500, { error: err instanceof Error ? err.message : String(err) });
    });
  };
}
