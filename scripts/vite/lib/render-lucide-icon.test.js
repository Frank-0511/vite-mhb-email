// @ts-check
import { describe, expect, test } from "bun:test";
import { renderLucideIcon } from "./render-lucide-icon.js";

describe("renderLucideIcon", () => {
  test("renderiza el icono download correctamente", () => {
    const svg = renderLucideIcon("download", {
      id: "icon-export-existing-download",
      style: "width: 16px; height: 16px; display: none",
    });

    expect(svg).not.toBeNull();
    expect(svg).toContain("<svg");
    expect(svg).toContain('id="icon-export-existing-download"');
    expect(svg).toContain('style="width: 16px; height: 16px; display: none"');
    expect(svg).toContain("lucide-download");
  });

  test("renderiza los iconos interactivos del modal (arrow-right, x, copy, zap)", () => {
    expect(renderLucideIcon("arrow-right")).toContain("lucide-arrow-right");
    expect(renderLucideIcon("x")).toContain("lucide-x");
    expect(renderLucideIcon("copy")).toContain("lucide-copy");
    expect(renderLucideIcon("zap")).toContain("lucide-zap");
  });

  test("devuelve null para nombres de iconos no registrados", () => {
    expect(renderLucideIcon("non-existent-icon-12345")).toBeNull();
  });
});
