// @ts-check
import { getContext, getLineNumber, Severity } from "../context.js";

export default {
  id: "img-alt",
  severity: Severity.WARNING,
  description: "Toda <img> debe tener alt no vacío",
  check(html) {
    const issues = [];
    const imgRegex = /<img\s[^>]*?>/gi;
    let match;
    while ((match = imgRegex.exec(html)) !== null) {
      const tag = match[0];
      const altMatch = tag.match(/\balt\s*=\s*["']([^"']*)["']/i);
      if (!altMatch || altMatch[1].trim() === "") {
        issues.push({
          ruleId: "img-alt",
          severity: Severity.WARNING,
          message: altMatch
            ? '<img> con alt vacío (alt="")'
            : "<img> sin atributo alt → usuarios con imágenes bloqueadas no verán contexto",
          context: getContext(html, match.index),
          hint: altMatch
            ? "Agregar un texto descriptivo al atributo alt"
            : 'Agregar alt="descripción de la imagen"',
          line: getLineNumber(html, match.index),
        });
      }
    }
    return issues;
  },
};
