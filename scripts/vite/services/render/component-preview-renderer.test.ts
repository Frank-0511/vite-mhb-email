import { describe, expect, test } from "bun:test";
import { renderComponentPreview } from "./component-preview-renderer.ts";

describe("renderComponentPreview — entradas inválidas", () => {
  const rootDir = process.cwd();

  test("rechaza componentName con traversal antes del render", async () => {
    await expect(
      renderComponentPreview({ rootDir, componentName: "../etc", variant: "v1", props: {} }),
    ).rejects.toThrow(/Invalid component name/);
  });

  test("rechaza componentName con caracteres HTML antes del render", async () => {
    await expect(
      renderComponentPreview({
        rootDir,
        componentName: "<img onerror=alert(1)>",
        variant: "v1",
        props: {},
      }),
    ).rejects.toThrow(/Invalid component name/);
  });

  test("rechaza variant inválida antes del render", async () => {
    await expect(
      renderComponentPreview({
        rootDir,
        componentName: "hero",
        variant: "../escape",
        props: {},
      }),
    ).rejects.toThrow(/Invalid variant/);
  });

  test("rechaza variant vacía", async () => {
    await expect(
      renderComponentPreview({
        rootDir,
        componentName: "hero",
        variant: "",
        props: {},
      }),
    ).rejects.toThrow(/Invalid variant/);
  });
});

describe("renderComponentPreview — variante inexistente", () => {
  test("lanza Error con mensaje controlado, sin HTML ejecutable", async () => {
    const rootDir = process.cwd();
    try {
      await renderComponentPreview({
        rootDir,
        componentName: "hero",
        variant: "ghost-variant",
        props: {},
      });
      throw new Error("expected render to fail");
    } catch (err) {
      expect(err).toBeInstanceOf(Error);
      const message = (err as Error).message;
      expect(message).toContain("ghost-variant");
      expect(message).not.toContain("<script");
      expect(message).not.toContain("onerror");
      expect(message).not.toContain("</");
    }
  });
});

describe("renderComponentPreview — render válido", () => {
  test("renderiza hero v1 con props por defecto", async () => {
    const rootDir = process.cwd();
    const html = await renderComponentPreview({
      rootDir,
      componentName: "hero",
      variant: "v1",
      props: {},
    });
    expect(typeof html).toBe("string");
    expect(html.length).toBeGreaterThan(0);
    // El HTML resultante ya no debe contener delimitadores Maizzle remanentes.
    expect(html).not.toContain("[[title]]");
  });

  test("conserva literalmente el subtítulo por defecto", async () => {
    const html = await renderComponentPreview({
      rootDir: process.cwd(),
      componentName: "hero",
      variant: "v1",
      props: {},
    });
    expect(html).toContain("Descubre todo lo que podemos hacer por ti");
  });

  test("respeta showButton=false al renderizar el despachador index", async () => {
    const html = await renderComponentPreview({
      rootDir: process.cwd(),
      componentName: "hero",
      variant: "index",
      props: { showButton: false, buttonText: "CTA que no debe aparecer" },
    });
    expect(html).not.toContain("CTA que no debe aparecer");
  });
});
