// @ts-check
import { extractStyleContent, Severity } from "../context.js";

export default {
  id: "css-class-vs-inline",
  severity: Severity.INFO,
  description: "Reportar ratio de estilos en clase vs inline",
  check(html) {
    const cssRuleCount = (extractStyleContent(html).match(/\{/g) || []).length;
    const inlineStyleCount = (html.match(/\bstyle\s*=\s*["'][^"']+["']/gi) || []).length;
    if (cssRuleCount > 0 && inlineStyleCount === 0)
      return [
        {
          ruleId: "css-class-vs-inline",
          severity: Severity.INFO,
          message: `${cssRuleCount} reglas CSS en <style>, 0 estilos inline → Gmail elimina <style> del <head>`,
          hint: "Considerar CSS inlining (Maizzle lo hace con css.inline: true en la config)",
        },
      ];
    if (cssRuleCount > 20 && inlineStyleCount < 5)
      return [
        {
          ruleId: "css-class-vs-inline",
          severity: Severity.INFO,
          message: `${cssRuleCount} reglas CSS en <style>, ${inlineStyleCount} estilos inline`,
          hint: "Gmail elimina <style> del <head>. Considerar CSS inlining para mayor compatibilidad",
        },
      ];
    return [];
  },
};
