// @ts-check
/** @fileoverview Middleware HTTP para la biblioteca de componentes. */

import {
  isValidComponentIdentifier,
  listComponents,
  readComponentSchema,
} from "../services/component-catalog.js";
import { renderComponentPreview } from "../services/component-preview-renderer.js";
import { getRequestUrl, readJsonBody, sendJson, sendText } from "./http.js";

/**
 * Maneja GET /api/components — listado.
 *
 * @param {import("http").ServerResponse} res
 * @param {string} rootDir
 */
function handleList(res, rootDir) {
  try {
    const components = listComponents(rootDir);
    sendJson(res, 200, components);
  } catch (err) {
    console.error("[components] List Error:", err);
    sendJson(res, 500, { success: false, error: "Internal error listing components" });
  }
}

/**
 * Maneja GET /api/components/:name — schema + variantes.
 *
 * @param {import("http").ServerResponse} res
 * @param {string} rootDir
 * @param {string} componentName
 */
function handleGetSchema(res, rootDir, componentName) {
  if (!isValidComponentIdentifier(componentName)) {
    return sendJson(res, 400, {
      success: false,
      code: "INVALID_COMPONENT_NAME",
      error: "Invalid component name",
    });
  }
  try {
    const schema = readComponentSchema(rootDir, componentName);
    if (!schema) {
      return sendJson(res, 404, { success: false, error: "Component not found" });
    }
    sendJson(res, 200, schema);
  } catch (err) {
    console.error("[components] Get Error:", err);
    sendJson(res, 500, { success: false, error: "Internal error reading component" });
  }
}

/**
 * Maneja POST /api/components/:name/render — render de variante.
 *
 * @param {import("http").IncomingMessage} req
 * @param {import("http").ServerResponse} res
 * @param {string} rootDir
 * @param {string} componentName
 */
async function handleRender(req, res, rootDir, componentName) {
  if (!isValidComponentIdentifier(componentName)) {
    return sendJson(res, 400, {
      success: false,
      code: "INVALID_COMPONENT_NAME",
      error: "Invalid component name",
    });
  }

  /** @type {unknown} */
  let body;
  try {
    body = await readJsonBody(req);
  } catch {
    return sendJson(res, 400, {
      success: false,
      code: "INVALID_BODY",
      error: "Invalid JSON body",
    });
  }

  if (!body || typeof body !== "object") {
    return sendJson(res, 400, {
      success: false,
      code: "INVALID_BODY",
      error: "Body must be a JSON object",
    });
  }

  const payload = /** @type {Record<string, unknown>} */ (body);
  const variant = payload.variant;
  const props = payload.props;

  if (typeof variant !== "string" || !isValidComponentIdentifier(variant)) {
    return sendJson(res, 400, {
      success: false,
      code: "INVALID_VARIANT",
      error: "Invalid or missing variant",
    });
  }

  try {
    const renderedHtml = await renderComponentPreview({
      rootDir,
      componentName,
      variant,
      props:
        props && typeof props === "object" ? /** @type {Record<string, unknown>} */ (props) : {},
    });
    const iframeHtml = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="/index.css">
</head>
<body style="margin: 0; padding: 0;">
  ${renderedHtml}
</body>
</html>`;
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/html");
    res.end(iframeHtml);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Render failed";
    console.error("[components] Render Error:", err);
    if (message.startsWith("Variant '")) {
      return sendJson(res, 404, {
        success: false,
        code: "VARIANT_NOT_FOUND",
        error: message,
      });
    }
    sendJson(res, 500, { success: false, error: "Internal error rendering component" });
  }
}

/**
 * Registra el middleware `/api/components` en el servidor de Vite.
 *
 * @param {import("vite").ViteDevServer} server
 * @param {string} rootDir
 */
export function setupComponentsApi(server, rootDir) {
  server.middlewares.use(async (req, res, next) => {
    if (!req.url?.startsWith("/api/components")) {
      return next();
    }

    const url = getRequestUrl(req);
    const segments = url.pathname.split("/").filter(Boolean);
    const componentName = segments[2];

    try {
      if (req.method === "GET" && (!componentName || componentName === "")) {
        return handleList(res, rootDir);
      }

      if (req.method === "GET" && componentName && segments.length === 3) {
        return handleGetSchema(res, rootDir, componentName);
      }

      if (
        req.method === "POST" &&
        componentName &&
        segments.length === 4 &&
        segments[3] === "render"
      ) {
        return await handleRender(req, res, rootDir, componentName);
      }

      if (req.method !== "GET" && req.method !== "POST") {
        return sendJson(res, 405, { success: false, error: "Method not allowed" });
      }

      return sendText(res, 404, "Not found");
    } catch (err) {
      console.error("[components] Unexpected Error:", err);
      return sendJson(res, 500, { success: false, error: "Internal error" });
    }
  });
}
