import { describe, expect, test } from "bun:test";
import {
  contrastRatio,
  evaluatePairs,
  parseThemeTokens,
  relativeLuminance,
  type ContrastPair,
} from "./contrast-calculator.ts";

const sampleCss = `
:root {
  --ef-canvas: #ffffff;
  --ef-text: #000000;
  --ef-accent-strong: #1a1a1a;
}

.dark {
  --ef-canvas: #000000;
  --ef-text: #ffffff;
}
`;

describe("relativeLuminance", () => {
  test("negro es 0", () => {
    expect(relativeLuminance("#000000")).toBeCloseTo(0, 5);
  });

  test("blanco es 1", () => {
    expect(relativeLuminance("#ffffff")).toBeCloseTo(1, 5);
  });

  test("acepta hex corto de 3 dígitos", () => {
    expect(relativeLuminance("#fff")).toBeCloseTo(relativeLuminance("#ffffff"), 5);
  });
});

describe("contrastRatio", () => {
  test("blanco sobre negro da el máximo (21:1)", () => {
    expect(contrastRatio("#ffffff", "#000000")).toBeCloseTo(21, 1);
  });

  test("un color contra sí mismo da 1:1", () => {
    expect(contrastRatio("#123456", "#123456")).toBeCloseTo(1, 5);
  });

  test("es simétrico en el orden de los argumentos", () => {
    expect(contrastRatio("#f2f7ff", "#07111f")).toBeCloseTo(contrastRatio("#07111f", "#f2f7ff"), 5);
  });
});

describe("parseThemeTokens", () => {
  test("extrae los tokens de :root", () => {
    expect(parseThemeTokens(sampleCss, ":root")).toEqual({
      "ef-canvas": "#ffffff",
      "ef-text": "#000000",
      "ef-accent-strong": "#1a1a1a",
    });
  });

  test("extrae los tokens de .dark", () => {
    expect(parseThemeTokens(sampleCss, ".dark")).toEqual({
      "ef-canvas": "#000000",
      "ef-text": "#ffffff",
    });
  });

  test("devuelve objeto vacío si el selector no existe", () => {
    expect(parseThemeTokens(sampleCss, "[data-theme]")).toEqual({});
  });
});

describe("evaluatePairs", () => {
  const pairs: ContrastPair[] = [
    { name: "text/canvas", fg: "ef-text", bg: "ef-canvas", role: "text" },
    {
      name: "text/accent-strong",
      fg: "ef-text",
      bg: "ef-accent-strong",
      role: "ui",
    },
    {
      name: "falta-token",
      fg: "ef-text",
      bg: "ef-no-existe",
      role: "text",
    },
  ];

  test("clasifica OK cuando el ratio supera el umbral con margen", () => {
    const tokens = parseThemeTokens(sampleCss, ":root");
    const [result] = evaluatePairs(tokens, [pairs[0]]);
    expect(result.status).toBe("OK");
    expect(result.ratio).toBeCloseTo(21, 1);
  });

  test("clasifica ERROR cuando el ratio no llega al umbral de su rol", () => {
    const tokens = parseThemeTokens(sampleCss, ":root");
    const [result] = evaluatePairs(tokens, [pairs[1]]);
    expect(result.status).toBe("ERROR");
  });

  test("clasifica ERROR con mensaje cuando falta un token", () => {
    const tokens = parseThemeTokens(sampleCss, ":root");
    const [result] = evaluatePairs(tokens, [pairs[2]]);
    expect(result.status).toBe("ERROR");
    expect(result.message).toContain("ef-no-existe");
  });
});
