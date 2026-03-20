#!/usr/bin/env node
import { execSync } from "child_process";
import { restorePreviewCss, switchToEmailCss } from "../generators/css-switcher.js";
import { checkHtmlSize } from "./check-html-size.js";
import { injectEmailMediaQueries } from "./inject-email-media-queries.js";

async function build() {
  try {
    // Cambiar a CSS de email
    await switchToEmailCss();

    // Ejecutar el build de Maizzle
    console.log("\n📦 Building with Maizzle...\n");
    execSync("maizzle build", { stdio: "inherit" });

    // Inyectar media queries para dark mode en emails
    console.log("\n🎨 Injecting dark mode media queries...\n");
    injectEmailMediaQueries();

    // Restaurar CSS de preview
    await restorePreviewCss();

    // Chequear tamaño de archivos HTML
    await checkHtmlSize();

    console.log("✅ Build completed successfully!\n");
  } catch (err) {
    // Asegurar que se restore el CSS incluso si hay error
    await restorePreviewCss();
    console.error("\n❌ Build failed:", err.message);
    process.exit(1);
  }
}

build();
