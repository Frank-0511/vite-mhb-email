// @ts-check
import { getContext, getLineNumber, Severity } from "../context.js";

export default {
  id: "link-targets",
  severity: Severity.WARNING,
  description: "Todo <a href> debe tener un URL válido (no # ni vacío)",
  check(html) {
    const issues = [];
    const linkRegex = /<a\s[^>]*href\s*=\s*["']([^"']*)["'][^>]*>/gi;
    let match;
    while ((match = linkRegex.exec(html)) !== null) {
      const href = match[1].trim();
      if (/\{\{.*\}\}/.test(href) || /\*\|.*\|\*/.test(href) || /^mailto:/i.test(href)) continue;
      if (href === "#" || href === "")
        issues.push({
          ruleId: "link-targets",
          severity: Severity.WARNING,
          message: `<a> con href="${href || "(vacío)"}" → link roto en producción`,
          context: getContext(html, match.index),
          hint: "Reemplazar con la URL real o con un placeholder ESP {{ url }}",
          line: getLineNumber(html, match.index),
        });
    }
    return issues;
  },
};
