/**
 * @fileoverview Constantes de la feature preview.
 */

export const VIEW_MODE = {
  RENDER: "render",
  SOURCE: "source",
} as const;

export const VIEWPORT_MODE = {
  DESKTOP: "desktop",
  MOBILE: "mobile",
  CUSTOM: "custom",
} as const;

export const MODAL_STATE = {
  IDLE: "idle",
  LOADING: "loading",
  SUCCESS: "success",
  CLIPBOARD_ERROR: "clipboard-error",
  ERROR: "error",
} as const;

export const EXPORT_MODE = {
  COPY: "copy",
  DOWNLOAD: "download",
} as const;
