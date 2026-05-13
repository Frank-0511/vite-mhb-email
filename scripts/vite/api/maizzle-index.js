import { relative, resolve, sep } from "node:path";
import { compileTemplate } from "../services/maizzle-compiler.js";
import { setupCacheApi } from "./cache.js";
import { setupComponentsApi } from "./components.js";
import { setupCopyHtmlApi } from "./copy-html.js";
import { setupDataApi } from "./data.js";
import { setupRenderApi } from "./render.js";
import { setupTemplateApi } from "./templates.js";

// Exportamos compileTemplate por si otro script lo necesita
export { compileTemplate };

const EMAIL_SOURCE_PATHS = [
  "src/emails/templates",
  "src/emails/layouts",
  "src/emails/partials",
  "src/emails/styles",
  "maizzle.config.js",
  "tailwind.email.config.js",
];

/**
 * Normaliza paths a formato POSIX para comparaciones consistentes.
 *
 * @param {string} filePath
 * @returns {string}
 */
function toPosixPath(filePath) {
  return filePath.split(sep).join("/");
}

/**
 * Obtiene un path relativo normalizado para notificaciones de preview.
 *
 * @param {string} rootDir
 * @param {string} filePath
 * @returns {string}
 */
function getEmailRelativePath(rootDir, filePath) {
  return toPosixPath(relative(resolve(rootDir), resolve(filePath)));
}

/**
 * Verifica si un cambio de archivo pertenece a las fuentes de email.
 *
 * @param {string} rootDir
 * @param {string} filePath
 * @returns {boolean}
 */
function isEmailSourceChange(rootDir, filePath) {
  const rootPath = resolve(rootDir);
  const absoluteFile = resolve(filePath);

  if (!absoluteFile.startsWith(rootPath + sep)) return false;

  const relativePath = toPosixPath(relative(rootPath, absoluteFile));
  return EMAIL_SOURCE_PATHS.some(
    (sourcePath) => relativePath === sourcePath || relativePath.startsWith(`${sourcePath}/`),
  );
}

/**
 * Notifica cambios de fuentes de email al cliente de preview.
 *
 * @param {import("vite").ViteDevServer} server
 * @param {string} rootDir
 * @returns {void}
 */
function setupEmailSourceWatcher(server, rootDir) {
  let notifyTimer = null;
  let lastChangedFile = "";

  const watchPaths = EMAIL_SOURCE_PATHS.map((sourcePath) => resolve(rootDir, sourcePath));
  server.watcher.add(watchPaths);

  /**
   * @param {string} filePath
   */
  function scheduleNotify(filePath) {
    if (!filePath || !isEmailSourceChange(rootDir, filePath)) return;

    lastChangedFile = getEmailRelativePath(rootDir, filePath);

    if (notifyTimer) clearTimeout(notifyTimer);
    notifyTimer = setTimeout(() => {
      server.ws.send({
        type: "custom",
        event: "email-source-changed",
        data: { file: lastChangedFile },
      });
      notifyTimer = null;
    }, 80);
  }

  server.watcher.on("add", scheduleNotify);
  server.watcher.on("unlink", scheduleNotify);
}

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
  apply: "serve",
  configureServer(server) {
    // Configurar cada API
    setupDataApi(server, rootDir);
    setupRenderApi(server, rootDir);
    setupComponentsApi(server, rootDir);
    setupTemplateApi(server, rootDir);
    setupCacheApi(server, rootDir);
    setupCopyHtmlApi(server, rootDir);

    setupEmailSourceWatcher(server, rootDir);
  },

  handleHotUpdate({ file, server }) {
    if (!isEmailSourceChange(rootDir, file)) return;

    server.ws.send({
      type: "custom",
      event: "email-source-changed",
      data: { file: getEmailRelativePath(rootDir, file) },
    });

    // Prevent full page reload for email source changes.
    return [];
  },
});
