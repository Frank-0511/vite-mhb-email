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
  doc: Document | null = typeof document !== "undefined" ? document : null,
): (() => void) | undefined {
  if (!doc) return;
  const activeDocument = doc;

  const btnPreview = activeDocument.getElementById("tab-btn-preview");
  const btnEditor = activeDocument.getElementById("tab-btn-editor");
  if (!btnPreview || !btnEditor) return;

  /**
   * @param {"preview" | "editor"} activeTab
   */
  function switchTab(activeTab: "preview" | "editor"): void {
    const isPreview = activeTab === "preview";

    btnPreview?.classList.toggle("active", isPreview);
    btnPreview?.setAttribute("aria-selected", isPreview ? "true" : "false");

    btnEditor?.classList.toggle("active", !isPreview);
    btnEditor?.setAttribute("aria-selected", !isPreview ? "true" : "false");

    if (activeDocument.body) {
      activeDocument.body.setAttribute("data-mobile-tab", activeTab);
    }
  }

  const onPreviewClick = () => switchTab("preview");
  const onEditorClick = () => switchTab("editor");

  btnPreview.addEventListener("click", onPreviewClick);
  btnEditor.addEventListener("click", onEditorClick);

  // Iniciar por defecto en la pestaña Vista previa en móvil
  if (activeDocument.body && !activeDocument.body.hasAttribute("data-mobile-tab")) {
    activeDocument.body.setAttribute("data-mobile-tab", "preview");
  }

  return () => {
    btnPreview.removeEventListener("click", onPreviewClick);
    btnEditor.removeEventListener("click", onEditorClick);
  };
}
