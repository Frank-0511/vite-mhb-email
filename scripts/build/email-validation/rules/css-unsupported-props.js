// @ts-check
import { extractStyleContent, Severity } from "../context.js";

export default {
  id: "css-unsupported-props",
  severity: Severity.ERROR,
  description: "Detecta propiedades CSS no soportadas en clientes de email",
  check(html) {
    const styleContent = extractStyleContent(html);
    if (!styleContent) return [];
    const unsupportedProps = [
      { prop: "display:\\s*flex", name: "display: flex", clients: "Outlook (todas las versiones)" },
      { prop: "display:\\s*grid", name: "display: grid", clients: "Outlook, Gmail (parcial)" },
      {
        prop: "(?<!\\-)position\\s*:\\s*(?:absolute|fixed|sticky)",
        name: "position: absolute/fixed/sticky",
        clients: "Outlook, Gmail",
      },
      { prop: "(?<!\\-)float\\s*:", name: "float", clients: "Outlook (Word rendering engine)" },
      {
        prop: "(?:^|[{;\\s])gap\\s*:",
        name: "gap",
        clients: "Outlook, Gmail, Yahoo (sin soporte flex/grid)",
      },
      {
        prop: "(?<!\\-)opacity\\s*:",
        name: "opacity",
        clients: "Outlook (versiones de escritorio)",
      },
      {
        prop: "(?<!\\-)transform\\s*:",
        name: "transform",
        clients: "Outlook (todas las versiones)",
      },
      {
        prop: "(?<!\\-)animation\\s*:",
        name: "animation",
        clients: "Outlook, Gmail (eliminan animaciones)",
      },
      { prop: "(?<!\\-)transition\\s*:", name: "transition", clients: "Outlook, Gmail" },
    ];
    const unsupportedFunctions = [
      { func: "calc\\s*\\(", name: "calc()", clients: "Outlook" },
      { func: "var\\s*\\(", name: "var() (CSS custom properties)", clients: "Outlook, Gmail" },
      { func: "clamp\\s*\\(", name: "clamp()", clients: "Outlook, Gmail, Yahoo" },
    ];
    const issues = [];
    for (const { prop, name, clients } of unsupportedProps) {
      if (new RegExp(prop, "gi").test(styleContent))
        issues.push({
          ruleId: "css-unsupported-props",
          severity: Severity.ERROR,
          message: `Propiedad CSS "${name}" no soportada en: ${clients}`,
          hint: "Reemplazar con alternativa compatible (ej: flex → table layout)",
        });
    }
    for (const { func, name, clients } of unsupportedFunctions) {
      if (new RegExp(func, "gi").test(styleContent))
        issues.push({
          ruleId: "css-unsupported-props",
          severity: Severity.ERROR,
          message: `Función CSS "${name}" no soportada en: ${clients}`,
          hint: "Usar valores estáticos en lugar de funciones CSS dinámicas",
        });
    }
    return issues;
  },
};
