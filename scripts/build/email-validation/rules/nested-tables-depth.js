// @ts-check
import { Severity } from "../context.js";

export default {
  id: "nested-tables-depth",
  severity: Severity.INFO,
  description: "Advertir si hay tablas anidadas a más de 4 niveles",
  check(html) {
    const events = [
      ...[...html.matchAll(/<table[\s>]/gi)].map((match) => ({ pos: match.index, type: "open" })),
      ...[...html.matchAll(/<\/table>/gi)].map((match) => ({ pos: match.index, type: "close" })),
    ].sort((first, second) => first.pos - second.pos);
    let currentDepth = 0;
    let maxDepth = 0;
    for (const event of events) {
      if (event.type === "open") maxDepth = Math.max(maxDepth, ++currentDepth);
      else currentDepth--;
    }
    return maxDepth > 4
      ? [
          {
            ruleId: "nested-tables-depth",
            severity: Severity.INFO,
            message: `Tablas anidadas a ${maxDepth} niveles → Outlook puede corromper layouts con nesting excesivo`,
            hint: "Intentar reducir la profundidad de anidamiento a 4 niveles o menos",
          },
        ]
      : [];
  },
};
