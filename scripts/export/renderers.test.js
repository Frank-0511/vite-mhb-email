import { describe, expect, test } from "bun:test";
import { createPuppeteerRenderer } from "./renderers.js";

describe("createPuppeteerRenderer", () => {
  test("devuelve false cuando el navegador no inicia, sin lanzar un navegador real", async () => {
    let launchCalls = 0;
    const render = createPuppeteerRenderer({
      launch: () => {
        launchCalls += 1;
        return Promise.reject(new Error("Chrome executable missing"));
      },
    });

    await expect(render("/tmp/email.html", "/tmp/email.png")).resolves.toBe(false);
    expect(launchCalls).toBe(1);
  });
});
