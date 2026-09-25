import { getContext, getLineNumber, Severity, type Issue, type Rule } from "../../context.ts";

const IMG_TAG_REGEX = /<img\s[^>]*?>/gi;
const SVG_SRC_REGEX = /\.svg(?:[?#]|$)/i;
const SVG_DATA_URI_REGEX = /^data:image\/svg\+xml/i;

/**
 * Gmail y Outlook no muestran SVG en <img>: detecta `.svg` (por extensión o
 * data URI) en el atributo src.
 */
const imgSvgSource: Rule = {
  id: "img-svg-source",
  severity: Severity.ERROR,
  description: "Detecta <img> con fuente SVG, no soportada en Gmail/Outlook",
  check(html: string): Issue[] {
    const issues: Issue[] = [];
    let match: RegExpExecArray | null;
    while ((match = IMG_TAG_REGEX.exec(html)) !== null) {
      const tag = match[0];
      const srcMatch = tag.match(/\bsrc\s*=\s*["']([^"']*)["']/i);
      const src = srcMatch?.[1] ?? "";
      if (SVG_SRC_REGEX.test(src) || SVG_DATA_URI_REGEX.test(src)) {
        issues.push({
          ruleId: "img-svg-source",
          severity: Severity.ERROR,
          message: `<img src="${src}"> usa SVG, no soportado en Gmail ni Outlook`,
          context: getContext(html, match.index),
          hint: "Servir un PNG (idealmente @2x) en lugar del SVG",
          line: getLineNumber(html, match.index),
        });
      }
    }
    return issues;
  },
};

export default imgSvgSource;
