// @ts-check
import { afterEach, describe, expect, test } from "bun:test";
import { EventEmitter } from "node:events";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setupComponentsApi } from "./components.js";

/** @type {string[]} */
const temporaryRoots = [];

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

function createFixtureRoot() {
  const root = mkdtempSync(join(tmpdir(), "mhb-24-components-api-"));
  temporaryRoots.push(root);
  const componentDir = join(root, "src/emails/partials/atoms/badge");
  mkdirSync(componentDir, { recursive: true });
  writeFileSync(
    join(componentDir, "schema.json"),
    JSON.stringify({ name: "Badge", icon: "tag", props: { label: { type: "string" } } }),
  );
  writeFileSync(join(componentDir, "index.html"), "<span>[[label]]</span>");
  return root;
}

function getComponentsMiddleware(rootDir) {
  /** @type {(req: import("http").IncomingMessage, res: import("http").ServerResponse, next: () => void) => Promise<void>} */
  let middleware;
  setupComponentsApi(
    /** @type {import("vite").ViteDevServer} */ ({
      middlewares: {
        use(handler) {
          middleware = handler;
        },
      },
    }),
    rootDir,
  );

  return middleware;
}

function request(middleware, { method, url, body }) {
  const req = /** @type {import("http").IncomingMessage} */ (
    Object.assign(new EventEmitter(), { method, url, headers: { host: "localhost" } })
  );
  const headers = new Map();
  return new Promise((resolve, reject) => {
    const res = /** @type {import("http").ServerResponse} */ ({
      statusCode: 200,
      setHeader(name, value) {
        headers.set(name, value);
      },
      end(responseBody) {
        resolve({ status: this.statusCode, body: String(responseBody ?? ""), headers });
      },
    });
    middleware(req, res, () => {
      res.statusCode = 404;
      res.end("Not found");
    }).catch(reject);
    if (body !== undefined) {
      queueMicrotask(() => {
        req.emit("data", Buffer.from(body));
        req.emit("end");
      });
    }
  });
}

describe("components API", () => {
  test("GET listado conserva los campos del schema de la biblioteca", async () => {
    const response = await request(getComponentsMiddleware(createFixtureRoot()), {
      method: "GET",
      url: "/api/components",
    });
    const components = JSON.parse(response.body);
    expect(response.status).toBe(200);
    expect(components).toEqual([
      expect.objectContaining({
        id: "badge",
        icon: "tag",
        props: { label: { type: "string" } },
        path: "src/emails/partials/atoms/badge",
      }),
    ]);
  });

  test("POST no acepta segmentos después de /render", async () => {
    const response = await request(getComponentsMiddleware(createFixtureRoot()), {
      method: "POST",
      url: "/api/components/badge/render/unexpected",
      body: JSON.stringify({ variant: "index", props: { label: "Hola" } }),
    });
    expect(response.status).toBe(404);
    expect(response.body).toBe("Not found");
  });
});
