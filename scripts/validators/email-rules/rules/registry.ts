/**
 * @fileoverview Registro y ejecutor de reglas de validación de emails.
 */

import { colorSchemeMeta, doctypePresent, metaCharset, noJsInEmail } from "./structure/document.ts";
import cssClassVsInline from "./structure/css-class-vs-inline.ts";
import cssColorFormat from "./structure/css-color-format.ts";
import cssRelativeUnits from "./structure/css-relative-units.ts";
import cssUnsupportedProps from "./structure/css-unsupported-props.ts";
import maxWidthCheck from "./structure/max-width.ts";
import nestedTablesDepth from "./structure/nested-tables-depth.ts";
import styleBlockSize from "./structure/style-block-size.ts";
import imgAlt from "./accessibility/img-alt.ts";
import imgDimensions from "./accessibility/img-dimensions.ts";
import linkTargets from "./accessibility/link-targets.ts";
import espLegacyCompat from "./content/esp-legacy-compat.ts";
import espSyntaxProfile from "./content/esp-syntax-profile.ts";
import espVariables from "./content/esp-variables.ts";
import exampleDomains from "./content/example-domains.ts";
import imgHostAllowlist from "./content/img-host-allowlist.ts";
import imgSvgSource from "./content/img-svg-source.ts";
import unsubscribeLink from "./content/unsubscribe-link.ts";
import type { Issue, Rule, RuleContext } from "../context.ts";

export const rules: Rule[] = [
  imgDimensions,
  imgAlt,
  cssUnsupportedProps,
  cssColorFormat,
  cssRelativeUnits,
  styleBlockSize,
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
  imgSvgSource,
  imgHostAllowlist,
  exampleDomains,
  espSyntaxProfile,
  espLegacyCompat,
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
