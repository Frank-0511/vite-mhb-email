import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "bun:test";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const workflow = readFileSync(path.join(repositoryRoot, ".github/workflows/ci.yml"), "utf8");

describe("CI route matrix", () => {
  test("defines outputs for every selective gate", () => {
    for (const output of ["md", "html", "js", "json", "css", "quality", "format"]) {
      expect(workflow).toContain(`${output}: $` + "{{ steps.filter.outputs." + output + " }}");
    }
  });

  test("routes product and configuration paths to quality verification", () => {
    for (const pattern of [
      ".github/workflows/**",
      "src/emails/layouts/**/*.html",
      "src/emails/partials/**/*.html",
      "src/web/**/*.html",
      "scripts/**/*.mjs",
      "bunfig.toml",
      "eslint.config.js",
    ]) {
      expect(workflow).toContain(`- "${pattern}"`);
    }
  });

  test("routes supported source formats to the format gate", () => {
    expect(workflow).toContain("format: ${{ steps.filter.outputs.format }}");
    expect(workflow).toContain('- "**/*.md"');
    expect(workflow).toContain('- "**/*.html"');
    expect(workflow).toContain('- "**/*.{js,mjs,json,css,yml,yaml}"');
    expect(workflow).toContain("bun run format:check");
  });

  test("verify runs the declared quality sequence", () => {
    expect(workflow).toContain("if: needs.changes.outputs.quality == 'true'");
    expect(workflow).toContain("bun run typecheck");
    expect(workflow).toContain("bun run test");
    expect(workflow).toContain("bun run build");
  });
});
