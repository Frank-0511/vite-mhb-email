/**
 * @fileoverview Renderizador de preview para componentes de email.
 *
 * Centraliza la orquestación del render previo con Maizzle y la composición final
 * con Handlebars. Delega las transformaciones puras en `transforms/` y los fixtures
 * de props en `catalog/`. No lee fuera del directorio de parciales validado por `catalog/`.
 */

import { render } from "@maizzle/framework";
import fs from "fs-extra";
import Handlebars from "handlebars";
import { resolve } from "node:path";
import { getEmailComponentFolders } from "../../../shared/index.ts";
import {
  buildHandlebarsData,
  findComponentDir,
  isValidComponentIdentifier,
  listVariantsFromDir,
} from "../catalog/index.ts";
import {
  convertMaizzleConditionals,
  convertMaizzleDelimiters,
  registerConditionHelpers,
  stripPropsScript,
  wrapTableFragment,
} from "../transforms/index.ts";

/**
 * Instancia aislada de Handlebars para el preview: registra los helpers de
 * comparación sin contaminar el Handlebars global que usan build y templates.
 */
const previewHandlebars = registerConditionHelpers(Handlebars.create());

export interface RenderComponentPreviewOptions {
  rootDir: string;
  componentName: string;
  variant: string;
  props?: unknown;
}

/**
 * Compone el documento HTML completo que Maizzle procesará, incluyendo layout
 * de preview y estilos del componente.
 */
function buildPreviewDocument(componentHtmlForLayout: string): string {
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no, url=no" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <style>
    :root {
      color-scheme: light dark;
    }
  </style>
  <style>
    @import "src/emails/styles/tailwind.email.css";
  </style>
</head>
<body class="bg-zinc-100 dark:bg-zinc-900 m-0 p-0">
  <div class="w-full bg-zinc-100 dark:bg-zinc-900">
    <table class="w-full max-w-2xl mx-auto" cellpadding="0" cellspacing="0" role="none">
      <!-- CONTENT (component) -->
      <tr>
        <td class="bg-white dark:bg-zinc-800 px-8 py-10 dark:text-zinc-100">
          ${componentHtmlForLayout}
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
}

/**
 * Busca el archivo de variante dentro del directorio validado, probando
 * primero `<variant>.html` y después `<componentName>-<variant>.html`.
 */
function resolveVariantPath(
  componentDir: string,
  componentName: string,
  variant: string,
): string | null {
  const candidates = [`${variant}.html`, `${componentName}-${variant}.html`];
  for (const name of candidates) {
    if (!isValidComponentIdentifier(name.replace(/\.html$/, ""))) continue;
    const candidate = resolve(componentDir, name);
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

/**
 * Renderiza la preview de un componente y devuelve el HTML final listo para
 * incrustar en un iframe. Lanza `Error` con mensaje estable si la variante no
 * existe o el componente no se encuentra.
 */
export async function renderComponentPreview(
  options: RenderComponentPreviewOptions,
): Promise<string> {
  const { rootDir, componentName, variant } = options;
  const props =
    options.props && typeof options.props === "object"
      ? (options.props as Record<string, unknown>)
      : {};

  if (!isValidComponentIdentifier(componentName)) {
    throw new Error("Invalid component name");
  }
  if (!isValidComponentIdentifier(variant)) {
    throw new Error("Invalid variant");
  }

  const componentDir = findComponentDir(rootDir, componentName);
  if (!componentDir) {
    throw new Error(`Component '${componentName}' not found`);
  }

  const variantPath = resolveVariantPath(componentDir, componentName, variant);
  if (!variantPath) {
    const available = listVariantsFromDir(componentDir);
    throw new Error(`Variant '${variant}' not found. Available: ${available.join(", ") || "none"}`);
  }

  let componentHtml = fs.readFileSync(variantPath, "utf8");
  componentHtml = stripPropsScript(componentHtml);
  componentHtml = convertMaizzleDelimiters(componentHtml);
  componentHtml = convertMaizzleConditionals(componentHtml);
  const previewData = buildHandlebarsData(props);
  // Materializa las props antes de que Maizzle expanda un despachador hacia sus
  // hijos; así los booleanos llegan como atributos reales y no como "{{...}}".
  componentHtml = previewHandlebars.compile(componentHtml)(previewData);
  const layoutHtml = wrapTableFragment(componentHtml);

  const { html: maizzleHtml } = await render(buildPreviewDocument(layoutHtml), {
    useTransformers: true,
    components: {
      folders: getEmailComponentFolders(rootDir),
      tagPrefix: "x-",
    },
    expressions: {
      delimiters: ["[[", "]]"],
      unescapedDelimiters: ["[[[", "]]]"],
    },
  } as Parameters<typeof render>[1]);

  const cleanHtml = convertMaizzleDelimiters(maizzleHtml);
  const template = previewHandlebars.compile(cleanHtml);
  return template(previewData);
}
