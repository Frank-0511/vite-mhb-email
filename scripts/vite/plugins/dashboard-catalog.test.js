import { afterEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { getTemplates } from "./dashboard.js";

describe("catálogo del dashboard", () => {
  /** @type {string | null} */
  let rootDir = null;

  afterEach(() => {
    if (rootDir) rmSync(rootDir, { recursive: true, force: true });
    rootDir = null;
  });

  test("se descubre desde templates aunque el fixture no tenga layouts", () => {
    rootDir = mkdtempSync(resolve(tmpdir(), "dashboard-catalog-"));
    mkdirSync(resolve(rootDir, "src/emails/templates/transactional"), { recursive: true });
    writeFileSync(resolve(rootDir, "src/emails/templates/transactional/index.html"), "<p>ok</p>");
    writeFileSync(
      resolve(rootDir, "src/emails/templates/transactional/data.json"),
      JSON.stringify({ titleTemplate: "Transactional" }),
    );

    expect(getTemplates(rootDir).map((template) => template.id)).toEqual(["transactional"]);
  });
});
