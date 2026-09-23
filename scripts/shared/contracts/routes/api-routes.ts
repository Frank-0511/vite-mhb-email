/**
 * @fileoverview Generadores de rutas de la API de desarrollo Vite.
 * Módulo hoja aislado: deriva todas las rutas a partir de API_ROUTES.
 */

import { API_ROUTES } from "../constants/api-routes.ts";
import type { Theme } from "../types/theme.ts";

/**
 * Genera la ruta para renderizar un componente específico.
 */
export function componentRenderRoute(componentId: string): string {
  return `${API_ROUTES.COMPONENTS}/${encodeURIComponent(componentId)}/render`;
}

/**
 * Genera la ruta para obtener los detalles de un componente.
 */
export function componentDetailRoute(componentId: string): string {
  return `${API_ROUTES.COMPONENTS}/${encodeURIComponent(componentId)}`;
}

/**
 * Genera la ruta para renderizar un template con tema opcional.
 */
export function renderTemplateRoute(template: string, theme?: Theme): string {
  const base = `${API_ROUTES.RENDER}?template=${encodeURIComponent(template)}`;
  return theme ? `${base}&theme=${encodeURIComponent(theme)}` : base;
}

/**
 * Genera la ruta para invalidar el caché de un template.
 */
export function invalidateCacheRoute(template: string): string {
  return `${API_ROUTES.CACHE_INVALIDATE}?template=${encodeURIComponent(template)}`;
}

/**
 * Genera la ruta para consultar los datos JSON de un template.
 */
export function dataTemplateRoute(template: string): string {
  return `${API_ROUTES.DATA}?template=${encodeURIComponent(template)}`;
}

/**
 * Genera la ruta para copiar el HTML de un template.
 */
export function copyHtmlTemplateRoute(template: string): string {
  return `${API_ROUTES.COPY_HTML}?template=${encodeURIComponent(template)}`;
}
