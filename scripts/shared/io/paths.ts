/**
 * @fileoverview Centraliza rutas del proyecto derivadas de rootDir.
 */

import { resolve } from "node:path";

export interface ProjectPaths {
  readonly distDir: string;
  readonly templatesRoot: string;
  readonly layoutsRoot: string;
  readonly partialsRoot: string;
  readonly stylesRoot: string;
  readonly maizzleConfig: string;
  readonly tailwindEmailConfig: string;
  readonly templateHtml: (templateName: string) => string;
  readonly templateData: (templateName: string) => string;
  readonly templateDir: (templateName: string) => string;
}

/**
 * Obtiene las rutas centrales del proyecto.
 *
 * @param {string} rootDir Directorio raíz del proyecto.
 * @returns {ProjectPaths}
 */
export function getProjectPaths(rootDir: string): ProjectPaths {
  const templatesRoot = resolve(rootDir, "src/emails/templates");

  return {
    distDir: resolve(rootDir, "dist"),
    templatesRoot,
    layoutsRoot: resolve(rootDir, "src/emails/layouts"),
    partialsRoot: resolve(rootDir, "src/emails/partials"),
    stylesRoot: resolve(rootDir, "src/emails/styles"),
    maizzleConfig: resolve(rootDir, "maizzle.config.js"),
    tailwindEmailConfig: resolve(rootDir, "tailwind.email.config.js"),

    templateHtml: (templateName: string): string =>
      resolve(templatesRoot, templateName, "index.html"),
    templateData: (templateName: string): string =>
      resolve(templatesRoot, templateName, "data.json"),
    templateDir: (templateName: string): string => resolve(templatesRoot, templateName),
  };
}
