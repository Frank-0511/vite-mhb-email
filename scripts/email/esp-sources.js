// @ts-check
/**
 * @fileoverview Resuelve las fuentes HTML que participan en un template.
 *
 * Maizzle compone layouts y componentes mediante etiquetas <x-...>. Este
 * adaptador mantiene el extractor ESP puro, pero permite a los consumidores
 * analizar la misma superficie que terminará en el HTML compilado.
 */

import { existsSync, readFileSync } from "node:fs";
import { basename, dirname, resolve, sep } from "node:path";
import { globSync } from "glob";

const COMPONENT_TAG_RE = /<x-([a-z0-9-]+)\b[^>]*>/gi;

/**
 * Reúne el template, sus layouts y los componentes alcanzables desde sus
 * etiquetas <x-...>. El resultado conserva las fuentes separadas por saltos
 * de línea para que los extractores puedan procesarlo como un único cuerpo.
 *
 * @param {string} rootDir Raíz del proyecto.
 * @param {string} templateName Nombre validado del template.
 * @returns {string}
 */
export function collectTemplateSource(rootDir, templateName) {
  const templatePath = resolve(rootDir, "src/emails/templates", templateName, "index.html");
  if (!existsSync(templatePath)) return "";

  const visited = new Set();
  const sources = [];

  /**
   * @param {string} filePath
   */
  function visit(filePath) {
    if (visited.has(filePath) || !existsSync(filePath)) return;
    visited.add(filePath);

    const source = localizeComponentProps(rootDir, filePath, readFileSync(filePath, "utf8"));
    sources.push(source);

    for (const match of source.matchAll(COMPONENT_TAG_RE)) {
      const componentPath = resolveComponentPath(rootDir, match[1]);
      if (componentPath) visit(componentPath);
    }
  }

  visit(templatePath);
  return sources.join("\n");
}

/**
 * Los placeholders de un partial definidos por su schema son props locales,
 * no variables ESP del template raíz. Se neutralizan solo para el análisis;
 * nunca se modifica el archivo ni el HTML compilado.
 *
 * @param {string} rootDir
 * @param {string} filePath
 * @param {string} source
 * @returns {string}
 */
function localizeComponentProps(rootDir, filePath, source) {
  const partialsRoot = resolve(rootDir, "src/emails/partials");
  if (!filePath.startsWith(`${partialsRoot}${sep}`)) return source;

  let directory = dirname(filePath);
  while (directory.startsWith(partialsRoot)) {
    const schemaPath = resolve(directory, "schema.json");
    if (existsSync(schemaPath)) {
      try {
        const schema = JSON.parse(readFileSync(schemaPath, "utf8"));
        const properties =
          schema && typeof schema === "object" && schema.props && typeof schema.props === "object"
            ? Object.keys(schema.props)
            : [];
        return properties.reduce((result, property) => {
          const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          return result.replace(
            new RegExp(`\\{\\{\\s*${escaped}\\s*\\}\\}`, "g"),
            `[[component.${property}]]`,
          );
        }, source);
      } catch {
        return source;
      }
    }

    const parent = dirname(directory);
    if (parent === directory) break;
    directory = parent;
  }
  return source;
}

/**
 * Encuentra el archivo que Maizzle puede resolver para una etiqueta x-foo.
 * Layouts tienen prioridad para conservar la semántica de x-main.
 *
 * @param {string} rootDir
 * @param {string} tagName
 * @returns {string | null}
 */
function resolveComponentPath(rootDir, tagName) {
  const layoutsRoot = resolve(rootDir, "src/emails/layouts");
  const partialsRoot = resolve(rootDir, "src/emails/partials");

  const candidates = [
    resolve(layoutsRoot, `${tagName}.html`),
    resolve(partialsRoot, tagName, "index.html"),
    ...globSync(`**/${tagName}.html`, { cwd: partialsRoot, absolute: true }),
    ...globSync(`**/${tagName}/index.html`, { cwd: partialsRoot, absolute: true }),
  ];

  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

/**
 * Devuelve el nombre estable de una fuente, útil para diagnósticos.
 *
 * @param {string} filePath
 * @returns {string}
 */
export function getSourceName(filePath) {
  return basename(filePath);
}
