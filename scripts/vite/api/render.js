import fs from "fs-extra";
import { relative, resolve, sep } from "node:path";
import { compileTemplate } from "../services/maizzle-compiler.js";
import { createPreviewCacheManager, createPreviewDataHash } from "../services/preview-cache.js";

let cacheManager;
const TEMPLATE_NAME_PATTERN = /^[a-z0-9-]+$/;

/**
 * Encuentra la llave de cierre correspondiente a una llave de apertura.
 *
 * @param {string} css
 * @param {number} openBraceIndex
 * @returns {number}
 */
function findMatchingBrace(css, openBraceIndex) {
  let depth = 0;

  for (let index = openBraceIndex; index < css.length; index += 1) {
    if (css[index] === "{") depth += 1;
    if (css[index] === "}") depth -= 1;
    if (depth === 0) return index;
  }

  return -1;
}

/**
 * Fuerza el tema de preview transformando reglas `prefers-color-scheme: dark`.
 *
 * En `dark`, elimina el wrapper @media para que sus reglas apliquen siempre.
 * En `light`, elimina esas reglas para evitar que el SO del navegador fuerce dark.
 *
 * @param {string} css
 * @param {"light" | "dark"} theme
 * @returns {string}
 */
function transformColorSchemeMedia(css, theme) {
  const mediaPattern = /^@media\s*\(\s*prefers-color-scheme\s*:\s*dark\s*\)\s*\{/;
  let output = "";
  let index = 0;

  while (index < css.length) {
    const remaining = css.slice(index);
    const match = remaining.match(mediaPattern);

    if (!match) {
      output += css[index];
      index += 1;
      continue;
    }

    const openBraceIndex = index + match[0].lastIndexOf("{");
    const closeBraceIndex = findMatchingBrace(css, openBraceIndex);

    if (closeBraceIndex === -1) {
      output += css[index];
      index += 1;
      continue;
    }

    const innerCss = css.slice(openBraceIndex + 1, closeBraceIndex);

    if (theme === "dark") {
      output += transformColorSchemeMedia(innerCss, theme);
    }

    index = closeBraceIndex + 1;
  }

  return output;
}

/**
 * Aplica el tema de preview sobre el HTML renderizado sin modificar fuentes.
 *
 * @param {string} html
 * @param {string} theme
 * @returns {string}
 */
function applyPreviewTheme(html, theme) {
  const normalizedTheme = theme === "dark" ? "dark" : "light";

  return html.replace(/<style\b([^>]*)>([\s\S]*?)<\/style>/gi, (_match, attrs, css) => {
    const transformedCss = transformColorSchemeMedia(css, normalizedTheme);
    return `<style${attrs}>${transformedCss}</style>`;
  });
}

/**
 * Verifica que un nombre de template sea seguro y usable en rutas.
 *
 * @param {string} templateName
 * @returns {boolean}
 */
function isValidTemplateName(templateName) {
  return TEMPLATE_NAME_PATTERN.test(templateName);
}

/**
 * Verifica que `candidatePath` quede contenido dentro de `basePath`.
 *
 * @param {string} basePath
 * @param {string} candidatePath
 * @returns {boolean}
 */
function isPathInside(basePath, candidatePath) {
  const relPath = relative(basePath, candidatePath);
  return relPath !== "" && !relPath.startsWith(`..${sep}`) && relPath !== "..";
}

/**
 * Maneja la ruta /api/render para POST
 * Con cache en .cache/preview/<template>/rendered.html
 */
export function setupRenderApi(server, rootDir) {
  // Inicializar cache manager solo una vez
  if (!cacheManager) {
    cacheManager = createPreviewCacheManager(rootDir);
  }

  server.middlewares.use((req, res, next) => {
    if (!req.url?.startsWith("/api/render")) {
      return next();
    }

    const url = new URL(req.url, `http://${req.headers.host}`);
    const templateName = url.searchParams.get("template");
    const theme = url.searchParams.get("theme") === "dark" ? "dark" : "light";

    if (req.method === "POST" && templateName) {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });
      req.on("end", async () => {
        try {
          if (!isValidTemplateName(templateName)) {
            res.statusCode = 400;
            return res.end("Invalid template name");
          }

          const templatesRoot = resolve(rootDir, "src/emails/templates");
          const filePath = resolve(templatesRoot, templateName, "index.html");
          if (!isPathInside(templatesRoot, filePath)) {
            res.statusCode = 400;
            return res.end("Invalid template path");
          }

          const data = JSON.parse(body);
          const dataHash = createPreviewDataHash(data);
          if (!fs.existsSync(filePath)) {
            res.statusCode = 404;
            return res.end("Template not found");
          }

          let finalHtml;

          // Verificar si hay cache válida para fuentes + datos + tema
          if (cacheManager.isCacheValid(templateName, { theme, dataHash })) {
            finalHtml = await cacheManager.readFromCache(templateName);
            console.log(`[maizzle] Using cached render for ${templateName} (${theme})`);
          } else {
            // Compilar template
            const compiledHtml = await compileTemplate(filePath, data, rootDir);
            finalHtml = applyPreviewTheme(compiledHtml, theme);
            // Guardar en cache
            await cacheManager.saveToCache(templateName, finalHtml, { theme, dataHash });
            console.log(`[maizzle] Compiled and cached ${templateName} (${theme})`);
          }

          res.setHeader("Content-Type", "text/html");
          res.end(finalHtml);
        } catch (err) {
          console.error("[maizzle] API Render Error:", err.message);
          res.statusCode = 500;
          res.end(err.message);
        }
      });
      return;
    }

    return next();
  });
}
