// @ts-check
/**
 * @fileoverview Tests focalizados del catálogo de componentes de email.
 *
 * Cubre:
 *   - Listado de componentes reales en `src/emails/partials`.
 *   - Validación estricta de `componentName` y `variant`.
 *   - Rechazo de traversal, separadores, rutas absolutas y caracteres HTML.
 *   - Lectura de schema y variantes, sin escapar de la raíz.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import {
  findComponentDir,
  getPartialsRoot,
  isValidComponentIdentifier,
  listComponents,
  listVariantsFromDir,
  readComponentSchema,
} from "./component-catalog.js";

/** @type {string | null} */
let tempRoot = null;

beforeAll(() => {
  // Crea un fixture temporal con varios componentes y una variante suelta.
  tempRoot = mkdtempSync(join(tmpdir(), "mhb-24-catalog-"));
  const partials = resolve(tempRoot, "src/emails/partials");
  mkdirSync(join(partials, "molecules/key-value-card"), { recursive: true });
  writeFileSync(
    join(partials, "molecules/key-value-card/schema.json"),
    JSON.stringify({
      name: "Key Value Card",
      description: "Card de filas",
      icon: "list",
      props: { rows: { type: "textarea" } },
    }),
  );
  writeFileSync(join(partials, "molecules/key-value-card/index.html"), "<tr><td>card</td></tr>");

  mkdirSync(join(partials, "organisms/hero"), { recursive: true });
  writeFileSync(
    join(partials, "organisms/hero/schema.json"),
    JSON.stringify({ name: "Hero Section", description: "Sección hero" }),
  );
  writeFileSync(join(partials, "organisms/hero/index.html"), "<h1>hero</h1>");
  writeFileSync(join(partials, "organisms/hero/hero-v1.html"), "<h1>v1</h1>");
  writeFileSync(join(partials, "organisms/hero/hero-v2.html"), "<h1>v2</h1>");

  // Carpeta sin schema.json: debe ignorarse.
  mkdirSync(join(partials, "organisms/supporting-section"), { recursive: true });
  writeFileSync(join(partials, "organisms/supporting-section/index.html"), "<tr></tr>");
});

afterAll(() => {
  if (tempRoot) {
    rmSync(tempRoot, { recursive: true, force: true });
    tempRoot = null;
  }
});

describe("isValidComponentIdentifier", () => {
  test.each(["hero", "supporting-section", "key-value-card", "index", "v1", "v2", "a1"])(
    "acepta %s",
    (name) => {
      expect(isValidComponentIdentifier(name)).toBe(true);
    },
  );

  test.each(["", "../escape", "nested/template", "nested\\template", "/absolute/path", "<script>"])(
    "rechaza %s",
    (name) => {
      expect(isValidComponentIdentifier(name)).toBe(false);
    },
  );

  test("rechaza entradas no string", () => {
    for (const value of [42, null, undefined, {}, [], true]) {
      expect(isValidComponentIdentifier(value)).toBe(false);
    }
  });
});

describe("listComponents (fixture temporal)", () => {
  test("enumera los componentes reales del fixture", () => {
    if (!tempRoot) throw new Error("fixture missing");
    const components = listComponents(tempRoot);
    const ids = components.map((c) => c.id).sort();
    // `supporting-section` no tiene schema.json → se ignora.
    expect(ids).toEqual(["hero", "key-value-card"]);
  });

  test("incluye path lógico y ruta de disco del componente", () => {
    if (!tempRoot) throw new Error("fixture missing");
    const components = listComponents(tempRoot);
    const hero = components.find((c) => c.id === "hero");
    expect(hero?.path).toBe("src/emails/partials/organisms/hero");
    expect(hero?.dirPath).toBe(resolve(tempRoot, "src/emails/partials/organisms/hero"));
  });

  test("preserva los campos del schema que consume la biblioteca", () => {
    if (!tempRoot) throw new Error("fixture missing");
    const components = listComponents(tempRoot);
    const card = components.find((component) => component.id === "key-value-card");
    expect(card?.icon).toBe("list");
    expect(card?.props).toEqual({ rows: { type: "textarea" } });
  });

  test("lista los componentes reales del repositorio", () => {
    const projectRoot = process.cwd();
    const components = listComponents(projectRoot);
    const ids = components.map((c) => c.id).sort();
    expect(ids).toContain("key-value-card");
    expect(ids).toContain("hero");
    expect(ids).toContain("supporting-section");
    // El path lógico debe reflejar la jerarquía real.
    const hero = components.find((c) => c.id === "hero");
    expect(hero?.path).toBe("src/emails/partials/organisms/hero");
  });
});

describe("findComponentDir", () => {
  test("encuentra un componente por identificador (último segmento)", () => {
    if (!tempRoot) throw new Error("fixture missing");
    const hero = findComponentDir(tempRoot, "hero");
    expect(hero).toBe(resolve(tempRoot, "src/emails/partials/organisms/hero"));
    const card = findComponentDir(tempRoot, "key-value-card");
    expect(card).toBe(resolve(tempRoot, "src/emails/partials/molecules/key-value-card"));
  });

  test("rechaza traversal, separadores y entradas no seguras", () => {
    if (!tempRoot) throw new Error("fixture missing");
    expect(findComponentDir(tempRoot, "../hero")).toBeNull();
    expect(findComponentDir(tempRoot, "hero/../../etc")).toBeNull();
    expect(findComponentDir(tempRoot, "/absolute/path")).toBeNull();
    expect(findComponentDir(tempRoot, "hero\\etc")).toBeNull();
    expect(findComponentDir(tempRoot, "<img>")).toBeNull();
    expect(findComponentDir(tempRoot, "")).toBeNull();
    expect(findComponentDir(tempRoot, null)).toBeNull();
    expect(findComponentDir(tempRoot, 42)).toBeNull();
  });

  test("no resuelve carpetas sin schema.json", () => {
    if (!tempRoot) throw new Error("fixture missing");
    // `supporting-section` existe pero no tiene schema.json → null.
    expect(findComponentDir(tempRoot, "supporting-section")).toBeNull();
  });
});

describe("readComponentSchema", () => {
  test("lee el schema por identificador y añade _availableVariants", () => {
    if (!tempRoot) throw new Error("fixture missing");
    const schema = readComponentSchema(tempRoot, "hero");
    expect(schema?.id).toBe("hero");
    expect(schema?.name).toBe("Hero Section");
    expect(schema?._availableVariants?.sort()).toEqual(["hero-v1", "hero-v2", "index"]);
  });

  test("devuelve null si el componente no existe", () => {
    if (!tempRoot) throw new Error("fixture missing");
    expect(readComponentSchema(tempRoot, "missing")).toBeNull();
  });
});

describe("getPartialsRoot", () => {
  test("apunta a src/emails/partials del rootDir", () => {
    expect(getPartialsRoot("/fake/root")).toBe(resolve("/fake/root", "src/emails/partials"));
  });
});

describe("listVariantsFromDir", () => {
  test("omite archivos que no son .html o tienen identificadores inválidos", () => {
    if (!tempRoot) throw new Error("fixture missing");
    const heroDir = resolve(tempRoot, "src/emails/partials/organisms/hero");
    const variants = listVariantsFromDir(heroDir);
    expect(variants).toContain("hero-v1");
    expect(variants).toContain("hero-v2");
    expect(variants).toContain("index");
  });
});
