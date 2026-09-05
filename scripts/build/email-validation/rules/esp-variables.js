// @ts-check
import fs from "fs-extra";
import { basename, resolve } from "node:path";
import { validateEspVariables } from "../../../email/esp-variables.js";
import { collectTemplateSource } from "../../../email/esp-sources.js";
import { Severity } from "../context.js";

export default {
  id: "esp-variables",
  severity: Severity.WARNING,
  description:
    "Variables ESP {{ }} referenciadas en el template fuente deben existir en data.json; las claves no usadas se reportan como INFO",
  check(_html, context) {
    const templateName = basename(context.filePath).replace(/\.html$/i, "");
    const sourcePath = resolve(
      context.projectRoot,
      "src",
      "emails",
      "templates",
      templateName,
      "index.html",
    );
    if (!fs.existsSync(sourcePath)) return [];
    const dataPath = resolve(
      context.projectRoot,
      "src",
      "emails",
      "templates",
      templateName,
      "data.json",
    );
    let source;
    try {
      source = collectTemplateSource(context.projectRoot, templateName);
    } catch {
      return [];
    }
    let data = {};
    if (fs.existsSync(dataPath)) {
      try {
        data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
      } catch {
        data = {};
      }
    }
    const { missing, unused } = validateEspVariables({ source, data });
    return [
      ...missing.map((name) => ({
        ruleId: "esp-variables",
        severity: Severity.WARNING,
        message: `Variable ESP {{ ${name} }} referenciada en el template sin clave correspondiente en data.json`,
        hint: `Agregar "${name}" a src/emails/templates/${templateName}/data.json o declararla en frontmatter bajo espVariables si la completa el ESP`,
      })),
      ...unused.map((name) => ({
        ruleId: "esp-variables",
        severity: Severity.INFO,
        message: `Clave "${name}" en data.json no se usa en el template`,
        hint: `Eliminar la clave de src/emails/templates/${templateName}/data.json o referenciarla en el template`,
      })),
    ];
  },
};
