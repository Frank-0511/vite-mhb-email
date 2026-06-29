// @ts-check
/**
 * @fileoverview Prueba de humo para confirmar que el runner de tests descubre
 * archivos en scripts/shared/ y que getProjectPaths retorna las rutas esperadas.
 */

import { describe, expect, test } from "bun:test";
import { resolve } from "node:path";
import { getProjectPaths } from "./paths.js";

describe("getProjectPaths", () => {
  test("retorna distDir relativo al rootDir proporcionado", () => {
    const rootDir = "/fake/root";
    const paths = getProjectPaths(rootDir);
    expect(paths.distDir).toBe(resolve(rootDir, "dist"));
  });

  test("retorna templatesRoot relativo al rootDir proporcionado", () => {
    const rootDir = "/fake/root";
    const paths = getProjectPaths(rootDir);
    expect(paths.templatesRoot).toBe(resolve(rootDir, "src/emails/templates"));
  });

  test("templateHtml construye la ruta correcta para un template", () => {
    const rootDir = "/fake/root";
    const paths = getProjectPaths(rootDir);
    expect(paths.templateHtml("welcome")).toBe(
      resolve(rootDir, "src/emails/templates/welcome/index.html"),
    );
  });

  test("templateData construye la ruta correcta para un template", () => {
    const rootDir = "/fake/root";
    const paths = getProjectPaths(rootDir);
    expect(paths.templateData("newsletter")).toBe(
      resolve(rootDir, "src/emails/templates/newsletter/data.json"),
    );
  });
});
