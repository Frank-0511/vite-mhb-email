/**
 * @fileoverview Utilidad de descarga segura y aislada de HTML final en el navegador.
 */

/**
 * Patrón seguro para nombres de template (MHB-01): solo minúsculas, números y guiones.
 */
export const SAFE_TEMPLATE_NAME_PATTERN = /^[a-z0-9-]+$/;

/**
 * Valida si un nombre de template es seguro para usar como archivo descargable.
 *
 * @param {unknown} templateName
 * @returns {boolean}
 */
export function isSafeDownloadTemplateName(templateName: unknown): boolean {
  return typeof templateName === "string" && SAFE_TEMPLATE_NAME_PATTERN.test(templateName);
}

/**
 * @typedef {Object} DownloadHtmlOptions
 * @property {string} templateName - Nombre del template ya validado.
 * @property {string} html - Contenido HTML final que será empaquetado en el Blob.
 */
export type DownloadHtmlOptions = {
  templateName: string;
  html: string;
  document?: Pick<Document, "createElement">;
  urlApi?: Pick<typeof URL, "createObjectURL" | "revokeObjectURL">;
  Blob?: typeof Blob;
};

export type DownloadHtmlResult = { ok: true; filename: string } | { ok: false; error: string };

/**
 * Descarga de manera segura un archivo HTML en el navegador usando un Blob y un anchor temporal.
 *
 * @param {DownloadHtmlOptions} options
 * @returns {DownloadHtmlResult}
 */
export function downloadHtml(options: DownloadHtmlOptions): DownloadHtmlResult {
  const { templateName, html } = options;

  const document =
    options && "document" in options
      ? options.document
      : typeof window !== "undefined" && window.document
        ? window.document
        : typeof globalThis !== "undefined" && "document" in globalThis
          ? (globalThis.document as Document)
          : undefined;

  const urlApi =
    options && "urlApi" in options
      ? options.urlApi
      : typeof window !== "undefined" && window.URL
        ? window.URL
        : typeof globalThis !== "undefined" && "URL" in globalThis
          ? globalThis.URL
          : undefined;

  const BlobConstructor =
    options && "Blob" in options
      ? options.Blob
      : typeof window !== "undefined" && window.Blob
        ? window.Blob
        : typeof globalThis !== "undefined" && "Blob" in globalThis
          ? globalThis.Blob
          : undefined;
  if (!isSafeDownloadTemplateName(templateName)) {
    return {
      ok: false,
      error: "Nombre de template inválido o inseguro para descarga.",
    };
  }

  if (typeof html !== "string") {
    return {
      ok: false,
      error: "El contenido HTML a descargar debe ser una cadena de texto.",
    };
  }

  if (
    !document ||
    typeof document.createElement !== "function" ||
    !BlobConstructor ||
    !urlApi ||
    typeof urlApi.createObjectURL !== "function" ||
    typeof urlApi.revokeObjectURL !== "function"
  ) {
    return {
      ok: false,
      error: "El entorno no soporta las capacidades requeridas para descargar archivos.",
    };
  }

  const filename = `${templateName}.html`;
  /** @type {string | undefined} */
  let objectUrl;

  try {
    const blob = new BlobConstructor([html], { type: "text/html;charset=utf-8" });
    objectUrl = urlApi.createObjectURL(blob);

    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = filename;

    if (typeof anchor.click === "function") {
      anchor.click();
    }

    return { ok: true, filename };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error al generar la descarga del archivo HTML.",
    };
  } finally {
    if (objectUrl) {
      urlApi.revokeObjectURL(objectUrl);
    }
  }
}
