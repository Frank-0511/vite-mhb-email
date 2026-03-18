#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const buildDir = path.join(__dirname, "../dist");

/**
 * Inyecta media queries para soporte de dark mode en emails
 * Se ejecuta después del build de Maizzle
 */
function injectEmailMediaQueries() {
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

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  injectEmailMediaQueries();
}

export { injectEmailMediaQueries };
