// @ts-check
/**
 * @fileoverview Controlador de pestañas de navegación móvil en la vista de preview.
 * Permite alternar entre la vista previa y el editor en pantallas de columna única (≤ 1259px).
 */

/**
 * Inicializa los controladores de evento y el estado accesible de las pestañas móviles.
 *
 * @param {Document} [doc] - Objeto Document inyectable para testing.
 * @returns {(() => void) | void} Función de limpieza o undefined si no hay documento.
 */
export function initMobileTabs(
  doc = typeof document !== "undefined" ? document : /** @type {any} */ (null),
) {
  if (!doc) return;

  const btnPreview = doc.getElementById("tab-btn-preview");
  const btnEditor = doc.getElementById("tab-btn-editor");
  if (!btnPreview || !btnEditor) return;

  /**
   * @param {"preview" | "editor"} activeTab
   */
  function switchTab(activeTab) {
    const isPreview = activeTab === "preview";

    btnPreview?.classList.toggle("active", isPreview);
    btnPreview?.setAttribute("aria-selected", isPreview ? "true" : "false");

    btnEditor?.classList.toggle("active", !isPreview);
    btnEditor?.setAttribute("aria-selected", !isPreview ? "true" : "false");

    if (doc.body) {
      doc.body.setAttribute("data-mobile-tab", activeTab);
    }
  }

  const onPreviewClick = () => switchTab("preview");
  const onEditorClick = () => switchTab("editor");

  btnPreview.addEventListener("click", onPreviewClick);
  btnEditor.addEventListener("click", onEditorClick);

  // Iniciar por defecto en la pestaña Vista previa en móvil
  if (doc.body && !doc.body.hasAttribute("data-mobile-tab")) {
    doc.body.setAttribute("data-mobile-tab", "preview");
  }

  return () => {
    btnPreview.removeEventListener("click", onPreviewClick);
    btnEditor.removeEventListener("click", onEditorClick);
  };
}
