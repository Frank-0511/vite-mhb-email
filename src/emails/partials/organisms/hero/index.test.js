// @ts-check
/**
 * @fileoverview Contrato del despachador de variantes de `hero`.
 *
 * Maizzle no propaga props a los componentes hijos: el despachador debe
 * reenviar cada uno explícitamente. Estas pruebas compilan el componente con
 * Maizzle, igual que el build, y fijan ese reenvío para ambas variantes.
 */

import { render } from "@maizzle/framework";
import { describe, expect, test } from "bun:test";
import { getEmailComponentFolders } from "../../../../../scripts/shared/component-folders.js";

/**
 * Compila un fragmento que usa `<x-hero>` con las carpetas de componentes reales.
 *
 * @param {string} tag
 * @returns {Promise<string>}
 */
async function renderHero(tag) {
  const { html } = await render(tag, {
    components: {
      folders: getEmailComponentFolders(process.cwd()),
      tagPrefix: "x-",
    },
    expressions: {
      delimiters: ["[[", "]]"],
      unescapedDelimiters: ["[[[", "]]]"],
    },
  });
  return html;
}

describe("hero — reenvío de props del despachador", () => {
  test("la variante por defecto recibe title, subtitle y button-text", async () => {
    const html = await renderHero(
      '<x-hero title="Titulo propio" subtitle="Subtitulo propio" button-text="Ir ahora" />',
    );
    expect(html).toContain("Titulo propio");
    expect(html).toContain("Subtitulo propio");
    expect(html).toContain("Ir ahora");
    expect(html).not.toContain("Bienvenido a Mi Empresa");
  });

  test("la variante v2 recibe los mismos props", async () => {
    const html = await renderHero(
      '<x-hero variant="v2" title="Titulo v2" subtitle="Subtitulo v2" button-text="Ir v2" />',
    );
    expect(html).toContain("Titulo v2");
    expect(html).toContain("Subtitulo v2");
    expect(html).toContain("Ir v2");
  });

  test("sin props conserva los valores por defecto del componente", async () => {
    const html = await renderHero("<x-hero />");
    expect(html).toContain("Bienvenido a Mi Empresa");
    expect(html).toContain("Descubre todo lo que podemos hacer por ti");
    expect(html).toContain("Explorar ahora");
  });

  test("show-button=false oculta el CTA", async () => {
    const html = await renderHero('<x-hero show-button="false" button-text="No visible" />');
    expect(html).not.toContain("No visible");
  });

  test("show-button=false también se respeta llamando la variante directamente", async () => {
    const v1 = await renderHero('<x-hero-v1 show-button="false" button-text="No visible" />');
    const v2 = await renderHero('<x-hero-v2 show-button="false" button-text="No visible" />');
    expect(v1).not.toContain("No visible");
    expect(v2).not.toContain("No visible");
  });
});
