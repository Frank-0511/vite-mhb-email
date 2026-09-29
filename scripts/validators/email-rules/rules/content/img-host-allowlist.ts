import { EMAIL_IMAGE_HOST_ALLOWLIST } from "../../../../shared/contracts/constants/email-assets.ts";
import { getContext, getLineNumber, Severity, type Issue, type Rule } from "../../context.ts";

const IMG_TAG_REGEX = /<img\s[^>]*?>/gi;
const ESP_PLACEHOLDER_REGEX = /\{\{|\*\|/;

/**
 * Un <img src> relativo o servido por un host fuera de la allowlist no
 * resuelve en el cliente de email (Gmail/Outlook cargan el HTML aislado del
 * dominio de origen). Omite los `src` que son variables ESP sin resolver.
 */
const imgHostAllowlist: Rule = {
  id: "img-host-allowlist",
  severity: Severity.ERROR,
  description: "Detecta <img src> fuera de la allowlist de hosts de imagen",
  check(html: string): Issue[] {
    const issues: Issue[] = [];
    let match: RegExpExecArray | null;
    while ((match = IMG_TAG_REGEX.exec(html)) !== null) {
      const tag = match[0];
      const srcMatch = tag.match(/\bsrc\s*=\s*["']([^"']*)["']/i);
      const src = srcMatch?.[1]?.trim() ?? "";
      if (!src || ESP_PLACEHOLDER_REGEX.test(src)) continue;

      let url: URL | null;
      try {
        url = new URL(src);
      } catch {
        url = null;
      }

      if (!url || url.protocol !== "https:") {
        issues.push({
          ruleId: "img-host-allowlist",
          severity: Severity.ERROR,
          message: `<img src="${src}"> no es una URL https absoluta`,
          context: getContext(html, match.index),
          hint: "Usar una URL https:// completa servida por un host de la allowlist",
          line: getLineNumber(html, match.index),
        });
        continue;
      }

      if (
        !EMAIL_IMAGE_HOST_ALLOWLIST.includes(
          url.hostname as (typeof EMAIL_IMAGE_HOST_ALLOWLIST)[number],
        )
      ) {
        issues.push({
          ruleId: "img-host-allowlist",
          severity: Severity.ERROR,
          message: `<img src="${src}"> usa un host fuera de la allowlist (${EMAIL_IMAGE_HOST_ALLOWLIST.join(", ")})`,
          context: getContext(html, match.index),
          hint: "Servir la imagen desde un host permitido o sumarlo a EMAIL_IMAGE_HOST_ALLOWLIST",
          line: getLineNumber(html, match.index),
        });
      }
    }
    return issues;
  },
};

export default imgHostAllowlist;
