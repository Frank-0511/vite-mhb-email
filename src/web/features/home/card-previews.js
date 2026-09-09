/**
 * Carga un preview cuando su tarjeta se aproxima al viewport y oculta su
 * skeleton al terminar la carga.
 *
 * @param {HTMLIFrameElement} iframe
 * @returns {void}
 */
export function loadTemplateCardPreview(iframe) {
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
 * @param {Document | HTMLElement} [root=document]
 * @returns {void}
 */
export function initializeTemplateCardPreviews(root = document) {
  const previews = [...root.querySelectorAll("iframe[data-preview-src]")];
  if (previews.length === 0) return;

  if (typeof IntersectionObserver === "undefined") {
    previews.forEach(loadTemplateCardPreview);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const preview = /** @type {HTMLIFrameElement} */ (entry.target);
        loadTemplateCardPreview(preview);
        observer.unobserve(preview);
      }
    },
    { rootMargin: "300px 0px" },
  );

  previews.forEach((preview) => observer.observe(preview));
}
