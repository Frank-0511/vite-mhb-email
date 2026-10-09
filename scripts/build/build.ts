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
 *   <pm> run build                 # Comportamiento por defecto
 *   <pm> run build --allow-warnings # (reservado para CI permisivo)
 */
import * as maizzleFramework from "@maizzle/framework";
import maizzleConfig from "../../maizzle.config.ts";
import { checkHtmlSize } from "../validators/check-html-size.ts";
import { validateEmailHtml } from "../validators/validate-email-html.ts";
import { writeEspManifest } from "../esp/manifest/write-manifest.ts";

/** `build` es un export de runtime de Maizzle sin declaración en sus tipos. */
const maizzleBuild = (maizzleFramework as Record<string, unknown>).build as (
  config: Record<string, unknown>,
) => Promise<unknown>;

export async function build(): Promise<void> {
  try {
    // Ejecutar el build de Maizzle
    console.log("\n📦 Building with Maizzle...\n");
    await maizzleBuild(maizzleConfig);

    // Chequear tamaño de archivos HTML
    checkHtmlSize();

    // Generar manifiesto de variables ESP
    writeEspManifest();
    console.log("📄 ESP manifest: dist/esp-manifest.json");

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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("\n❌ Build failed:", message);
    process.exit(1);
  }
}

await build();
