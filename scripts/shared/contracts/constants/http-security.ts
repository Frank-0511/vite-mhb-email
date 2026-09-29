/**
 * @fileoverview Constantes de seguridad HTTP para la API local de desarrollo.
 * Módulo hoja aislado: sin dependencias ni imports ascendentes.
 */

export const HTTP_WRITE_METHODS = ["POST", "PUT", "PATCH", "DELETE"] as const;

export const HEADER_SEC_FETCH_SITE = "sec-fetch-site";
export const HEADER_ORIGIN = "origin";
export const HEADER_CONTENT_TYPE = "content-type";

/** Valores de Sec-Fetch-Site que indican petición del propio dashboard. */
export const SEC_FETCH_SITE_TRUSTED = ["same-origin", "none"] as const;

export const CONTENT_TYPE_JSON = "application/json";
