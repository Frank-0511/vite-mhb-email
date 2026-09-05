// @ts-check
import fs from "fs-extra";
import { basename, resolve } from "node:path";
import { Severity } from "../context.js";

/** @param {string} filePath @param {string} projectRoot */
function isTransactionalTemplate(filePath, projectRoot) {
  const templateName = basename(filePath).replace(/\.html$/i, "");
  const sourceTemplatePath = resolve(
    projectRoot,
    "src",
    "emails",
    "templates",
    templateName,
    "index.html",
  );
  if (!fs.existsSync(sourceTemplatePath)) return false;
  const frontmatterMatch = fs
    .readFileSync(sourceTemplatePath, "utf-8")
    .match(/^---\n([\s\S]*?)\n---/);
  return Boolean(
    frontmatterMatch && /\bemailType\s*:\s*["']?transactional["']?/i.test(frontmatterMatch[1]),
  );
}

export default {
  id: "unsubscribe-link",
  severity: Severity.WARNING,
  description: "El email debe contener un link de cancelar suscripción",
  check(html, context) {
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
    )
      return [];
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
