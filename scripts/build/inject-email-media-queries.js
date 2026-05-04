#!/usr/bin/env node
import fs from "fs";
import { pathToFileURL } from "node:url";
import path from "path";

const buildDir = path.resolve(process.cwd(), "dist");

/**
 * Inyecta media queries para soporte de dark mode en emails
 * Se ejecuta después del build de Maizzle
 */
function injectEmailMediaQueries() {
  // Validate that dist directory exists
  if (!fs.existsSync(buildDir)) {
    console.error(`❌ Build directory not found: ${buildDir}`);
    console.error("Ensure 'bun run build' has completed successfully before running this step.");
    process.exit(1);
  }
  // Media query minificado para coincidir con CSS minificado
  const mediaQuery =
    "@media (prefers-color-scheme:dark){.icon-light{display:none!important}.icon-dark{display:block!important}}";

  const htmlFiles = findHtmlFiles(buildDir);

  htmlFiles.forEach((filePath) => {
    try {
      const content = fs.readFileSync(filePath, "utf-8");

      // Buscar el cierre de la primera etiqueta <style> para inyectar antes
      const styleCloseTag = content.indexOf("</style>");

      if (styleCloseTag === -1) {
        console.warn(`⚠️  No <style> tag found in ${filePath}`);
        return;
      }

      // Insertar el media query antes del cierre del style
      const newContent =
        content.slice(0, styleCloseTag) + mediaQuery + content.slice(styleCloseTag);

      fs.writeFileSync(filePath, newContent, "utf-8");
      console.log(`✅ Injected media query in ${path.relative(buildDir, filePath)}`);
    } catch (err) {
      console.error(`❌ Error processing ${filePath}:`, err.message);
    }
  });
}

/**
 * Busca todos los archivos HTML en el directorio de build
 */
function findHtmlFiles(dir) {
  const files = [];

  function walkDir(currentPath) {
    try {
      const entries = fs.readdirSync(currentPath);

      entries.forEach((entry) => {
        const fullPath = path.join(currentPath, entry);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          walkDir(fullPath);
        } else if (entry.endsWith(".html")) {
          files.push(fullPath);
        }
      });
    } catch (err) {
      console.error(`Error reading directory ${currentPath}:`, err.message);
    }
  }

  walkDir(dir);
  return files;
}

/**
 * Main execution with error handling
 */
function main() {
  try {
    injectEmailMediaQueries();
    console.log("\n✨ Email media queries injection completed successfully!");
  } catch (err) {
    console.error("\n❌ Fatal error during email media queries injection:", err.message);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}

export { injectEmailMediaQueries };
