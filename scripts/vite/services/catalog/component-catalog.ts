/**
 * @fileoverview Catálogo inmutable de componentes de email en `src/emails/partials`.
 *
 * Centraliza el descubrimiento, listado y resolución de variantes para la
 * components API de Vite. Cualquier consumidor debe pasar por las funciones de
 * validación de este módulo antes de tocar rutas o archivos, evitando traversal,
 * separadores, metacaracteres o longitudes excesivas.
 */

import fs from "fs-extra";
import { resolve } from "node:path";
import { isPathInside, isValidTemplateName } from "../../../shared/index.ts";

export interface ComponentVariant {
  id: string;
  name?: string;
  description?: string;
}

export interface ComponentSummary {
  id: string;
  name: string;
  path: string;
  dirPath: string;
  icon?: string;
  props?: Record<string, unknown>;
  variants?: ComponentVariant[];
  icons?: string[];
  [key: string]: unknown;
}

export interface ComponentSchema {
  id: string;
  name: string;
  description?: string;
  variants?: ComponentVariant[];
  props?: Record<string, unknown>;
  icons?: string[];
  _availableVariants: string[];
  [key: string]: unknown;
}

/**
 * Verifica que un identificador sea seguro como nombre de componente o variante.
 */
export function isValidComponentIdentifier(value: unknown): boolean {
  return isValidTemplateName(value);
}

/**
 * Devuelve la ruta absoluta del directorio de partials para el rootDir dado.
 */
export function getPartialsRoot(rootDir: string): string {
  return resolve(rootDir, "src/emails/partials");
}

/**
 * Recorre recursivamente un directorio y devuelve las carpetas con schema.
 */
function collectComponentDirs(baseDir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(baseDir)) return results;

  for (const entry of fs.readdirSync(baseDir)) {
    const entryPath = resolve(baseDir, entry);
    if (!fs.statSync(entryPath).isDirectory()) continue;
    if (fs.existsSync(resolve(entryPath, "schema.json"))) {
      results.push(entryPath);
    } else {
      results.push(...collectComponentDirs(entryPath));
    }
  }
  return results;
}

/**
 * Convierte una ruta absoluta de componente en su identificador canónico
 * (relativo a `src/emails/partials`).
 */
function toComponentId(partialsRoot: string, componentDir: string): string {
  const relative = componentDir.slice(partialsRoot.length).replace(/^[\\/]+/, "");
  return relative.split(/[\\/]/).join("/");
}

/**
 * Construye el listado de variantes disponibles a partir de archivos `.html`.
 */
export function listVariantsFromDir(componentDir: string): string[] {
  if (!fs.existsSync(componentDir)) return [];
  const variants: string[] = [];
  const entries = fs.readdirSync(componentDir);
  for (const entry of entries) {
    if (!entry.endsWith(".html")) continue;
    variants.push(entry.replace(/\.html$/, ""));
  }
  return variants;
}

/**
 * Lista todos los componentes disponibles bajo `src/emails/partials`.
 */
export function listComponents(rootDir: string): ComponentSummary[] {
  const partialsRoot = getPartialsRoot(rootDir);
  const dirs = collectComponentDirs(partialsRoot);
  const components: ComponentSummary[] = [];

  for (const dir of dirs) {
    if (!isPathInside(partialsRoot, dir)) continue;
    const schemaPath = resolve(dir, "schema.json");
    const schema = fs.readJsonSync(schemaPath) as Record<string, unknown>;
    const relative = toComponentId(partialsRoot, dir);
    const segments = relative.split("/");
    const id = segments[segments.length - 1];
    const name = typeof schema.name === "string" && schema.name.length > 0 ? schema.name : id;

    components.push({
      id,
      path: `src/emails/partials/${relative}`,
      dirPath: dir,
      ...schema,
      name,
    });
  }
  return components;
}

/**
 * Encuentra el directorio absoluto de un componente por identificador
 * (último segmento del path relativo a `src/emails/partials`), verificando
 * que permanezca dentro de la raíz permitida.
 */
export function findComponentDir(rootDir: string, componentName: unknown): string | null {
  if (!isValidComponentIdentifier(componentName)) return null;
  const partialsRoot = getPartialsRoot(rootDir);
  const dirs = collectComponentDirs(partialsRoot);
  for (const dir of dirs) {
    if (!isPathInside(partialsRoot, dir)) continue;
    const relative = toComponentId(partialsRoot, dir);
    const segments = relative.split("/");
    if (segments[segments.length - 1] === componentName) {
      return dir;
    }
  }
  return null;
}

/**
 * Lee el `schema.json` de un componente y lo enriquece con el listado de
 * variantes detectadas en disco.
 */
export function readComponentSchema(
  rootDir: string,
  componentName: string,
): ComponentSchema | null {
  const dir = findComponentDir(rootDir, componentName);
  if (!dir) return null;
  const schemaPath = resolve(dir, "schema.json");
  const schema = fs.readJsonSync(schemaPath) as Record<string, unknown>;
  const variants = listVariantsFromDir(dir);
  return {
    id: componentName,
    name: typeof schema.name === "string" ? schema.name : componentName,
    ...schema,
    _availableVariants: variants,
  };
}
