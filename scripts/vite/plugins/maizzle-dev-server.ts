/**
 * @fileoverview Plugin de desarrollo Vite para Maizzle y orquestador de APIs internas.
 */

import { relative, resolve, sep } from "node:path";
import type { HmrContext, Plugin, ViteDevServer } from "vite";
import { EVENTS } from "../../shared/contracts/constants/events.ts";
import { setupCacheApi } from "../api/cache.ts";
import { setupComponentsApi } from "../api/components.ts";
import { setupCopyHtmlApi } from "../api/copy-html.ts";
import { setupDataApi } from "../api/data.ts";
import { setupRenderApi } from "../api/render.ts";
import { setupTemplateApi } from "../api/templates.ts";

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
 */
function toPosixPath(filePath: string): string {
  return filePath.split(sep).join("/");
}

/**
 * Obtiene un path relativo normalizado para notificaciones de preview.
 */
function getEmailRelativePath(rootDir: string, filePath: string): string {
  return toPosixPath(relative(resolve(rootDir), resolve(filePath)));
}

/**
 * Verifica si un cambio de archivo pertenece a las fuentes de email.
 */
function isEmailSourceChange(rootDir: string, filePath: string): boolean {
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
 */
function setupEmailSourceWatcher(server: ViteDevServer, rootDir: string): void {
  let notifyTimer: ReturnType<typeof setTimeout> | null = null;
  let lastChangedFile = "";

  const watchPaths = EMAIL_SOURCE_PATHS.map((sourcePath) => resolve(rootDir, sourcePath));
  server.watcher.add(watchPaths);

  function scheduleNotify(filePath: string): void {
    if (!filePath || !isEmailSourceChange(rootDir, filePath)) return;

    lastChangedFile = getEmailRelativePath(rootDir, filePath);

    if (notifyTimer) clearTimeout(notifyTimer);
    notifyTimer = setTimeout(() => {
      server.ws.send({
        type: "custom",
        event: EVENTS.EMAIL_SOURCE_CHANGED,
        data: { file: lastChangedFile },
      });
      notifyTimer = null;
    }, 80);
  }

  server.watcher.on("add", scheduleNotify);
  server.watcher.on("change", scheduleNotify);
  server.watcher.on("unlink", scheduleNotify);
}

/**
 * Plugin de Vite para procesar plantillas y componentes de email con Maizzle.
 *
 * @param rootDir Directorio raíz del proyecto.
 * @returns Plugin configurado de Vite.
 */
export const maizzlePlugin = (rootDir: string): Plugin => ({
  name: "vite-plugin-maizzle",
  apply: "serve",
  configureServer(server: ViteDevServer) {
    setupDataApi(server, rootDir);
    setupRenderApi(server, rootDir);
    setupComponentsApi(server, rootDir);
    setupTemplateApi(server, rootDir);
    setupCacheApi(server, rootDir);
    setupCopyHtmlApi(server, rootDir);

    setupEmailSourceWatcher(server, rootDir);
  },

  handleHotUpdate({ file, server }: HmrContext) {
    if (!isEmailSourceChange(rootDir, file)) return;

    server.ws.send({
      type: "custom",
      event: EVENTS.EMAIL_SOURCE_CHANGED,
      data: { file: getEmailRelativePath(rootDir, file) },
    });

    // Prevent full page reload for email source changes.
    return [];
  },
});
