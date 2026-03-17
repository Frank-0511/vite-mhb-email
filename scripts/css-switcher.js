import fs from "fs-extra";
import { resolve } from "path";

const rootDir = process.cwd();

export async function switchToEmailCss() {
  const tailwindCss = resolve(rootDir, "src/css/tailwind.css");
  const tailwindEmailCss = resolve(rootDir, "src/css/tailwind.email.css");
  const tailwindBackup = resolve(rootDir, "src/css/tailwind.css.bak");

  try {
    // Crear backup del CSS de preview
    const originalContent = await fs.readFile(tailwindCss, "utf-8");
    await fs.writeFile(tailwindBackup, originalContent);

    // Reemplazar con CSS de email
    const emailContent = await fs.readFile(tailwindEmailCss, "utf-8");
    await fs.writeFile(tailwindCss, emailContent);

    console.log("✅ CSS switched to email version for build");
  } catch (err) {
    console.error("❌ Error switching CSS:", err.message);
    process.exit(1);
  }
}

export async function restorePreviewCss() {
  const tailwindCss = resolve(rootDir, "src/css/tailwind.css");
  const tailwindBackup = resolve(rootDir, "src/css/tailwind.css.bak");

  try {
    // Restaurar CSS de preview
    if (await fs.pathExists(tailwindBackup)) {
      const originalContent = await fs.readFile(tailwindBackup, "utf-8");
      await fs.writeFile(tailwindCss, originalContent);
      await fs.remove(tailwindBackup);
      console.log("✅ CSS restored to preview version");
    }
  } catch (err) {
    console.error("❌ Error restoring CSS:", err.message);
  }
}
