// @ts-check
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { getEmailComponentFolders } from "./component-folders.js";

let projectRoot = "";

beforeEach(() => {
  projectRoot = mkdtempSync(join(tmpdir(), "component-folders-"));
});

afterEach(() => {
  rmSync(projectRoot, { recursive: true, force: true });
});

/** @param {string[]} relativeDirs */
function scaffold(relativeDirs) {
  mkdirSync(join(projectRoot, "src", "emails", "layouts"), { recursive: true });
  mkdirSync(join(projectRoot, "src", "emails", "partials"), { recursive: true });
  for (const dir of relativeDirs) {
    mkdirSync(join(projectRoot, "src", "emails", "partials", dir), { recursive: true });
  }
}

describe("getEmailComponentFolders", () => {
  test("siempre encabeza con layouts y la raíz de partials", () => {
    scaffold([]);
    const folders = getEmailComponentFolders(projectRoot);

    expect(folders.slice(0, 2)).toEqual([
      resolve(projectRoot, "src/emails/layouts"),
      resolve(projectRoot, "src/emails/partials"),
    ]);
  });

  test("incluye subcarpetas anidadas de partials para entrypoints index.html", () => {
    scaffold(["organisms/hero", "atoms"]);
    writeFileSync(
      join(projectRoot, "src", "emails", "partials", "organisms", "hero", "index.html"),
      "<div></div>",
      "utf8",
    );

    const folders = getEmailComponentFolders(projectRoot).map((folder) => resolve(folder));

    expect(folders).toContain(resolve(projectRoot, "src/emails/partials/organisms"));
    expect(folders).toContain(resolve(projectRoot, "src/emails/partials/organisms/hero"));
    expect(folders).toContain(resolve(projectRoot, "src/emails/partials/atoms"));
  });

  test("no devuelve archivos, solo carpetas", () => {
    scaffold(["atoms"]);
    writeFileSync(
      join(projectRoot, "src", "emails", "partials", "atoms", "button.html"),
      "<a></a>",
      "utf8",
    );

    const folders = getEmailComponentFolders(projectRoot).map((folder) => resolve(folder));

    expect(folders).not.toContain(resolve(projectRoot, "src/emails/partials/atoms/button.html"));
  });

  test("devuelve las dos raíces aunque partials no exista en disco", () => {
    expect(getEmailComponentFolders(projectRoot)).toEqual([
      resolve(projectRoot, "src/emails/layouts"),
      resolve(projectRoot, "src/emails/partials"),
    ]);
  });
});
