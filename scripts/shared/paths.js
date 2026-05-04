// @ts-check
/**
 * @fileoverview Centraliza rutas del proyecto derivadas de rootDir.
 */

import { resolve } from "node:path";

/**
 * Obtiene las rutas centrales del proyecto.
 *
 * @param {string} rootDir Directorio raíz del proyecto.
 */
export function getProjectPaths(rootDir) {
  const templatesRoot = resolve(rootDir, "src/emails/templates");

  return {
    distDir: resolve(rootDir, "dist"),
    templatesRoot,
    layoutsRoot: resolve(rootDir, "src/emails/layouts"),
    partialsRoot: resolve(rootDir, "src/emails/partials"),
    stylesRoot: resolve(rootDir, "src/emails/styles"),
    maizzleConfig: resolve(rootDir, "maizzle.config.js"),
    tailwindEmailConfig: resolve(rootDir, "tailwind.email.config.js"),

    /**
     * @param {string} templateName
     * @returns {string}
     */
    templateHtml: (templateName) => resolve(templatesRoot, templateName, "index.html"),

    /**
     * @param {string} templateName
     * @returns {string}
     */
    templateData: (templateName) => resolve(templatesRoot, templateName, "data.json"),

    /**
     * @param {string} templateName
     * @returns {string}
     */
    templateDir: (templateName) => resolve(templatesRoot, templateName),
  };
}
