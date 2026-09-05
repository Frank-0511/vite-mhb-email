import { createRenderRequestHandler } from "../services/render-request-handler.js";

let handler;

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
export function applyPreviewTheme(html, theme) {
  const normalizedTheme = theme === "dark" ? "dark" : "light";

  return html.replace(/<style\b([^>]*)>([\s\S]*?)<\/style>/gi, (_match, attrs, css) => {
    const transformedCss = transformColorSchemeMedia(css, normalizedTheme);
    return `<style${attrs}>${transformedCss}</style>`;
  });
}

/**
 * Maneja la ruta /api/render para POST
 * Con cache en .cache/preview/<template>/rendered.html
 * @param {import("vite").ViteDevServer} server
 * @param {string} rootDir
 */
export function setupRenderApi(server, rootDir) {
  if (!handler) {
    handler = createRenderRequestHandler({
      rootDir,
      applyPreviewTheme,
    });
  }

  server.middlewares.use(handler);
}
