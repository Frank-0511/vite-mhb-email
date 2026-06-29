#!/usr/bin/env node
/**
 * @fileoverview Pipeline de build principal.
 *
 * Pasos:
 *   1. Compilar templates con Maizzle.
 *   2. Verificar tamaño de los HTML de salida (gate de Gmail 102 KB).
 *   3. Validar compatibilidad con clientes de email.
 *      → Falla con exit code 1 si hay issues de severidad ERROR.
 *      → WARNING e INFO no bloquean (configurable vía --allow-warnings).
 *
 * Uso:
 *   bun run build                 # Comportamiento por defecto
 *   bun run build --allow-warnings # (reservado para CI permisivo)
 */
import { execSync } from "child_process";
import { checkHtmlSize } from "./check-html-size.js";
import { validateEmailHtml } from "./validate-email-html.js";

function build() {
  try {
    // Ejecutar el build de Maizzle
    console.log("\n📦 Building with Maizzle...\n");
    execSync("maizzle build", { stdio: "inherit" });

    // Chequear tamaño de archivos HTML
    checkHtmlSize();

    // Validar compatibilidad con clientes de email
    console.log("\n🔍 Validating email HTML compatibility...\n");
    const { errors, warnings } = validateEmailHtml();

    if (errors > 0) {
      console.error(
        `\n❌ Build bloqueado: ${errors} error${errors !== 1 ? "es" : ""} de compatibilidad detectado${errors !== 1 ? "s" : ""}.`,
      );
      console.error("   Corrige los issues marcados con ❌ ERROR antes de continuar.\n");
      process.exit(1);
    }

    if (warnings > 0) {
      console.warn(
        `\n⚠️  ${warnings} warning${warnings !== 1 ? "s" : ""} de compatibilidad (no bloquea el build).\n`,
      );
    }

    console.log("✅ Build completed successfully!\n");
  } catch (err) {
    console.error("\n❌ Build failed:", err.message);
    process.exit(1);
  }
}

build();
