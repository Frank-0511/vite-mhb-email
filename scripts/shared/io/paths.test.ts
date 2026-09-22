import { describe, expect, test } from "bun:test";
import { isAbsolute, join, resolve, sep } from "node:path";
import { getProjectPaths } from "./paths.ts";

describe("getProjectPaths", () => {
  test("deriva todas las rutas centrales como absolutas bajo la raíz dada", () => {
    const root = resolve(sep, "tmp", "proyecto");
    const paths = getProjectPaths(root);

    for (const value of [
      paths.distDir,
      paths.templatesRoot,
      paths.layoutsRoot,
      paths.partialsRoot,
      paths.stylesRoot,
      paths.maizzleConfig,
      paths.tailwindEmailConfig,
    ]) {
      expect(isAbsolute(value)).toBe(true);
      expect(value.startsWith(root + sep)).toBe(true);
    }
  });

  test("resuelve el trío de rutas por template dentro de templatesRoot", () => {
    const root = resolve(sep, "tmp", "proyecto");
    const paths = getProjectPaths(root);

    expect(paths.templateDir("welcome")).toBe(join(paths.templatesRoot, "welcome"));
    expect(paths.templateHtml("welcome")).toBe(join(paths.templatesRoot, "welcome", "index.html"));
    expect(paths.templateData("welcome")).toBe(join(paths.templatesRoot, "welcome", "data.json"));
  });

  test("normaliza una raíz relativa contra el directorio de trabajo", () => {
    expect(getProjectPaths(".").distDir).toBe(resolve(process.cwd(), "dist"));
  });
});
