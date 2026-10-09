import { afterEach, describe, expect, test } from "vitest";
import { cleanupContexts, createContext, ruleById } from "../../rules.fixtures.ts";

afterEach(cleanupContexts);

describe("style-block-size", () => {
  test("detecta un bloque <style> que supera 8192 bytes", () => {
    const oversized = `<style>${"a{color:#fff}".repeat(700)}</style>`;
    const issues = ruleById("style-block-size").check(oversized, createContext());
    expect(issues.length).toBe(1);
    expect(issues[0].ruleId).toBe("style-block-size");
  });

  test("permite un bloque <style> por debajo del límite", () => {
    const issues = ruleById("style-block-size").check(
      "<style>.a { color: #fff; }</style>",
      createContext(),
    );
    expect(issues).toEqual([]);
  });

  test("evalúa cada bloque <style> por separado, no la suma", () => {
    const html = `<style>${"a{color:#fff}".repeat(300)}</style><style>${"b{color:#000}".repeat(300)}</style>`;
    const issues = ruleById("style-block-size").check(html, createContext());
    expect(issues).toEqual([]);
  });
});
