// @ts-check
import { globSync } from "glob";
import { resolve } from "node:path";

/**
 * Obtiene las carpetas donde Maizzle debe buscar componentes de email.
 *
 * Incluye layouts, la raíz de partials y sus subcarpetas para permitir
 * entrypoints `index.html` como `partials/organisms/hero/index.html` usando
 * tags HTML válidos como `<x-hero />`.
 *
 * @param {string} rootDir - Raíz absoluta o relativa del proyecto.
 * @returns {string[]} Carpetas absolutas de componentes.
 */
export function getEmailComponentFolders(rootDir) {
  const layoutsRoot = resolve(rootDir, "src/emails/layouts");
  const partialsRoot = resolve(rootDir, "src/emails/partials");
  const partialFolders = globSync("**/", {
    cwd: partialsRoot,
    absolute: true,
    mark: false,
  });

  return [layoutsRoot, partialsRoot, ...partialFolders];
}
