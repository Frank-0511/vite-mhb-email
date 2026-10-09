/**
 * @fileoverview Build selectivo por template mediante el servicio programático de Maizzle.
 *
 * Uso: <pm> run build <templateName>
 * Genera `dist/<templateName>.html` sin mutar `maizzle.config.js`.
 */

import { formatRunCommand } from "../shared/env/detect-pm.ts";
import { validateEmailHtml } from "../validators/validate-email-html.ts";
import { assertValidTemplateName } from "../shared/index.ts";
import { runSelectiveBuild } from "../vite/services/index.ts";

/**
 * Compila un único template y valida su compatibilidad. Fija `process.exitCode`
 * en 1 si el nombre es inválido o el build falla.
 */
export async function buildSelective(
  templateName: string | undefined,
  rootDir: string = process.cwd(),
): Promise<void> {
  try {
    assertValidTemplateName(templateName);
  } catch {
    console.error("❌ Template name must use only lowercase letters, numbers, and hyphens");
    console.error(`Usage: ${formatRunCommand("build")} <templateName>`);
    console.error(`Example: ${formatRunCommand("build")} welcome`);
    process.exitCode = 1;
    return;
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
}
