/**
 * @fileoverview Comprobaciones del registro de reglas.
 */

import { afterEach, describe, expect, test } from "bun:test";
import { Severity } from "./context.ts";
import { rules, runRules } from "./rules/index.ts";
import { cleanHtml, cleanupContexts, createContext } from "./test-fixtures.ts";

afterEach(cleanupContexts);

const RULES_CHECKED_IN_SIBLING_TEST = new Set(["esp-variables"]);

interface TestCase {
  ruleId: string;
  positive: string;
  negative: string;
}

const cases: TestCase[] = [
  { ruleId: "img-dimensions", positive: cleanHtml, negative: '<img src="x" alt="x">' },
  { ruleId: "img-alt", positive: cleanHtml, negative: '<img src="x" width="1" height="1">' },
  {
    ruleId: "css-unsupported-props",
    positive: cleanHtml,
    negative: "<style>.x { display: flex; }</style>",
  },
  { ruleId: "doctype-present", positive: cleanHtml, negative: "<html></html>" },
  { ruleId: "meta-charset", positive: cleanHtml, negative: "<!doctype html><html></html>" },
  { ruleId: "link-targets", positive: cleanHtml, negative: '<a href="#">Broken</a>' },
  {
    ruleId: "max-width-check",
    positive: cleanHtml,
    negative: "<style>.max-w-email{ max-width: 800px; }</style>",
  },
  {
    ruleId: "color-scheme-meta",
    positive: cleanHtml,
    negative: "<style>@media (prefers-color-scheme: dark) {}</style>",
  },
  {
    ruleId: "unsubscribe-link",
    positive: cleanHtml,
    negative: '<!doctype html><html><head><meta charset="utf-8"></head></html>',
  },
  { ruleId: "no-js-in-email", positive: cleanHtml, negative: "<script>alert(1)</script>" },
  {
    ruleId: "nested-tables-depth",
    positive: cleanHtml,
    negative: "<table><table><table><table><table></table></table></table></table></table>",
  },
  {
    ruleId: "css-class-vs-inline",
    positive: cleanHtml,
    negative: "<style>.one { color: red; }</style>",
  },
];

describe("registro de reglas de compatibilidad", () => {
  test.each(cases)(
    "$ruleId conserva el caso positivo y reporta el negativo",
    ({ ruleId, positive, negative }) => {
      const rule = rules.find((candidate) => candidate.id === ruleId);
      expect(rule).toBeDefined();
      const context = createContext();
      expect(rule!.check(positive, context)).toEqual([]);
      const issues = rule!.check(negative, context);
      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0].ruleId).toBe(ruleId);
      expect(issues[0].severity).toBe(rule!.severity);
    },
  );

  test("toda regla registrada tiene su par positivo/negativo en algún lado", () => {
    const covered = new Set([...cases.map((c) => c.ruleId), ...RULES_CHECKED_IN_SIBLING_TEST]);
    const uncovered = rules.map((rule) => rule.id).filter((ruleId) => !covered.has(ruleId));

    expect(uncovered).toEqual([]);
  });

  test("un fallo de regla se informa y no impide las restantes", () => {
    const context = createContext();
    const reported: [string, string][] = [];
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
