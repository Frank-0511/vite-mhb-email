// @ts-check
/**
 * @fileoverview Catálogo inmutable de componentes de email en `src/emails/partials`.
 *
 * Centraliza el descubrimiento, listado y resolución de variantes para la
 * components API de Vite. Cualquier consumidor debe pasar por las funciones de
 * validación de este módulo antes de tocar rutas o archivos, evitando traversal,
 * separadores, metacaracteres o longitudes excesivas.
 *
 * No se consultan rutas fuera de `src/emails/partials/<rootDir>` ni se
 * inspeccionan archivos `index.html` con payloads no listados.
 */

import fs from "fs-extra";
import { resolve } from "node:path";
import { isPathInside, isValidTemplateName } from "../../shared/path-safety.js";

/**
 * @typedef {Object} ComponentSummary
 * @property {string} id Identificador del componente (mismo que la carpeta).
 * @property {string} name Nombre legible desde el schema.
 * @property {string} path Ruta lógica mostrada al cliente (`src/emails/partials/...`).
 * @property {string} dirPath Ruta absoluta del componente.
 */

/**
 * @typedef {Object} ComponentSchema
 * @property {string} id Identificador del componente.
 * @property {string} name Nombre legible del schema.
 * @property {string} [description]
 * @property {Array<{ id: string, name?: string, description?: string }>} [variants]
 * @property {Record<string, unknown>} [props]
 * @property {string[]} [icons]
 * @property {string[]} _availableVariants Variantes detectadas en disco.
 */

/**
 * Verifica que un identificador sea seguro como nombre de componente o variante.
 *
 * @param {unknown} value
 * @returns {boolean}
 */
export function isValidComponentIdentifier(value) {
  return isValidTemplateName(value);
}

/**
 * Devuelve la ruta absoluta del directorio de partials para el rootDir dado.
 *
 * @param {string} rootDir
 * @returns {string}
 */
export function getPartialsRoot(rootDir) {
  return resolve(rootDir, "src/emails/partials");
}

/**
 * Recorre recursivamente un directorio y devuelve las carpetas con schema.
 *
 * @param {string} baseDir
 * @returns {string[]}
 */
function collectComponentDirs(baseDir) {
  /** @type {string[]} */
  const results = [];
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
 *
 * @param {string} partialsRoot
 * @param {string} componentDir
 * @returns {string}
 */
function toComponentId(partialsRoot, componentDir) {
  const relative = componentDir.slice(partialsRoot.length).replace(/^[\\/]+/, "");
  return relative.split(/[\\/]/).join("/");
}

/**
 * Construye el listado de variantes disponibles a partir de archivos `.html`.
 *
 * @param {string} componentDir
 * @returns {string[]}
 */
export function listVariantsFromDir(componentDir) {
  if (!fs.existsSync(componentDir)) return [];
  const variants = [];
  const entries = fs.readdirSync(componentDir);
  for (const entry of entries) {
    if (!entry.endsWith(".html")) continue;
    variants.push(entry.replace(/\.html$/, ""));
  }
  return variants;
}

/**
 * Lista todos los componentes disponibles bajo `src/emails/partials`.
 *
 * @param {string} rootDir
 * @returns {ComponentSummary[]}
 */
export function listComponents(rootDir) {
  const partialsRoot = getPartialsRoot(rootDir);
  const dirs = collectComponentDirs(partialsRoot);
  /** @type {ComponentSummary[]} */
  const components = [];
  for (const dir of dirs) {
    if (!isPathInside(partialsRoot, dir)) continue;
    const schemaPath = resolve(dir, "schema.json");
    const schema = fs.readJsonSync(schemaPath);
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
 *
 * @param {string} rootDir
 * @param {string} componentName
 * @returns {string | null}
 */
export function findComponentDir(rootDir, componentName) {
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
 *
 * @param {string} rootDir
 * @param {string} componentName
 * @returns {ComponentSchema | null}
 */
export function readComponentSchema(rootDir, componentName) {
  const dir = findComponentDir(rootDir, componentName);
  if (!dir) return null;
  const schemaPath = resolve(dir, "schema.json");
  const schema = fs.readJsonSync(schemaPath);
  const variants = listVariantsFromDir(dir);
  return {
    id: componentName,
    ...schema,
    _availableVariants: variants,
  };
}
