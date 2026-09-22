import { existsSync, readFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { Severity, type Issue, type Rule, type RuleContext } from "../../context.ts";

function isTransactionalTemplate(filePath: string, projectRoot: string): boolean {
  const templateName = basename(filePath).replace(/\.html$/i, "");
  const sourceTemplatePath = resolve(
    projectRoot,
    "src",
    "emails",
    "templates",
    templateName,
    "index.html",
  );
  if (!existsSync(sourceTemplatePath)) return false;
  const frontmatterMatch = readFileSync(sourceTemplatePath, "utf-8").match(/^---\n([\s\S]*?)\n---/);
  return Boolean(
    frontmatterMatch && /\bemailType\s*:\s*["']?transactional["']?/i.test(frontmatterMatch[1]),
  );
}

const unsubscribeLink: Rule = {
  id: "unsubscribe-link",
  severity: Severity.WARNING,
  description: "El email debe contener un link de cancelar suscripción",
  check(html: string, context: RuleContext): Issue[] {
    if (isTransactionalTemplate(context.filePath, context.projectRoot)) return [];
    const lowerHtml = html.toLowerCase();
    if (
      [
        "unsubscribe",
        "cancelar suscripción",
        "cancelar suscripcion",
        "darse de baja",
        "unsub",
      ].some((text) => lowerHtml.includes(text))
    ) {
      return [];
    }
    return [
      {
        ruleId: "unsubscribe-link",
        severity: Severity.WARNING,
        message: "No se encontró link de cancelar suscripción → requerido por CAN-SPAM y GDPR",
        hint: 'Agregar un link de unsubscribe en el footer (ej: <a href="{{ unsubscribe_url }}">Cancelar suscripción</a>)',
      },
    ];
  },
};

export default unsubscribeLink;
