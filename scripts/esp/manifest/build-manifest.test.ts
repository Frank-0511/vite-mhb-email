import { afterEach, describe, expect, test } from "vitest";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildEspManifest } from "./build-manifest.ts";
import { isEspManifest } from "./guard.ts";

describe("buildEspManifest", () => {
  const tempDirs: string[] = [];

  function createProjectFixture() {
    const root = mkdtempSync(join(tmpdir(), "esp-manifest-"));
    tempDirs.push(root);
    const distDir = join(root, "dist");
    const templatesDir = join(root, "src", "emails", "templates");
    mkdirSync(distDir, { recursive: true });
    mkdirSync(templatesDir, { recursive: true });
    return { root, distDir, templatesDir };
  }

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  test("lanza error accionable si dist/ no existe", () => {
    const root = mkdtempSync(join(tmpdir(), "esp-manifest-nodist-"));
    tempDirs.push(root);
    expect(() => buildEspManifest(root)).toThrow(
      /El directorio dist\/ no existe\. Ejecuta .*run build primero\./,
    );
  });

  test("genera la estructura completa y ordenada para template simple", () => {
    const { root, distDir, templatesDir } = createProjectFixture();

    writeFileSync(
      join(distDir, "welcome.html"),
      "<p>Hola {{ first_name }}, visita {{ dashboard_url }}</p>",
      "utf8",
    );

    const welcomeSrc = join(templatesDir, "welcome");
    mkdirSync(welcomeSrc, { recursive: true });
    writeFileSync(
      join(welcomeSrc, "index.html"),
      "---\nespVariables:\n  - role\n---\n<p>Hola</p>",
      "utf8",
    );
    writeFileSync(
      join(welcomeSrc, "data.json"),
      JSON.stringify({
        first_name: "Frank",
        dashboard_url: "https://miempresa.com",
        role: "admin",
      }),
      "utf8",
    );

    const manifest = buildEspManifest(root);
    expect(isEspManifest(manifest)).toBe(true);
    expect(manifest.version).toBe(1);
    expect(manifest.profiles).toEqual(["sendgrid", "sendgrid-legacy"]);

    const welcome = manifest.templates.welcome;
    expect(welcome.file).toBe("welcome.html");
    expect(welcome.requiredVariables).toEqual(["dashboard_url", "first_name"]);
    expect(welcome.intentionalVariables).toEqual(["role"]);
    expect(welcome.exampleData).toEqual({
      dashboard_url: "https://miempresa.com",
      first_name: "<first_name>",
      role: "admin",
    });
    expect(welcome.legacy.convertible).toBe(true);
    expect(welcome.legacy.tags).toEqual({
      dashboard_url: "-dashboard_url-",
      first_name: "-first_name-",
    });
    expect(welcome.legacy.issues).toEqual([]);
  });

  test("soporta intentionalVariables en formato lista YAML e inline JSON-like", () => {
    const { root, distDir, templatesDir } = createProjectFixture();

    writeFileSync(join(distDir, "t1.html"), "<p>{{ a }}</p>", "utf8");
    const t1Src = join(templatesDir, "t1");
    mkdirSync(t1Src, { recursive: true });
    writeFileSync(
      join(t1Src, "index.html"),
      "---\nespVariables:\n  - y\n  - x\n---\n<p>{{ a }}</p>",
      "utf8",
    );

    writeFileSync(join(distDir, "t2.html"), "<p>{{ b }}</p>", "utf8");
    const t2Src = join(templatesDir, "t2");
    mkdirSync(t2Src, { recursive: true });
    writeFileSync(
      join(t2Src, "index.html"),
      '---\nespVariables: ["k", "j"]\n---\n<p>{{ b }}</p>',
      "utf8",
    );

    const manifest = buildEspManifest(root);
    expect(manifest.templates.t1.intentionalVariables).toEqual(["x", "y"]);
    expect(manifest.templates.t2.intentionalVariables).toEqual(["j", "k"]);
  });

  test("fuente inexistente produce intentionalVariables vacías", () => {
    const { root, distDir } = createProjectFixture();
    writeFileSync(join(distDir, "orphan.html"), "<p>{{ a }}</p>", "utf8");

    const manifest = buildEspManifest(root);
    expect(manifest.templates.orphan.intentionalVariables).toEqual([]);
    expect(manifest.templates.orphan.exampleData).toEqual({});
  });

  test("data.json inexistente o inválido no rompe la generación", () => {
    const { root, distDir, templatesDir } = createProjectFixture();
    writeFileSync(join(distDir, "broken.html"), "<p>{{ val }}</p>", "utf8");
    const brokenSrc = join(templatesDir, "broken");
    mkdirSync(brokenSrc, { recursive: true });
    writeFileSync(join(brokenSrc, "data.json"), "{ invalid json", "utf8");

    const manifest = buildEspManifest(root);
    expect(manifest.templates.broken.exampleData).toEqual({});
  });

  test("produce un resultado determinista e idéntico en múltiples ejecuciones", () => {
    const { root, distDir } = createProjectFixture();
    writeFileSync(join(distDir, "beta.html"), "<p>{{ b }}</p>", "utf8");
    writeFileSync(join(distDir, "alpha.html"), "<p>{{ a }}</p>", "utf8");

    const manifest1 = buildEspManifest(root);
    const manifest2 = buildEspManifest(root);
    expect(JSON.stringify(manifest1)).toBe(JSON.stringify(manifest2));
    expect(Object.keys(manifest1.templates)).toEqual(["alpha", "beta"]);
  });

  test("template con bloques if marca legacy.convertible como false y reporta issues", () => {
    const { root, distDir } = createProjectFixture();
    writeFileSync(
      join(distDir, "conditional.html"),
      "<p>{{#if a}}VIP{{/if}} {{ user_id }}</p>",
      "utf8",
    );

    const manifest = buildEspManifest(root);
    const item = manifest.templates.conditional;
    expect(item.requiredVariables).toEqual(["user_id"]);
    expect(item.legacy.convertible).toBe(false);
    expect(item.legacy.issues.length).toBeGreaterThanOrEqual(1);
    expect(item.legacy.tags).toEqual({
      user_id: "-user_id-",
    });
  });
});
