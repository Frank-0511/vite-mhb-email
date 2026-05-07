#!/usr/bin/env node
import { execSync } from "child_process";
import { checkHtmlSize } from "./check-html-size.js";
import { injectEmailMediaQueries } from "./inject-email-media-queries.js";
import { validateEmailHtml } from "./validate-email-html.js";

function build() {
  try {
    // Ejecutar el build de Maizzle
    console.log("\n📦 Building with Maizzle...\n");
    execSync("maizzle build", { stdio: "inherit" });

    // Inyectar media queries para dark mode en emails
    console.log("\n🎨 Injecting dark mode media queries...\n");
    injectEmailMediaQueries();

    // Chequear tamaño de archivos HTML
    checkHtmlSize();

    // Validar compatibilidad con clientes de email
    console.log("\n🔍 Validating email HTML compatibility...\n");
    validateEmailHtml();

    console.log("✅ Build completed successfully!\n");
  } catch (err) {
    console.error("\n❌ Build failed:", err.message);
    process.exit(1);
  }
}

build();
