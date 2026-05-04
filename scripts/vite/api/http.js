// @ts-check
/**
 * @fileoverview Helpers HTTP compartidos para APIs internas de Vite.
 */

/**
 * Envía una respuesta JSON.
 *
 * @param {import("http").ServerResponse} res
 * @param {number} statusCode
 * @param {unknown} data
 */
export function sendJson(res, statusCode, data) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
}

/**
 * Envía una respuesta en texto plano.
 *
 * @param {import("http").ServerResponse} res
 * @param {number} statusCode
 * @param {string} text
 */
export function sendText(res, statusCode, text) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "text/plain");
  res.end(text);
}

/**
 * Lee el cuerpo de un request como string.
 *
 * @param {import("http").IncomingMessage} req
 * @returns {Promise<string>}
 */
export function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

/**
 * Lee y parsea el cuerpo JSON de un request.
 *
 * @param {import("http").IncomingMessage} req
 * @returns {Promise<unknown>}
 */
export async function readJsonBody(req) {
  const body = await readRequestBody(req);
  return JSON.parse(body);
}

/**
 * Parsea y devuelve la URL del request.
 *
 * @param {import("http").IncomingMessage} req
 * @returns {URL}
 */
export function getRequestUrl(req) {
  // host es usualmente provisto por Vite en los headers
  const host = req.headers.host || "localhost";
  return new URL(req.url || "", `http://${host}`);
}
