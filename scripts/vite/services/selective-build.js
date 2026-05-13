// @ts-check
/**
 * @fileoverview Servicio de build productivo selectivo para un solo template.
 *
 * Usa el API programático de `@maizzle/framework` para compilar un template
 * en un directorio temporal (`.cache/copy-html/<template>/`), sin mutar
 * `maizzle.config.js` ni escribir directamente en `dist/` durante la operación.
 *
 * Esto evita que Vite detecte cambios en archivos observados y dispare un
 * full reload, lo que cerraría el modal y cancelaría el clipboard.
 *
 * Flujo:
 *   1. Lee `maizzle.config.js` programáticamente.
 *   2. Crea un override: `build.content` con solo el template, output a cache.
 *   3. Override de `afterRender` para que permalink apunte al cache (no a dist/).
 *   4. `afterBuild` limpiado para no borrar el cache.
 *   5. Corre `build()` de `@maizzle/framework` en memoria.
 *   6. Lee el HTML generado desde el cache.
 *   7. Escribe `dist/<template>.html` con `fs.outputFile` (no dispara HMR).
 *   8. Retorna el HTML final.
 *
 * No limpia `dist/`. Previene builds concurrentes.
 */

// @maizzle/framework exports `build` at runtime but lacks .d.ts for it;
// use a namespace import and access the export dynamically to avoid TS errors.
import * as maizzleFramework from "@maizzle/framework";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { isValidTemplateName } from "../../shared/path-safety.js";
import { getProjectPaths } from "../../shared/paths.js";

/**
 * @typedef {Object} SelectiveBuildResult
 * @property {boolean} success
 * @property {string} [html] - HTML final compilado (solo si success: true).
 * @property {string} [error] - Mensaje de error si success es false.
 */

/** Flag para prevenir builds concurrentes. */
let buildInProgress = false;

/**
 * Ejecuta el build productivo selectivo para un template usando el API
 * programático de Maizzle. No muta `maizzle.config.js` ni archivos en `dist/`
 * durante la compilación, evitando reloads de Vite/HMR.
 *
 * @param {string} rootDir Directorio raíz del proyecto.
 * @param {string} templateName Nombre del template a compilar.
 * @returns {Promise<SelectiveBuildResult>}
 */
export async function runSelectiveBuild(rootDir, templateName) {
  if (!isValidTemplateName(templateName)) {
    return { success: false, error: "Invalid template name" };
  }

  const paths = getProjectPaths(rootDir);
  const templateDir = paths.templateDir(templateName);

  if (!existsSync(templateDir)) {
    return { success: false, error: `Template not found: ${templateName}` };
  }

  if (buildInProgress) {
    return {
      success: false,
      error: "A build is already in progress. Please wait and try again.",
    };
  }

  buildInProgress = true;

  try {
    console.log(`[selective-build] Starting build for template: ${templateName}`);

    // Directorio temporal: .cache/copy-html/<template>/
    const cacheDir = resolve(rootDir, ".cache", "copy-html", templateName);
    await mkdir(cacheDir, { recursive: true });

    // Leer el config base de Maizzle y aplicar overrides sin tocarlo en disco.
    // Importamos dinámicamente con cache-busting para tener el estado actual.
    const configPath = resolve(rootDir, "maizzle.config.js");
    const { default: baseConfig } = await import(`file://${configPath}?t=${Date.now()}`);

    /** @type {Record<string, unknown>} */
    const buildConfig = {
      ...baseConfig,
      build: {
        ...baseConfig.build,
        // Solo el template solicitado
        content: [`src/emails/templates/${templateName}/index.html`],
        output: {
          path: cacheDir,
          from: ["src/emails/templates"],
        },
        // Desactivar resumen de tabla para no spamear la consola de Vite
        summary: false,
      },
      // Override afterRender: permalink al cache (evita hardcoded dist/)
      afterRender: (
        /** @type {{ html: string, config: Record<string, any> }} */ { html, config },
      ) => {
        const currentPath = config.build.current.path;
        const folderName = currentPath.dir.split("/").pop();
        config.permalink = resolve(cacheDir, `${folderName}.html`);
        return html;
      },
      // afterBuild: no limpiar ni mover archivos del cache
      afterBuild: undefined,
    };

    console.log(`[selective-build] Running Maizzle programmatically for ${templateName}...`);

    // Access build via namespace import (runtime export without .d.ts)
    const maizzleBuild = /** @type {(config: Record<string, unknown>) => Promise<unknown>} */ (
      /** @type {Record<string, unknown>} */ (maizzleFramework).build
    );

    // Cambiar cwd temporalmente para que Maizzle resuelva rutas relativas
    // (componentes, estilos, etc.) correctamente.
    const originalCwd = process.cwd();
    process.chdir(rootDir);

    try {
      await maizzleBuild(buildConfig);
    } finally {
      process.chdir(originalCwd);
    }

    // Leer el HTML compilado desde el cache
    const cachedHtmlPath = resolve(cacheDir, `${templateName}.html`);
    if (!existsSync(cachedHtmlPath)) {
      return {
        success: false,
        error: `Build did not produce expected output: ${cachedHtmlPath}`,
      };
    }

    const html = await readFile(cachedHtmlPath, "utf-8");

    // Persistir en dist/<template>.html (sin que Vite lo observe en dev)
    const distPath = resolve(rootDir, "dist", `${templateName}.html`);
    await mkdir(resolve(rootDir, "dist"), { recursive: true });
    await writeFile(distPath, html, "utf-8");

    console.log(`[selective-build] Build complete. Output: dist/${templateName}.html`);
    return { success: true, html };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[selective-build] Build failed:", message);
    return { success: false, error: message };
  } finally {
    buildInProgress = false;
  }
}
