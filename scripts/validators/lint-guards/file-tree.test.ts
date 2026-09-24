/**
 * @fileoverview Test del árbol de archivos: límites de tamaño, archivos por carpeta
 * y convenciones de nomenclatura en scripts/ y src/.
 */

import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { basename, join, relative } from "node:path";

const PROJECT_ROOT = join(import.meta.dirname ?? ".", "../../..");
const ROOT_DIRS = ["scripts", "src"];
const EXCLUDED_DIRS = new Set(["node_modules", "dist", ".cache", ".git"]);

/**
 * Excepciones documentadas para archivos existentes que conservan el prefijo de la carpeta
 * padre pero no formaban parte del alcance de renombres en MHB-39 (B1).
 * TODO(mhb-40): Evaluar renombrar estos archivos en una tarea dedicada.
 */
const KNOWN_LEGACY_PREFIX_EXCEPTIONS = new Set([
  "scripts/vite/services/render/render-request-handler.ts",
  "scripts/vite/services/render/render-error.test.ts",
  "scripts/vite/services/render/render-error.ts",
  "scripts/vite/services/render/render-request-handler.test.ts",
  "scripts/inventory/inventory-reporter.ts",
  "scripts/inventory/inventory-parser.ts",
  "scripts/build/build-render-cache-export-transactional.test.ts",
  "scripts/build/build-render-cache-export-marketing.test.ts",
  "scripts/export/export-screenshot.ts",
  "src/web/features/preview/modules/render/render-error-view.ts",
  "src/web/features/preview/modules/render/render-api.test.ts",
  "src/web/features/preview/modules/render/render-error-parser.ts",
  "src/web/features/preview/modules/render/render-api.ts",
  "src/web/features/preview/modules/render/render-error-parser.test.ts",
  "src/web/features/preview/modules/render/render-error-view.test.ts",
  "src/web/features/preview/modules/editor/editor-menu-filter.ts",
  "src/web/features/preview/modules/editor/editor-menu-filter.test.ts",
]);

interface DiscoveredFile {
  relativePath: string;
  absolutePath: string;
  fileName: string;
  dirName: string;
  isTest: boolean;
}

interface DiscoveredDir {
  relativePath: string;
  sourceFiles: string[];
}

function scanTree(): { files: DiscoveredFile[]; directories: DiscoveredDir[] } {
  const files: DiscoveredFile[] = [];
  const directories: DiscoveredDir[] = [];

  function traverse(currentDir: string) {
    const entries = readdirSync(currentDir, { withFileTypes: true });
    const relDir = relative(PROJECT_ROOT, currentDir);
    const sourceFiles: string[] = [];

    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (!EXCLUDED_DIRS.has(entry.name)) {
          traverse(join(currentDir, entry.name));
        }
      } else if (
        entry.isFile() &&
        (entry.name.endsWith(".ts") || entry.name.endsWith(".js") || entry.name.endsWith(".mjs"))
      ) {
        const fullPath = join(currentDir, entry.name);
        const relPath = relative(PROJECT_ROOT, fullPath);
        const isTest =
          entry.name.endsWith(".test.ts") ||
          entry.name.endsWith(".spec.ts") ||
          entry.name.endsWith(".test.js") ||
          entry.name.endsWith(".spec.js");

        files.push({
          relativePath: relPath,
          absolutePath: fullPath,
          fileName: entry.name,
          dirName: basename(currentDir),
          isTest,
        });

        if (!isTest) {
          sourceFiles.push(entry.name);
        }
      }
    }

    directories.push({
      relativePath: relDir,
      sourceFiles,
    });
  }

  for (const root of ROOT_DIRS) {
    traverse(join(PROJECT_ROOT, root));
  }

  return { files, directories };
}

describe("Validación de estructura del árbol de archivos", () => {
  describe("Límites de líneas por archivo", () => {
    test("archivos de producción <= 250 líneas y tests <= 400 líneas", () => {
      const { files } = scanTree();
      const violations: string[] = [];

      for (const file of files) {
        const content = readFileSync(file.absolutePath, "utf-8");
        const lines = content.split("\n").length;
        const limit = file.isTest ? 400 : 250;

        if (lines > limit) {
          violations.push(`${file.relativePath}: ${lines} líneas (límite: ${limit})`);
        }
      }

      expect(violations).toEqual([]);
    });
  });

  describe("Límite de archivos por carpeta", () => {
    test("ningún directorio contiene más de 8 archivos fuente de producción sin subdirectorios", () => {
      const { directories } = scanTree();
      const violations: string[] = [];

      for (const dir of directories) {
        if (dir.sourceFiles.length > 8) {
          violations.push(
            `${dir.relativePath}: ${dir.sourceFiles.length} archivos fuente (${dir.sourceFiles.join(", ")})`,
          );
        }
      }

      expect(violations).toEqual([]);
    });
  });

  describe("Convenciones de nombres", () => {
    test("ningún archivo .ts usa nombres genéricos helpers/utils/etc.", () => {
      const { files } = scanTree();
      const violations: string[] = [];
      const ALLOWED_EXACT = new Set(["index.ts", "main.ts", "types.ts", "constants.ts"]);

      for (const file of files) {
        if (!file.fileName.endsWith(".ts")) continue;
        if (ALLOWED_EXACT.has(file.fileName)) continue;

        const isGeneric =
          file.fileName === "helpers.ts" ||
          file.fileName === "utils.ts" ||
          file.fileName.endsWith("-helper.ts") ||
          file.fileName.endsWith("-utils.ts");

        if (isGeneric) {
          violations.push(`${file.relativePath}: nombre genérico no permitido`);
        }
      }

      expect(violations).toEqual([]);
    });

    test("ningún archivo repite el nombre de la carpeta padre como prefijo sin excepción documentada", () => {
      const { files } = scanTree();
      const violations: string[] = [];

      for (const file of files) {
        const prefix = `${file.dirName}-`;
        if (file.fileName.startsWith(prefix)) {
          if (!KNOWN_LEGACY_PREFIX_EXCEPTIONS.has(file.relativePath)) {
            violations.push(`${file.relativePath}: repite prefijo '${prefix}' de la carpeta padre`);
          }
        }
      }

      expect(violations).toEqual([]);
    });
  });
});
