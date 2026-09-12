// @ts-check
import { getContext, getLineNumber, Severity } from "../context.js";

export default {
  id: "img-dimensions",
  severity: Severity.ERROR,
  description: "Toda <img> debe tener width y height como atributos HTML",
  check(html) {
    const issues = [];
    const imgRegex = /<img\s[^>]*?>/gi;
    let match;
    while ((match = imgRegex.exec(html)) !== null) {
      const tag = match[0];
      const hasWidth = /\bwidth\s*=\s*["']/i.test(tag);
      const hasHeight = /\bheight\s*=\s*["']/i.test(tag);
      if (!hasWidth || !hasHeight) {
        const missing = [];
        if (!hasWidth) missing.push("width");
        if (!hasHeight) missing.push("height");
        issues.push({
          ruleId: "img-dimensions",
          severity: Severity.ERROR,
          message: `<img> sin atributo ${missing.join(" ni ")} → Outlook puede distorsionar`,
          context: getContext(html, match.index),
          hint: `Agregar ${missing.join(" y ")} como atributos HTML`,
          line: getLineNumber(html, match.index),
        });
      }
    }
    return issues;
  },
};
