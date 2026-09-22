#!/usr/bin/env node
/**
 * @fileoverview Build selectivo por template mediante el servicio programático de Maizzle.
 *
 * Uso: bun run build-selective <templateName>
 * Genera `dist/<templateName>.html` sin mutar `maizzle.config.js`.
 */

import { validateEmailHtml } from "../validators/validate-email-html.js";
import { assertValidTemplateName } from "../shared/index.ts";
import { runSelectiveBuild } from "../vite/services/selective-build.js";

const rootDir = process.cwd();
const templateName = process.argv[2];

try {
  assertValidTemplateName(templateName);
} catch {
  console.error("❌ Template name must use only lowercase letters, numbers, and hyphens");
  console.error("Usage: bun run build-selective <templateName>");
  console.error("Example: bun run build-selective welcome");
  process.exit(1);
}

try {
  const result = await runSelectiveBuild(rootDir, templateName);
  if (!result.success) throw new Error(result.error ?? "Selective build failed with no details");

  console.log("\n🔍 Validating email HTML compatibility...\n");
  const { errors, warnings } = validateEmailHtml();
  if (errors > 0) {
    throw new Error(
      `${errors} compatibility error${errors === 1 ? "" : "s"} detected. Correct ERROR issues before continuing.`,
    );
  }
  if (warnings > 0)
    console.warn(`⚠️  ${warnings} compatibility warning${warnings === 1 ? "" : "s"}.`);

  console.log(`✅ Selective build completed for ${templateName}!\n`);
  console.log(`📄 Output: dist/${templateName}.html\n`);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error("\n❌ Selective build failed:", message);
  process.exitCode = 1;
}
