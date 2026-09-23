/** Carga un preview y revela su contenido cuando el iframe termina. */
export function loadTemplateCardPreview(iframe: HTMLIFrameElement): void {
  const previewSource = iframe.dataset.previewSrc;
  if (!previewSource) return;

  const wrapper = iframe.closest(".preview-wrapper");
  iframe.addEventListener(
    "load",
    () => {
      wrapper?.classList.add("is-preview-loaded");
    },
    { once: true },
  );
  iframe.src = previewSource;
  delete iframe.dataset.previewSrc;
}

/**
 * Inicializa la carga diferida de los previews del catálogo del dashboard.
 * En navegadores sin IntersectionObserver se conserva una carga segura de
 * todos los previews en lugar de dejar tarjetas vacías.
 *
 * @param root - Document or feature root used to find preview iframes.
 */
export function initializeTemplateCardPreviews(root: Document | HTMLElement = document): void {
  const previews = [...root.querySelectorAll<HTMLIFrameElement>("iframe[data-preview-src]")];
  if (previews.length === 0) return;

  if (typeof IntersectionObserver === "undefined") {
    previews.forEach(loadTemplateCardPreview);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const preview = entry.target as HTMLIFrameElement;
        loadTemplateCardPreview(preview);
        observer.unobserve(preview);
      }
    },
    { rootMargin: "300px 0px" },
  );

  previews.forEach((preview) => observer.observe(preview));
}
