/**
 * @fileoverview Script de automatización para generar la estructura de nuevos templates de email.
 * Crea una carpeta con un archivo HTML (sintaxis Maizzle) y un JSON de contexto.
 * Soporta creación desde cero o a partir de templates/arquetipos bajo Atomic Design (`src/emails/partials/templates/`).
 */

import fs from "fs-extra";
import path from "node:path";
import { assertValidTemplateName, isValidTemplateName } from "../shared/path-safety.js";
import { getAvailableArchetypes } from "./archetypes.js";

const firstArg = process.argv[2];

if (firstArg === "--list" || firstArg === "-l") {
  const archetypes = getAvailableArchetypes(process.cwd());
  console.log("\n📐 Templates / arquetipos disponibles en src/emails/partials/templates:\n");
  if (archetypes.length === 0) {
    console.log("  (No se encontraron arquetipos)");
  } else {
    for (let i = 0; i < archetypes.length; i++) {
      const a = archetypes[i];
      console.log(`  [${i + 1}] ${a.id} — ${a.name} (${a.category})`);
      console.log(`      ${a.description}`);
    }
  }
  console.log();
  process.exit(0);
}

/**
 * Nombre del template recibido por argumento de línea de comandos.
 * @type {string | undefined}
 */
const name = firstArg;

/**
 * Arquetipo opcional de partials/templates a utilizar como base.
 * @type {string | undefined}
 */
const archetype = process.argv[3];

try {
  assertValidTemplateName(name);
} catch {
  console.error("❌ El nombre del template debe usar solo minúsculas, números y guiones.");
  console.error(
    "   Uso: bun scripts/generators/generate-email.js nombre-del-correo [template-base]",
  );
  console.error("   Ejemplo (desde cero): bun scripts/generators/generate-email.js notificacion");
  console.error(
    "   Ejemplo (con template): bun scripts/generators/generate-email.js bienvenida welcome",
  );
  console.error("   Ver templates disponibles: bun scripts/generators/generate-email.js --list\n");
  process.exit(1);
}

if (archetype && !isValidTemplateName(archetype)) {
  console.error("❌ El nombre del arquetipo debe usar solo minúsculas, números y guiones.");
  process.exit(1);
}

/** @type {string} - Ruta absoluta al directorio del template */
const dir = path.join(process.cwd(), "src/emails/templates", name);

/** @type {string} - Ruta absoluta al archivo index.html */
const htmlFile = path.join(dir, "index.html");

/** @type {string} - Ruta absoluta al archivo data.json */
const jsonFile = path.join(dir, "data.json");

/**
 * Construye el contenido HTML inicial según el arquetipo o desde cero.
 *
 * @param {string} templateName
 * @param {string | undefined} baseArchetype
 * @returns {string}
 */
function buildInitialHtml(templateName, baseArchetype) {
  if (baseArchetype) {
    const archetypeDir = path.join(process.cwd(), "src/emails/partials/templates", baseArchetype);
    if (fs.existsSync(archetypeDir)) {
      return `---
title: "Título para ${templateName}"
previewText: "Descripción breve del email."
titleTemplate: "Nombre de ${templateName}"
---

<x-main>
  <x-${baseArchetype} />
</x-main>
`;
    }
  }

  return `---
title: "Título para ${templateName}"
previewText: "Descripción breve del email."
titleTemplate: "Nombre de ${templateName}"
---

<x-main>
  <h1 class="text-2xl font-bold mb-4 text-zinc-800 dark:text-zinc-100">[[ page.title ]]</h1>
  <p class="text-base text-zinc-800 dark:text-zinc-300">Contenido del template ${templateName}.</p>
</x-main>
`;
}

/**
 * Construye el contenido inicial de data.json a partir del arquetipo si existe.
 *
 * @param {string} templateName
 * @param {string | undefined} baseArchetype
 * @returns {Record<string, unknown>}
 */
function buildInitialData(templateName, baseArchetype) {
  /** @type {Record<string, unknown>} */
  let data = {
    titleTemplate: `Nombre de ${templateName}`,
  };

  if (baseArchetype) {
    const archetypeDataPath = path.join(
      process.cwd(),
      "src/emails/partials/templates",
      baseArchetype,
      "data.json",
    );
    if (fs.existsSync(archetypeDataPath)) {
      try {
        const templateData = fs.readJsonSync(archetypeDataPath);
        data = {
          ...templateData,
          titleTemplate: `Nombre de ${templateName}`,
        };
      } catch {
        // Fallback a objeto base
      }
    }
  }

  return data;
}

/**
 * Crea la estructura física del template (directorio y archivos).
 * Valida si el template ya existe para evitar sobrescritura.
 *
 * @async
 * @returns {Promise<void>}
 */
async function createTemplate() {
  try {
    // Verificar si el directorio ya existe
    const exists = await fs.pathExists(dir);
    if (exists) {
      console.warn(`⚠️ El template "${name}" ya existe.`);
      return;
    }

    const htmlContent = buildInitialHtml(name, archetype);
    const jsonContent = buildInitialData(name, archetype);

    // Crear carpeta y escribir archivos
    await fs.ensureDir(dir);

    await Promise.all([
      fs.writeFile(htmlFile, htmlContent),
      fs.writeJson(jsonFile, jsonContent, { spaces: 2 }),
    ]);

    const modeMsg = archetype ? ` basado en template "${archetype}"` : " desde cero";
    console.log(`✅ Template "${name}" creado con éxito${modeMsg} en src/emails/templates/${name}`);
  } catch (err) {
    /** @type {Error} */
    const error = err;
    console.error("❌ Error al crear el template:", error.message);
  }
}

// Ejecutar proceso
createTemplate();
