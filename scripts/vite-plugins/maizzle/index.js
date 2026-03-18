import { setupComponentsApi } from "./api-components.js";
import { setupDataApi } from "./api-data.js";
import { setupRenderApi } from "./api-render.js";
import { setupTemplateApi } from "./api-template.js";
import { compileTemplate } from "./compile.js";

// Exportamos compileTemplate por si otro script lo necesita
export { compileTemplate };

/**
 * Plugin de Vite para procesar plantillas y componentes de email con Maizzle
 * Configura los siguientes endpoints de API:
 * - GET /api/data?template=name - Obtiene datos de una plantilla
 * - POST /api/data?template=name - Guarda datos de una plantilla
 * - POST /api/render?template=name - Renderiza una plantilla con datos
 * - GET /api/components - Lista todos los componentes
 * - GET /api/components/:name - Obtiene el schema de un componente
 * - POST /api/components/:name/render - Renderiza un componente
 * - Cualquier ruta /templates/*.html - Renderiza una plantilla de template
 */
export const maizzlePlugin = (rootDir) => ({
  name: "vite-plugin-maizzle",
  configureServer(server) {
    // Configurar cada API
    setupDataApi(server, rootDir);
    setupRenderApi(server, rootDir);
    setupComponentsApi(server, rootDir);
    setupTemplateApi(server, rootDir);
  },
});
