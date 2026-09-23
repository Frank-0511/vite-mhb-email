import { colorSchemeMeta, doctypePresent, metaCharset, noJsInEmail } from "./structure/document.ts";
import cssClassVsInline from "./structure/css-class-vs-inline.ts";
import cssUnsupportedProps from "./structure/css-unsupported-props.ts";
import maxWidthCheck from "./structure/max-width.ts";
import nestedTablesDepth from "./structure/nested-tables-depth.ts";
import imgAlt from "./accessibility/img-alt.ts";
import imgDimensions from "./accessibility/img-dimensions.ts";
import linkTargets from "./accessibility/link-targets.ts";
import espVariables from "./content/esp-variables.ts";
import unsubscribeLink from "./content/unsubscribe-link.ts";
import type { Issue, Rule, RuleContext } from "../context.ts";

export const rules: Rule[] = [
  imgDimensions,
  imgAlt,
  cssUnsupportedProps,
  doctypePresent,
  metaCharset,
  linkTargets,
  maxWidthCheck,
  colorSchemeMeta,
  unsubscribeLink,
  noJsInEmail,
  nestedTablesDepth,
  cssClassVsInline,
  espVariables,
];

/**
 * Ejecuta reglas independientemente, conservando los resultados de las reglas
 * sanas cuando una de ellas falla.
 */
export function runRules(
  html: string,
  context: RuleContext,
  activeRules: Rule[] = rules,
  onError: (rule: Rule, error: Error) => void = () => {},
): Issue[] {
  const issues: Issue[] = [];
  for (const rule of activeRules) {
    try {
      issues.push(...rule.check(html, context));
    } catch (error: unknown) {
      onError(rule, error instanceof Error ? error : new Error(String(error)));
    }
  }
  return issues;
}
