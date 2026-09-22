// @ts-check
/**
 * @fileoverview Descubrimiento dinámico de arquetipos de template en Atomic Design.
 * Escanea `src/emails/partials/templates/` para el generador de templates y el CLI interactivo.
 */

import fs from "fs-extra";
import { resolve } from "node:path";
import { isValidTemplateName } from "../shared/index.ts";

/**
 * @typedef {Object} ArchetypeTemplateInfo
 * @property {string} id Identificador de carpeta (kebab-case).
 * @property {string} name Nombre legible (desde schema.json o fallback).
 * @property {string} description Descripción del template.
 * @property {string} category Categoría funcional.
 * @property {readonly string[]} espVariables Variables ESP esperadas.
 * @property {string} dirPath Ruta absoluta del arquetipo.
 */

/**
 * Descubre dinámicamente todos los arquetipos disponibles en `src/emails/partials/templates/`.
 *
 * Lee el directorio en disco en tiempo de ejecución, cargando la metadata de cada
 * `schema.json` si existe, o usando el nombre del directorio como fallback.
 *
 * @param {string} [rootDir=process.cwd()]
 * @returns {ArchetypeTemplateInfo[]}
 */
export function getAvailableArchetypes(rootDir = process.cwd()) {
  const templatesDir = resolve(rootDir, "src/emails/partials/templates");
  if (!fs.existsSync(templatesDir)) {
    return [];
  }

  const entries = fs.readdirSync(templatesDir, { withFileTypes: true });
  /** @type {ArchetypeTemplateInfo[]} */
  const archetypes = [];

  for (const entry of entries) {
    if (!entry.isDirectory() || !isValidTemplateName(entry.name)) {
      continue;
    }

    const dirPath = resolve(templatesDir, entry.name);
    const schemaPath = resolve(dirPath, "schema.json");
    let name = entry.name;
    let description = "Plantilla base modular";
    let category = "General";
    /** @type {string[]} */
    let espVariables = [];

    if (fs.existsSync(schemaPath)) {
      try {
        const schema = fs.readJsonSync(schemaPath);
        if (schema.name && typeof schema.name === "string") {
          name = schema.name;
        }
        if (schema.description && typeof schema.description === "string") {
          description = schema.description;
        }
        if (schema.category && typeof schema.category === "string") {
          category = schema.category;
        }
        if (Array.isArray(schema.espVariables)) {
          espVariables = schema.espVariables.filter((v) => typeof v === "string");
        }
      } catch {
        // Fallback seguro ante error de parseo
      }
    }

    archetypes.push({
      id: entry.name,
      name,
      description,
      category,
      espVariables: Object.freeze(espVariables),
      dirPath,
    });
  }

  archetypes.sort((a, b) => a.id.localeCompare(b.id));
  return archetypes;
}

/**
 * Obtiene la información de un arquetipo por su ID.
 *
 * @param {string} id
 * @param {string} [rootDir=process.cwd()]
 * @returns {ArchetypeTemplateInfo | null}
 */
export function getArchetypeById(id, rootDir = process.cwd()) {
  if (typeof id !== "string" || !isValidTemplateName(id)) return null;
  const archetypes = getAvailableArchetypes(rootDir);
  return archetypes.find((a) => a.id === id) || null;
}
