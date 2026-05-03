import fs from "fs-extra";
import { resolve } from "node:path";

const rootDir = process.cwd();

/**
 * Switch Tailwind config to email version for build
 * Maizzle will use tailwind.config.js, so we swap the config files
 */
export async function switchToEmailCss() {
  const tailwindConfig = resolve(rootDir, "tailwind.config.js");
  const tailwindEmailConfig = resolve(rootDir, "tailwind.email.config.js");
  const tailwindConfigBackup = resolve(rootDir, "tailwind.config.js.bak");

  try {
    // Crear backup del config de preview
    const previewContent = await fs.readFile(tailwindConfig, "utf-8");
    await fs.writeFile(tailwindConfigBackup, previewContent);

    // Reemplazar con config de email
    const emailContent = await fs.readFile(tailwindEmailConfig, "utf-8");
    await fs.writeFile(tailwindConfig, emailContent);

    console.log("✅ CSS switched to email version for build");
  } catch (err) {
    console.error("❌ Error switching CSS:", err.message);
    process.exit(1);
  }
}

/**
 * Restore Tailwind config to preview version after build
 */
export async function restorePreviewCss() {
  const tailwindConfig = resolve(rootDir, "tailwind.config.js");
  const tailwindConfigBackup = resolve(rootDir, "tailwind.config.js.bak");

  try {
    // Restaurar config de preview
    if (await fs.pathExists(tailwindConfigBackup)) {
      const previewContent = await fs.readFile(tailwindConfigBackup, "utf-8");
      await fs.writeFile(tailwindConfig, previewContent);
      await fs.remove(tailwindConfigBackup);
      console.log("✅ CSS restored to preview version");
    }
  } catch (err) {
    console.error("❌ Error restoring CSS:", err.message);
  }
}
