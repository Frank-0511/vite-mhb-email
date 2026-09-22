import { afterEach, describe, expect, test } from "bun:test";
import type { IncomingMessage, ServerResponse } from "node:http";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { ViteDevServer } from "vite";
import { simulateRequest as request } from "../test-helpers.ts";
import { setupComponentsApi } from "./components.ts";

const temporaryRoots: string[] = [];

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

function createFixtureRoot(): string {
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

function getComponentsMiddleware(
  rootDir: string,
): (req: IncomingMessage, res: ServerResponse, next: (err?: unknown) => void) => Promise<void> {
  let middleware!: (
    req: IncomingMessage,
    res: ServerResponse,
    next: (err?: unknown) => void,
  ) => Promise<void>;

  setupComponentsApi(
    {
      middlewares: {
        use(
          handler: (
            req: IncomingMessage,
            res: ServerResponse,
            next: (err?: unknown) => void,
          ) => Promise<void>,
        ) {
          middleware = handler;
        },
      },
    } as unknown as ViteDevServer,
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
