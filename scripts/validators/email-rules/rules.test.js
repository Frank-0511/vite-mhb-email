// @ts-check
/**
 * @fileoverview Comprobaciones del registro de reglas.
 *
 * Aquí vive solo lo que es propiedad de la colección: el par positivo/negativo
 * exigido a toda regla registrada, la unicidad de su metadata y el aislamiento
 * de fallos de `runRules`. Los casos borde de cada regla están en su test
 * hermano, `rules/<regla>.test.js`.
 */

import { afterEach, describe, expect, test } from "bun:test";
import { Severity } from "./context.js";
import { rules, runRules } from "./rules/index.js";
import { cleanHtml, cleanupContexts, createContext } from "./test-fixtures.js";

afterEach(cleanupContexts);

/**
 * Reglas cuyo par positivo/negativo necesita un proyecto en disco y por eso se
 * comprueba en su test hermano en lugar de en la tabla de abajo.
 * @type {Set<string>}
 */
const RULES_CHECKED_IN_SIBLING_TEST = new Set(["esp-variables"]);

const cases = [
  ["img-dimensions", cleanHtml, '<img src="x" alt="x">'],
  ["img-alt", cleanHtml, '<img src="x" width="1" height="1">'],
  ["css-unsupported-props", cleanHtml, "<style>.x { display: flex; }</style>"],
  ["doctype-present", cleanHtml, "<html></html>"],
  ["meta-charset", cleanHtml, "<!doctype html><html></html>"],
  ["link-targets", cleanHtml, '<a href="#">Broken</a>'],
  ["max-width-check", cleanHtml, "<style>.max-w-email{ max-width: 800px; }</style>"],
  ["color-scheme-meta", cleanHtml, "<style>@media (prefers-color-scheme: dark) {}</style>"],
  [
    "unsubscribe-link",
    cleanHtml,
    '<!doctype html><html><head><meta charset="utf-8"></head></html>',
  ],
  ["no-js-in-email", cleanHtml, "<script>alert(1)</script>"],
  [
    "nested-tables-depth",
    cleanHtml,
    "<table><table><table><table><table></table></table></table></table></table>",
  ],
  ["css-class-vs-inline", cleanHtml, "<style>.one { color: red; }</style>"],
];

describe("registro de reglas de compatibilidad", () => {
  test.each(cases)(
    "%s conserva el caso positivo y reporta el negativo",
    (ruleId, positive, negative) => {
      const rule = rules.find((candidate) => candidate.id === ruleId);
      expect(rule).toBeDefined();
      const context = createContext();
      expect(rule.check(positive, context)).toEqual([]);
      const issues = rule.check(negative, context);
      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0].ruleId).toBe(ruleId);
      expect(issues[0].severity).toBe(rule.severity);
    },
  );

  test("toda regla registrada tiene su par positivo/negativo en algún lado", () => {
    const covered = new Set([...cases.map(([ruleId]) => ruleId), ...RULES_CHECKED_IN_SIBLING_TEST]);
    const uncovered = rules.map((rule) => rule.id).filter((ruleId) => !covered.has(ruleId));

    expect(uncovered).toEqual([]);
  });

  test("un fallo de regla se informa y no impide las restantes", () => {
    const context = createContext();
    const reported = [];
    const issues = runRules(
      cleanHtml,
      context,
      [
        {
          id: "fails",
          severity: Severity.ERROR,
          description: "fails",
          check: () => {
            throw new Error("boom");
          },
        },
        {
          id: "continues",
          severity: Severity.INFO,
          description: "continues",
          check: () => [{ ruleId: "continues", severity: Severity.INFO, message: "still runs" }],
        },
      ],
      (rule, error) => reported.push([rule.id, error.message]),
    );

    expect(reported).toEqual([["fails", "boom"]]);
    expect(issues).toHaveLength(1);
    expect(issues[0].ruleId).toBe("continues");
  });
});
