/**
 * @fileoverview Funciones de recolección y clasificación de archivos por capa de migración.
 */

import { readdirSync } from "node:fs";
import path from "node:path";

/**
 * Configuración de una capa en el baseline de migración.
 */
export interface LayerConfig {
  name: string;
  targetTask: string;
  baselineJsCount: number;
  patterns?: string[];
}

/**
 * Estructura del archivo baseline de inventario.
 */
export interface BaselineData {
  version: string;
  task: string;
  generatedAt: string;
  description: string;
  layers: Record<string, LayerConfig>;
  totalBaselineJsCount: number;
}

/**
 * Colección de archivos del proyecto clasificados por extensión.
 */
export interface CollectedFiles {
  jsFiles: string[];
  tsFiles: string[];
}

/**
 * Ignora directorios de dependencias, builds y metadatos.
 */
export const IGNORED_DIRECTORIES = new Set<string>([
  "node_modules",
  "dist",
  ".git",
  ".agent",
  ".agents",
  ".claude",
  ".codex",
  ".github",
  ".gemini",
  ".cache",
  ".temp-screenshots",
  ".superpowers",
  "types",
]);

/**
 * Escanea recursivamente el directorio del proyecto recolectando archivos JS, MJS y TS propios.
 */
export function collectProjectFiles(rootDir: string): CollectedFiles {
  const jsFiles: string[] = [];
  const tsFiles: string[] = [];

  function walk(currentDir: string): void {
    const entries = readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      const relativePath = path.relative(rootDir, fullPath).replace(/\\/g, "/");

      if (entry.isDirectory()) {
        if (!IGNORED_DIRECTORIES.has(entry.name)) {
          walk(fullPath);
        }
      } else if (entry.isFile()) {
        if (entry.name.endsWith(".d.ts")) {
          // Excluir archivos de declaración ambiental de tipos
          continue;
        }

        if (entry.name.endsWith(".js") || entry.name.endsWith(".mjs")) {
          jsFiles.push(relativePath);
        } else if (entry.name.endsWith(".ts")) {
          tsFiles.push(relativePath);
        }
      }
    }
  }

  walk(rootDir);
  return { jsFiles, tsFiles };
}

/**
 * Determina si una ruta relativa coincide con los patrones de una capa.
 */
export function matchesLayer(relativePath: string, layerKey: string): boolean {
  switch (layerKey) {
    case "layer-1-core":
      return (
        relativePath.startsWith("scripts/shared/") ||
        relativePath.startsWith("scripts/build/") ||
        relativePath.startsWith("scripts/esp/") ||
        relativePath.startsWith("scripts/validators/") ||
        relativePath.startsWith("src/emails/partials/")
      );

    case "layer-2-cli":
      return (
        relativePath.startsWith("scripts/cli/") ||
        relativePath.startsWith("scripts/export/") ||
        relativePath.startsWith("scripts/generators/") ||
        relativePath.startsWith("scripts/mail/")
      );

    case "layer-3-vite":
      return (
        relativePath.startsWith("scripts/vite/") ||
        relativePath === "vite.config.js" ||
        relativePath === "vite.config.ts"
      );

    case "layer-4-web":
      return relativePath.startsWith("src/web/");

    case "layer-5-tooling":
      return (
        relativePath.startsWith("scripts/ai/") ||
        relativePath.startsWith("scripts/perf/") ||
        relativePath.startsWith("scripts/inventory/") ||
        (relativePath !== "vite.config.js" &&
          relativePath !== "vite.config.ts" &&
          (relativePath.endsWith(".config.js") ||
            relativePath.endsWith(".config.ts") ||
            relativePath.endsWith(".config.mjs")))
      );

    default:
      return false;
  }
}
