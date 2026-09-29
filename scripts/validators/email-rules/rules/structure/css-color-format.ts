import {
  extractInlineStyleContent,
  extractStyleContent,
  Severity,
  type Issue,
  type Rule,
} from "../../context.ts";

const MODERN_COLOR_FUNCTION_REGEX = /\b(hsla?|hwb|lab|lch|oklab|oklch|color|color-mix)\(/gi;
const RGB_FUNCTION_REGEX = /rgba?\(([^)]*)\)/gi;
const INLINE_VAR_REGEX = /var\(/gi;

/**
 * Detecta colores CSS que Gmail/Outlook no soportan: sintaxis CSS Color 4
 * (`rgb(r g b / a)`, `hsl()`, `oklch()`, `color-mix()`, etc.) y `var()` en
 * estilos inline. Solo HEX, `rgb(r, g, b)`, `rgba(r, g, b, a)` y nombres de
 * color pasan.
 */
const cssColorFormat: Rule = {
  id: "css-color-format",
  severity: Severity.ERROR,
  description: "Detecta colores CSS no soportados (sintaxis Color 4, var() inline)",
  check(html: string): Issue[] {
    const issues: Issue[] = [];
    const styleContent = extractStyleContent(html);
    const inlineContent = extractInlineStyleContent(html);
    const cssContent = `${styleContent}\n${inlineContent}`;

    if (MODERN_COLOR_FUNCTION_REGEX.test(cssContent)) {
      issues.push({
        ruleId: "css-color-format",
        severity: Severity.ERROR,
        message:
          "Color con función CSS moderna (hsl/hwb/lab/lch/oklab/oklch/color/color-mix) no soportada en Outlook ni clientes basados en Word",
        hint: "Convertir el color a HEX o rgb(r, g, b)",
      });
    }
    MODERN_COLOR_FUNCTION_REGEX.lastIndex = 0;

    for (const match of cssContent.matchAll(RGB_FUNCTION_REGEX)) {
      const args = match[1];
      if (args.includes("/") || !args.includes(",")) {
        issues.push({
          ruleId: "css-color-format",
          severity: Severity.ERROR,
          message: `Color "${match[0]}" usa sintaxis CSS Color 4 (separada por espacios o con alfa "/"), no soportada en Outlook de escritorio`,
          hint: "Usar rgb(r, g, b) o rgba(r, g, b, a) con comas, o convertir a HEX",
        });
        break;
      }
    }

    if (INLINE_VAR_REGEX.test(inlineContent)) {
      issues.push({
        ruleId: "css-color-format",
        severity: Severity.ERROR,
        message: "var() en un estilo inline no se resuelve en Outlook ni Gmail",
        hint: "Reemplazar la variable CSS por su valor final (HEX o rgb(r, g, b))",
      });
    }
    INLINE_VAR_REGEX.lastIndex = 0;

    return issues;
  },
};

export default cssColorFormat;
