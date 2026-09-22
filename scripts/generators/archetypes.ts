/**
 * @fileoverview Descubrimiento dinámico de arquetipos de template en Atomic Design.
 * Escanea `src/emails/partials/templates/` para el generador de templates y el CLI interactivo.
 */

import fs from "fs-extra";
import { resolve } from "node:path";
import { isValidTemplateName } from "../shared/index.ts";

/**
 * Metadata representativa de un arquetipo de template.
 */
export interface ArchetypeTemplateInfo {
  id: string;
  name: string;
  description: string;
  category: string;
  espVariables: readonly string[];
  dirPath: string;
}

interface ArchetypeSchema {
  name?: string;
  description?: string;
  category?: string;
  espVariables?: unknown[];
  [key: string]: unknown;
}

/**
 * Descubre dinámicamente todos los arquetipos disponibles en `src/emails/partials/templates/`.
 *
 * Lee el directorio en disco en tiempo de ejecución, cargando la metadata de cada
 * `schema.json` si existe, o usando el nombre del directorio como fallback.
 */
export function getAvailableArchetypes(rootDir: string = process.cwd()): ArchetypeTemplateInfo[] {
  const templatesDir = resolve(rootDir, "src/emails/partials/templates");
  if (!fs.existsSync(templatesDir)) {
    return [];
  }

  const entries = fs.readdirSync(templatesDir, { withFileTypes: true });
  const archetypes: ArchetypeTemplateInfo[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory() || !isValidTemplateName(entry.name)) {
      continue;
    }

    const dirPath = resolve(templatesDir, entry.name);
    const schemaPath = resolve(dirPath, "schema.json");
    let name = entry.name;
    let description = "Plantilla base modular";
    let category = "General";
    let espVariables: string[] = [];

    if (fs.existsSync(schemaPath)) {
      try {
        const schema = fs.readJsonSync(schemaPath) as ArchetypeSchema;
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
          espVariables = schema.espVariables.filter((v): v is string => typeof v === "string");
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
 */
export function getArchetypeById(
  id: string,
  rootDir: string = process.cwd(),
): ArchetypeTemplateInfo | null {
  if (typeof id !== "string" || !isValidTemplateName(id)) return null;
  const archetypes = getAvailableArchetypes(rootDir);
  return archetypes.find((a) => a.id === id) || null;
}
