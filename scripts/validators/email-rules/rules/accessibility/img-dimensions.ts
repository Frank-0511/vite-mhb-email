import { getContext, getLineNumber, Severity, type Issue, type Rule } from "../../context.ts";

const imgDimensions: Rule = {
  id: "img-dimensions",
  severity: Severity.ERROR,
  description: "Toda <img> debe tener width y height como atributos HTML",
  check(html: string): Issue[] {
    const issues: Issue[] = [];
    const imgRegex = /<img\s[^>]*?>/gi;
    let match: RegExpExecArray | null;
    while ((match = imgRegex.exec(html)) !== null) {
      const tag = match[0];
      const hasWidth = /\bwidth\s*=\s*["']/i.test(tag);
      const hasHeight = /\bheight\s*=\s*["']/i.test(tag);
      if (!hasWidth || !hasHeight) {
        const missing: string[] = [];
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

export default imgDimensions;
