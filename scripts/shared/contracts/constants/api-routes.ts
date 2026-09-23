/**
 * @fileoverview Constantes de rutas y cabeceras de API de desarrollo.
 * Módulo hoja aislado: sin dependencias ni imports ascendentes.
 */

export const API_ROUTES = {
  PREFIX: "/api/",
  DATA: "/api/data",
  RENDER: "/api/render",
  COPY_HTML: "/api/copy-html",
  CACHE: "/api/cache",
  CACHE_INVALIDATE: "/api/cache/invalidate",
  CACHE_CLEAN: "/api/cache/clean",
  COMPONENTS: "/api/components",
  TEMPLATE_SIZES: "/api/template-sizes",
} as const;

export const HEADER_X_ESP_VALIDATION = "X-ESP-Validation";
