// @ts-check
import { afterEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Severity } from "./context.js";
import { rules, runRules } from "./rules/index.js";

const temporaryDirectories = [];

/** @returns {{ projectRoot: string, filePath: string }} */
function createContext() {
  const projectRoot = mkdtempSync(join(tmpdir(), "email-validation-"));
  temporaryDirectories.push(projectRoot);
  return { projectRoot, filePath: join(projectRoot, "dist", "example.html") };
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

const cleanHtml =
  '<!doctype html><html><head><meta charset="utf-8"></head><body><a href="https://example.com/unsubscribe">Unsubscribe</a><img src="x" width="1" height="1" alt="x"></body></html>';

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

describe("reglas de compatibilidad", () => {
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

  test("esp-variables conserva faltantes como WARNING y sobrantes como INFO", () => {
    const context = createContext();
    const templateRoot = join(context.projectRoot, "src", "emails", "templates", "example");
    mkdirSync(templateRoot, { recursive: true });
    writeFileSync(join(templateRoot, "index.html"), "{{ missing }}", "utf8");
    writeFileSync(join(templateRoot, "data.json"), JSON.stringify({ unused: "value" }), "utf8");
    context.filePath = join(context.projectRoot, "dist", "example.html");

    const rule = rules.find((candidate) => candidate.id === "esp-variables");
    const issues = rule.check(cleanHtml, context);
    expect(issues.map((issue) => issue.severity)).toEqual([Severity.WARNING, Severity.INFO]);
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
