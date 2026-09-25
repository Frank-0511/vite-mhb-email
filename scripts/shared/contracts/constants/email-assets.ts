/**
 * @fileoverview Allowlist de hosts permitidos para imágenes de email (MHB-44).
 * Módulo hoja aislado: sin dependencias ni imports ascendentes.
 *
 * Gmail y Outlook de escritorio no renderizan <img src> relativos ni SVG, y
 * depender de un host de terceros sin SLA (p. ej. api.iconify.design) rompe
 * el correo en producción. Para adoptar un CDN propio, agregar su host aquí
 * y actualizar la URL base del componente que arma los `src` de imagen.
 */
export const EMAIL_IMAGE_HOST_ALLOWLIST = ["cdn.jsdelivr.net"] as const;

/** Bytes máximos por bloque `<style>` antes de que Gmail lo descarte completo. */
export const EMAIL_STYLE_BLOCK_MAX_BYTES = 8192;
