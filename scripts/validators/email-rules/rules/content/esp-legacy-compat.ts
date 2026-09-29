import { analyzeLegacyCompat } from "../../../../esp/syntax/legacy-compat.ts";
import { getContext, getLineNumber, Severity, type Issue, type Rule } from "../../context.ts";

const espLegacyCompat: Rule = {
  id: "esp-legacy-compat",
  severity: Severity.WARNING,
  description:
    "Avisa si el template no es convertible a etiquetas -variable- de SendGrid Legacy o si colisiona con texto literal",
  check(html: string): Issue[] {
    const { violations, collisions } = analyzeLegacyCompat(html);
    const issues: Issue[] = [];

    for (const v of violations) {
      issues.push({
        ruleId: "esp-legacy-compat",
        severity: Severity.WARNING,
        message: `${v.token} — ${v.reason}`,
        context: getContext(html, v.index),
        line: getLineNumber(html, v.index),
        hint: "Este template no es convertible a etiquetas -variable- de SendGrid Legacy; usa variables simples o migra a Dynamic Templates",
      });
    }

    for (const collision of collisions) {
      const varName = collision.replace(/^-|-$/g, "");
      const index = html.indexOf(collision);
      issues.push({
        ruleId: "esp-legacy-compat",
        severity: Severity.WARNING,
        message: `el texto "${collision}" colisiona con la etiqueta legacy de la variable ${varName}`,
        context: index !== -1 ? getContext(html, index) : "",
        line: index !== -1 ? getLineNumber(html, index) : 1,
        hint: "Reescribir el texto o renombrar la variable",
      });
    }

    return issues;
  },
};

export default espLegacyCompat;
