#!/usr/bin/env node
/**
 * Build selective por template
 * Uso: bun run build-selective <templateName>
 * Ejemplo: bun run build-selective user-created
 *
 * Genera dist/<templateName>.html sin afectar los otros templates
 */
import { execSync } from "child_process";
import { rm, writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
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
 * Crear config temporal de Maizzle con solo un template
 */
async function createTemporaryMaizzleConfig() {
  const configPath = resolve(rootDir, "maizzle.config.js");
  const configBackupPath = resolve(rootDir, "maizzle.config.js.selective-bak");

  try {
    // Leer el config original
    const originalConfig = await readFile(configPath, "utf-8");

    // Guardar backup
    await writeFile(configBackupPath, originalConfig);

    // Crear config temporal con solo el template solicitado
    const tempConfig = originalConfig.replace(
      'content: ["src/emails/templates/**/*.html"]',
      `content: ["src/emails/templates/${templateName}/index.html"]`,
    );

    await writeFile(configPath, tempConfig);
    console.log(`✅ Created temporary Maizzle config for ${templateName}`);

    return configBackupPath;
  } catch (err) {
    console.error("❌ Error creating temporary Maizzle config:", err.message);
    process.exit(1);
  }
}

/**
 * Restaurar config original de Maizzle
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
 * Limpiar el directorio dist
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

async function buildSelective() {
  let configBackupPath = null;

  try {
    // Validar que el template existe
    validateTemplate();

    // Limpiar dist
    await cleanDist();

    // Cambiar a CSS de email
    await switchToEmailCss();

    // Crear config temporal de Maizzle
    configBackupPath = await createTemporaryMaizzleConfig();

    // Ejecutar build de Maizzle solo para este template
    console.log(`\n📦 Building ${templateName} with Maizzle...\n`);
    execSync("maizzle build", { stdio: "inherit" });

    // Restaurar config original de Maizzle
    await restoreMaizzleConfig(configBackupPath);

    // Inyectar media queries para dark mode
    console.log("\n🎨 Injecting dark mode media queries...\n");
    injectEmailMediaQueries();

    // Restaurar CSS de preview
    await restorePreviewCss();

    // Validar compatibilidad
    console.log("\n🔍 Validating email HTML compatibility...\n");
    validateEmailHtml();

    console.log(`✅ Selective build completed for ${templateName}!\n`);
    console.log(`📄 Output: dist/${templateName}.html\n`);
  } catch (err) {
    // Intentar restaurar en caso de error
    if (configBackupPath) {
      await restoreMaizzleConfig(configBackupPath);
    }
    await restorePreviewCss();
    console.error("\n❌ Selective build failed:", err.message);
    process.exit(1);
  }
}

buildSelective();
