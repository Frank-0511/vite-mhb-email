// @ts-check
import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { simulateRequest as request } from "../test-helpers.js";
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
