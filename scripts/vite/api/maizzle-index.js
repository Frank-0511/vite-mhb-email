import { compileTemplate } from "../services/maizzle-compiler.js";
import { setupCacheApi } from "./cache.js";
import { setupComponentsApi } from "./components.js";
import { setupCopyHtmlApi } from "./copy-html.js";
import { setupDataApi } from "./data.js";
import { setupRenderApi } from "./render.js";
import { setupTemplateApi } from "./templates.js";

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
 * - POST /api/cache/invalidate?template=name - Invalida cache de un template
 * - POST /api/cache/clean - Limpia toda la cache
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
    setupCacheApi(server, rootDir);
    setupCopyHtmlApi(server, rootDir);
  },
});
