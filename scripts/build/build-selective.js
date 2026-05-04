#!/usr/bin/env node
/**
 * Build selective por template
 * Uso: bun run build-selective <templateName>
 * Ejemplo: bun run build-selective user-created
 *
 * Genera dist/<templateName>.html sin afectar los otros templates
 */
import { execSync } from "child_process";
import { existsSync } from "node:fs";
import { readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { restorePreviewCss, switchToEmailCss } from "../generators/css-switcher.js";
import { injectEmailMediaQueries } from "./inject-email-media-queries.js";
import { validateEmailHtml } from "./validate-email-html.js";

const rootDir = process.cwd();
const templateName = process.argv[2];

if (!templateName) {
  console.error("❌ Template name is required");
  console.error("Usage: bun run build-selective <templateName>");
  console.error("Example: bun run build-selective user-created");
  process.exit(1);
}

/**
 * Crear config temporal de Maizzle con solo un template.
 *
 * @param {string} configBackupPath Ruta absoluta del backup a escribir.
 * @returns {Promise<void>} Resolves cuando el config temporal queda escrito.
 */
async function createTemporaryMaizzleConfig(configBackupPath) {
  const configPath = resolve(rootDir, "maizzle.config.js");

  // Leer el config original
  const originalConfig = await readFile(configPath, "utf-8");

  // Guardar backup
  await writeFile(configBackupPath, originalConfig);

  // Crear config temporal con solo el template solicitado
  const contentPattern = /content:\s*\[\s*(["'])src\/emails\/templates\/\*\*\/\*\.html\1\s*\]/;
  let didReplace = false;
  const tempConfig = originalConfig.replace(contentPattern, (_match, quote) => {
    didReplace = true;
    return `content: [${quote}src/emails/templates/${templateName}/index.html${quote}]`;
  });

  if (!didReplace) {
    throw new Error(
      'Maizzle config glob not found. Expected content: ["src/emails/templates/**/*.html"].',
    );
  }

  await writeFile(configPath, tempConfig);
  console.log(`✅ Created temporary Maizzle config for ${templateName}`);
}

/**
 * Restaurar config original de Maizzle.
 *
 * @param {string} backupPath Ruta absoluta del backup a restaurar.
 * @returns {Promise<void>} Resolves cuando el config original queda restaurado.
 */
async function restoreMaizzleConfig(backupPath) {
  try {
    const originalConfig = await readFile(backupPath, "utf-8");
    const configPath = resolve(rootDir, "maizzle.config.js");
    await writeFile(configPath, originalConfig);
    await rm(backupPath);
    console.log("✅ Restored original Maizzle config");
  } catch (err) {
    console.error("❌ Error restoring Maizzle config:", err.message);
  }
}

/**
 * Limpiar el directorio dist.
 *
 * @returns {Promise<void>} Resolves cuando dist queda eliminado.
 */
async function cleanDist() {
  const distDir = resolve(rootDir, "dist");
  if (existsSync(distDir)) {
    try {
      await rm(distDir, { recursive: true });
      console.log("✅ Cleaned dist directory");
    } catch (err) {
      console.error("❌ Error cleaning dist:", err.message);
      process.exit(1);
    }
  }
}

/**
 * Verificar que el template existe
 */
function validateTemplate() {
  const templatePath = resolve(rootDir, `src/emails/templates/${templateName}`);
  if (!existsSync(templatePath)) {
    console.error(`❌ Template not found: ${templatePath}`);
    process.exit(1);
  }
  console.log(`✅ Found template: ${templateName}`);
}

/**
 * Build selective de un template preservando el pipeline principal.
 *
 * @returns {Promise<void>} Resolves cuando el build finaliza o falla con exit code.
 */
async function buildSelective() {
  const configBackupPath = resolve(rootDir, "maizzle.config.js.selective-bak");

  try {
    // Validar que el template existe
    validateTemplate();

    // Limpiar dist
    await cleanDist();

    // Cambiar a CSS de email
    await switchToEmailCss();

    // Crear config temporal de Maizzle
    await createTemporaryMaizzleConfig(configBackupPath);

    // Ejecutar build de Maizzle solo para este template
    console.log(`\n📦 Building ${templateName} with Maizzle...\n`);
    execSync("maizzle build", { stdio: "inherit" });

    // Inyectar media queries para dark mode
    console.log("\n🎨 Injecting dark mode media queries...\n");
    injectEmailMediaQueries();

    // Validar compatibilidad
    console.log("\n🔍 Validating email HTML compatibility...\n");
    validateEmailHtml();

    console.log(`✅ Selective build completed for ${templateName}!\n`);
    console.log(`📄 Output: dist/${templateName}.html\n`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("\n❌ Selective build failed:", message);
    process.exitCode = 1;
  } finally {
    if (existsSync(configBackupPath)) {
      await restoreMaizzleConfig(configBackupPath);
    }
    await restorePreviewCss();
  }
}

buildSelective();
