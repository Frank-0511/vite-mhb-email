import {
  extractInlineStyleContent,
  extractStyleContent,
  getContext,
  Severity,
  type Issue,
  type Rule,
} from "../../context.ts";

const RELATIVE_UNIT_REGEX = /(?<![\w.-])-?(?:\d+\.?\d*|\.\d+)(?:rem|em)\b/gi;

/**
 * Detecta `rem`/`em` en CSS (estilos inline y <style>): varios clientes de
 * email no los resuelven de forma fiable. Nunca se aplica al texto visible
 * del cuerpo, solo al contenido CSS extraído.
 */
const cssRelativeUnits: Rule = {
  id: "css-relative-units",
  severity: Severity.ERROR,
  description: "Detecta unidades relativas (rem/em) en CSS de email",
  check(html: string): Issue[] {
    const cssContent = `${extractStyleContent(html)}\n${extractInlineStyleContent(html)}`;
    const matches = [...cssContent.matchAll(RELATIVE_UNIT_REGEX)];
    if (matches.length === 0) return [];

    return [
      {
        ruleId: "css-relative-units",
        severity: Severity.ERROR,
        message: `${matches.length} valor(es) con unidad relativa (rem/em) en CSS: "${matches[0][0]}"`,
        context: getContext(cssContent, matches[0].index ?? 0),
        hint: "Convertir a píxeles fijos (1rem = 16px salvo que la config Tailwind diga otra base)",
      },
    ];
  },
};

export default cssRelativeUnits;
