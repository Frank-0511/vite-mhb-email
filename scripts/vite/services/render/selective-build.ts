/**
 * @fileoverview Servicio de build productivo selectivo para un solo template.
 *
 * Usa el API programático de `@maizzle/framework` para compilar un template
 * en un directorio temporal (`.cache/copy-html/<template>/`), sin mutar
 * `maizzle.config.js` ni escribir directamente en `dist/` durante la operación.
 *
 * Esto evita que Vite detecte cambios en archivos observados y dispare un
 * full reload, lo que cerraría el modal y cancelaría el clipboard.
 */

import * as maizzleFramework from "@maizzle/framework";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { collectTemplateSource } from "../../../esp/sources.ts";
import { validateEspVariables } from "../../../esp/validator.ts";
import { getProjectPaths, isValidTemplateName } from "../../../shared/index.ts";

export interface SelectiveBuildResult {
  success: boolean;
  html?: string;
  validation?: {
    missing: string[];
    unused: string[];
  };
  error?: string;
}

/** Flag para prevenir builds concurrentes. */
let buildInProgress = false;

/**
 * Ejecuta el build productivo selectivo para un template usando el API
 * programático de Maizzle. No muta `maizzle.config.js` ni archivos en `dist/`
 * durante la compilación, evitando reloads de Vite/HMR.
 *
 * @param rootDir Directorio raíz del proyecto.
 * @param templateName Nombre del template a compilar.
 * @returns Resultado del build con HTML o error.
 */
export async function runSelectiveBuild(
  rootDir: string,
  templateName: string,
): Promise<SelectiveBuildResult> {
  if (!isValidTemplateName(templateName)) {
    return { success: false, error: "Invalid template name" };
  }

  const paths = getProjectPaths(rootDir);
  const templateDir = paths.templateDir(templateName);

  if (!existsSync(templateDir)) {
    return { success: false, error: `Template not found: ${templateDir}` };
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

    // Mantener el mismo aviso ESP que el build completo antes de exportar.
    const source = collectTemplateSource(rootDir, templateName);
    let data: Record<string, unknown> = {};
    const dataPath = paths.templateData(templateName);
    if (existsSync(dataPath)) {
      try {
        data = JSON.parse(await readFile(dataPath, "utf8"));
      } catch {
        data = {};
      }
    }
    const { missing, unused } = validateEspVariables({ source, data });
    if (missing.length > 0) {
      console.warn(`[selective-build] ESP variables faltantes: ${missing.join(", ")}`);
    }
    if (unused.length > 0) {
      console.info(`[selective-build] Claves de data.json sin uso: ${unused.join(", ")}`);
    }

    // Directorio temporal: .cache/copy-html/<template>/
    const cacheDir = resolve(rootDir, ".cache", "copy-html", templateName);
    await mkdir(cacheDir, { recursive: true });

    // Leer el config base de Maizzle y aplicar overrides sin tocarlo en disco.
    const configPath = resolve(rootDir, "maizzle.config.js");
    const { default: baseConfig } = await import(`file://${configPath}?t=${Date.now()}`);

    const buildConfig: Record<string, unknown> = {
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
      afterRender: ({
        html,
        config,
      }: {
        html: string;
        config: {
          permalink?: string;
          build?: {
            current?: {
              path?: {
                dir?: string;
              };
            };
          };
          [key: string]: unknown;
        };
      }) => {
        const currentDir = config.build?.current?.path?.dir ?? "";
        const folderName = currentDir.split("/").pop();
        config.permalink = resolve(cacheDir, `${folderName}.html`);
        return html;
      },
      // afterBuild: no limpiar ni mover archivos del cache
      afterBuild: undefined,
    };

    console.log(`[selective-build] Running Maizzle programmatically for ${templateName}...`);

    // Access build via namespace import (runtime export without .d.ts)
    const maizzleBuild = (maizzleFramework as Record<string, unknown>).build as (
      config: Record<string, unknown>,
    ) => Promise<unknown>;

    // Cambiar cwd temporalmente para que Maizzle resuelva rutas relativas
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
    return { success: true, html, validation: { missing, unused } };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[selective-build] Build failed:", message);
    return { success: false, error: message };
  } finally {
    buildInProgress = false;
  }
}
