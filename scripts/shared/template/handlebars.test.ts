import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { render } from "@maizzle/framework";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  applyHandlebars,
  applyLegacySendGridSubstitutions,
  getTemplateData,
} from "./handlebars.ts";

describe("applyLegacySendGridSubstitutions", () => {
  test("sustituye placeholders Legacy solo cuando el dato local existe", () => {
    expect(
      applyLegacySendGridSubstitutions("Hola -first_name- / -missing-", { first_name: "Ana" }),
    ).toBe("Hola Ana / -missing-");
  });

  test("preserva el placeholder Legacy para el build final cuando no se aplica data local", () => {
    expect(applyLegacySendGridSubstitutions("Hola -first_name-", {})).toBe("Hola -first_name-");
  });

  test("Maizzle conserva los placeholders Legacy en el HTML de build", async () => {
    const { html } = await render("<p>Hola -first_name-</p>", {
      expressions: { delimiters: ["[[", "]]"], missingLocal: "{{ local }}" },
    });

    expect(html).toContain("-first_name-");
  });

  test("escapa el valor sustituido para no inyectar HTML", () => {
    expect(applyLegacySendGridSubstitutions("Hola -name-", { name: "<b>Ana</b>" })).toBe(
      "Hola &lt;b&gt;Ana&lt;/b&gt;",
    );
  });

  test("sustituye valores no string pero preserva null, undefined y objetos", () => {
    expect(
      applyLegacySendGridSubstitutions("-total- -activo- -vacio- -sin- -obj-", {
        total: 1200,
        activo: false,
        vacio: null,
        sin: undefined,
        obj: { a: 1 },
      }),
    ).toBe("1200 false -vacio- -sin- -obj-");
  });

  test("devuelve el HTML intacto si no hay datos utilizables", () => {
    expect(applyLegacySendGridSubstitutions("Hola -name-", null)).toBe("Hola -name-");
    expect(applyLegacySendGridSubstitutions("Hola -name-", "texto")).toBe("Hola -name-");
  });

  test("no toca guiones que no delimitan un placeholder válido", () => {
    expect(applyLegacySendGridSubstitutions("uno - dos -no.valido-", { "no.valido": "x" })).toBe(
      "uno - dos -no.valido-",
    );
  });
});

describe("applyHandlebars", () => {
  test("reemplaza variables presentes y vacía las ausentes", () => {
    expect(applyHandlebars("Hola {{ first_name }} {{ missing }}", { first_name: "Ana" })).toBe(
      "Hola Ana ",
    );
  });

  test("escapa el valor con doble llave y lo respeta con triple", () => {
    expect(applyHandlebars("{{ v }}", { v: "<b>x</b>" })).toBe("&lt;b&gt;x&lt;/b&gt;");
    expect(applyHandlebars("{{{ v }}}", { v: "<b>x</b>" })).toBe("<b>x</b>");
  });

  test("preserva los delimitadores Maizzle [[ ]] sin interpretarlos", () => {
    expect(applyHandlebars("[[ page.title ]] {{ v }}", { v: "ok" })).toBe("[[ page.title ]] ok");
  });

  test("devuelve el HTML original cuando la plantilla es inválida", () => {
    const broken = "{{#if }}sin cierre";

    expect(applyHandlebars(broken, {})).toBe(broken);
  });
});

describe("getTemplateData", () => {
  const originalCwd = process.cwd();
  let projectRoot = "";

  beforeEach(() => {
    projectRoot = mkdtempSync(join(tmpdir(), "handlebars-data-"));
    process.chdir(projectRoot);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(projectRoot, { recursive: true, force: true });
  });

  function writeData(templateName: string, content: string) {
    const templateRoot = join(projectRoot, "src", "emails", "templates", templateName);
    mkdirSync(templateRoot, { recursive: true });
    writeFileSync(join(templateRoot, "data.json"), content, "utf8");
  }

  test("lee el data.json del template indicado", () => {
    writeData("welcome", JSON.stringify({ first_name: "Ana" }));

    expect(getTemplateData("welcome")).toEqual({ first_name: "Ana" });
  });

  test("acepta el nombre con extensión .html", () => {
    writeData("welcome", JSON.stringify({ first_name: "Ana" }));

    expect(getTemplateData("welcome.html")).toEqual({ first_name: "Ana" });
  });

  test("devuelve un objeto vacío si el template no tiene data.json", () => {
    expect(getTemplateData("inexistente")).toEqual({});
  });

  test("devuelve un objeto vacío si el data.json es ilegible", () => {
    writeData("roto", "{ no es json");

    expect(getTemplateData("roto")).toEqual({});
  });
});
