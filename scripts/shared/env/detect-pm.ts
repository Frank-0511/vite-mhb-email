/**
 * @fileoverview Detección del package manager que lanzó el proceso actual.
 */

export const PACKAGE_MANAGERS = ["npm", "yarn", "pnpm", "bun"] as const;
export type PackageManager = (typeof PACKAGE_MANAGERS)[number];

/** Manager usado cuando ningún package manager lanzó el proceso (hooks, `node` directo). */
export const DEFAULT_PACKAGE_MANAGER: PackageManager = "npm";

function isPackageManager(value: string): value is PackageManager {
  return (PACKAGE_MANAGERS as readonly string[]).includes(value);
}

/**
 * Detecta el package manager a partir de `npm_config_user_agent`
 * (p. ej. `yarn/4.18.1 npm/? node/v24.0.0 linux x64`).
 *
 * @param env - Entorno a inspeccionar (inyectable en tests)
 * @returns Manager detectado o `DEFAULT_PACKAGE_MANAGER`
 */
export function detectPackageManager(
  env: Readonly<Record<string, string | undefined>> = process.env,
): PackageManager {
  const name = env.npm_config_user_agent?.split("/")[0] ?? "";
  return isPackageManager(name) ? name : DEFAULT_PACKAGE_MANAGER;
}

/**
 * Formatea el comando para ejecutar un script de `package.json`.
 *
 * @param script - Nombre del script (p. ej. `build`)
 * @param pm - Manager a usar; por defecto, el detectado
 * @returns Comando listo para mostrar (p. ej. `yarn run build`)
 */
export function formatRunCommand(
  script: string,
  pm: PackageManager = detectPackageManager(),
): string {
  return `${pm} run ${script}`;
}
