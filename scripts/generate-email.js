/**
 * @fileoverview Script de automatización para generar la estructura de nuevos templates de email.
 * Crea una carpeta con un archivo HTML (sintaxis Maizzle) y un JSON de contexto.
 */

import fs from "fs-extra";
import path from "path";

/**
 * Nombre del template recibido por argumento de línea de comandos.
 * @type {string | undefined}
 */
const name = process.argv[2];

if (!name) {
  console.error(
    "❌ Por favor, indica el nombre del template: yarn g:email nombre-del-correo",
  );
  process.exit(1);
}

/** @type {string} - Ruta absoluta al directorio del template */
const dir = path.join(process.cwd(), "src/templates", name);

/** @type {string} - Ruta absoluta al archivo index.html */
const htmlFile = path.join(dir, "index.html");

/** @type {string} - Ruta absoluta al archivo data.json */
const jsonFile = path.join(dir, "data.json");

/** * Contenido base para el archivo HTML utilizando componentes de Maizzle.
 * @type {string}
 */
const htmlContent = `---
title: "Título para ${name}"
previewText: "Descripción breve del email."
titleTemplate: "Nombre de ${name}"
---
<x-main>
  <h1>[[ page.title ]]</h1>
  <p>Contenido del template ${name}.</p>
</x-main>`;

/** * Objeto de configuración inicial para el contexto del template.
 * @typedef {Object} TemplateConfig
 * @property {string} titleTemplate - Nombre descriptivo del template.
 */

/** @type {TemplateConfig} */
const jsonContent = {
  titleTemplate: `Nombre de ${name}`,
};

/**
 * Crea la estructura física del template (directorio y archivos).
 * Valida si el template ya existe para evitar sobrescritura.
 * * @async
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

    // Crear carpeta y escribir archivos
    await fs.ensureDir(dir);

    await Promise.all([
      fs.writeFile(htmlFile, htmlContent),
      fs.writeJson(jsonFile, jsonContent, { spaces: 2 }),
    ]);

    console.log(
      `✅ Template "${name}" creado con éxito en src/templates/${name}`,
    );
  } catch (err) {
    /** @type {Error} */
    const error = err;
    console.error("❌ Error al crear el template:", error.message);
  }
}

// Ejecutar proceso
createTemplate();
