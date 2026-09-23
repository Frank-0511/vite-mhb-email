/**
 * @fileoverview Middleware HTTP para la biblioteca de componentes (/api/components/*).
 */

import type { IncomingMessage, ServerResponse } from "node:http";
import type { ViteDevServer } from "vite";
import { API_ROUTES } from "../../shared/contracts/constants/api-routes.ts";
import {
  isValidComponentIdentifier,
  listComponents,
  readComponentSchema,
} from "../services/catalog/index.ts";
import { renderComponentPreview } from "../services/render/index.ts";
import { asyncHandler, getRequestUrl, readJsonBody, sendJson, sendText } from "./http.ts";

/**
 * Maneja GET /api/components — listado.
 */
function handleList(res: ServerResponse, rootDir: string): void {
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
 */
function handleGetSchema(res: ServerResponse, rootDir: string, componentName: string): void {
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
 */
async function handleRender(
  req: IncomingMessage,
  res: ServerResponse,
  rootDir: string,
  componentName: string,
): Promise<void> {
  if (!isValidComponentIdentifier(componentName)) {
    return sendJson(res, 400, {
      success: false,
      code: "INVALID_COMPONENT_NAME",
      error: "Invalid component name",
    });
  }

  let body: unknown;
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

  const payload = body as Record<string, unknown>;
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
      props: props && typeof props === "object" ? (props as Record<string, unknown>) : {},
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
 * @param server Servidor de desarrollo Vite.
 * @param rootDir Directorio raíz del proyecto.
 */
export function setupComponentsApi(server: ViteDevServer, rootDir: string): void {
  server.middlewares.use(
    asyncHandler(async (req, res, next) => {
      if (!req.url?.startsWith(API_ROUTES.COMPONENTS)) {
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
    }),
  );
}
