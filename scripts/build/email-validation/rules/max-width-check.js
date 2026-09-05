// @ts-check
import { extractStyleContent, Severity } from "../context.js";

export default {
  id: "max-width-check",
  severity: Severity.WARNING,
  description: "La tabla principal debería tener max-width ≤ 700px",
  check(html) {
    const maxWidthMatch = extractStyleContent(html).match(
      /\.max-w-[^\s{]*\{[^}]*max-width\s*:\s*([^;}]+)/i,
    );
    if (!maxWidthMatch) return [];
    const value = maxWidthMatch[1].trim();
    const remMatch = value.match(/([\d.]+)\s*rem/);
    if (remMatch && parseFloat(remMatch[1]) * 16 > 700)
      return [
        {
          ruleId: "max-width-check",
          severity: Severity.WARNING,
          message: `max-width del email es ${parseFloat(remMatch[1]) * 16}px (${value}) → mayor a 700px puede cortarse en mobile`,
          hint: "Considerar reducir el ancho máximo a 600-700px",
        },
      ];
    const pxMatch = value.match(/([\d.]+)\s*px/);
    if (pxMatch && parseFloat(pxMatch[1]) > 700)
      return [
        {
          ruleId: "max-width-check",
          severity: Severity.WARNING,
          message: `max-width del email es ${value} → mayor a 700px puede cortarse en mobile`,
          hint: "Considerar reducir el ancho máximo a 600-700px",
        },
      ];
    return [];
  },
};
