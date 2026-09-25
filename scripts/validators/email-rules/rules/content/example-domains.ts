import { getContext, getLineNumber, Severity, type Issue, type Rule } from "../../context.ts";

const ATTR_REGEX = /\b(?:href|src)\s*=\s*["']([^"']+)["']/gi;
const EXAMPLE_DOMAIN_REGEX = /(?:^|\.)example\.(?:com|org|net)$|\.(?:example|invalid|test)$/i;

/**
 * Enlaces o imágenes hacia dominios de ejemplo (RFC 2606) llegan tal cual a
 * producción si no se reemplazan. `href="#"` ya lo reporta `link-targets`.
 */
const exampleDomains: Rule = {
  id: "example-domains",
  severity: Severity.WARNING,
  description: "Detecta href/src hacia dominios de ejemplo",
  check(html: string): Issue[] {
    const issues: Issue[] = [];
    let match: RegExpExecArray | null;
    while ((match = ATTR_REGEX.exec(html)) !== null) {
      const value = match[1];
      let hostname: string | null;
      try {
        hostname = new URL(value).hostname;
      } catch {
        const mailMatch = value.match(/^mailto:[^@]+@([^?]+)/i);
        hostname = mailMatch?.[1] ?? null;
      }
      if (hostname && EXAMPLE_DOMAIN_REGEX.test(hostname)) {
        issues.push({
          ruleId: "example-domains",
          severity: Severity.WARNING,
          message: `"${value}" apunta a un dominio de ejemplo (RFC 2606)`,
          context: getContext(html, match.index),
          hint: "Reemplazar por la URL real o una variable ESP",
          line: getLineNumber(html, match.index),
        });
      }
    }
    return issues;
  },
};

export default exampleDomains;
