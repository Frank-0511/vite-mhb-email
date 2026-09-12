// @ts-check
import { colorSchemeMeta, doctypePresent, metaCharset, noJsInEmail } from "./document.js";
import cssClassVsInline from "./css-class-vs-inline.js";
import cssUnsupportedProps from "./css-unsupported-props.js";
import espVariables from "./esp-variables.js";
import imgAlt from "./img-alt.js";
import imgDimensions from "./img-dimensions.js";
import linkTargets from "./link-targets.js";
import maxWidthCheck from "./max-width-check.js";
import nestedTablesDepth from "./nested-tables-depth.js";
import unsubscribeLink from "./unsubscribe-link.js";

/** @type {import("../context.js").Rule[]} */
export const rules = [
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
 * @param {string} html
 * @param {import("../context.js").RuleContext} context
 * @param {import("../context.js").Rule[]} [activeRules]
 * @param {(rule: import("../context.js").Rule, error: Error) => void} [onError]
 * @returns {import("../context.js").Issue[]}
 */
export function runRules(html, context, activeRules = rules, onError = () => {}) {
  const issues = [];
  for (const rule of activeRules) {
    try {
      issues.push(...rule.check(html, context));
    } catch (error) {
      onError(rule, error instanceof Error ? error : new Error(String(error)));
    }
  }
  return issues;
}
