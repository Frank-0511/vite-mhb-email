// @ts-check
/**
 * @fileoverview Mantiene el <details> "más opciones" del editor abierto por
 * defecto en pantallas ≥480px (donde su contenido se muestra inline, sin
 * comportamiento de desplegable) y cerrado en pantallas más pequeñas, donde
 * sí actúa como un menú real que el usuario abre con un tap.
 *
 * Un <details> cerrado colapsa su propia caja a 0x0 de forma nativa sin
 * importar el "display" que se le fuerce por CSS a sus hijos, así que el
 * contenido (el toggle de tema) desaparece visualmente si el atributo
 * "open" no está presente.
 */

const NARROW_VIEWPORT_QUERY = "(max-width: 479px)";

/**
 * Configura el comportamiento responsivo y cierre exterior del menú de más opciones.
 *
 * @param {Document} [doc] - Objeto Document inyectable.
 * @param {Window} [win] - Objeto Window inyectable.
 * @returns {void}
 */
export function setupMoreMenu(
  doc = typeof document !== "undefined" ? document : /** @type {any} */ (null),
  win = typeof window !== "undefined" ? window : /** @type {any} */ (null),
) {
  if (!doc) return;
  const details = doc.getElementById("editor-more-menu");
  if (!details) return;

  if (win && typeof win.matchMedia === "function") {
    const narrowQuery = win.matchMedia(NARROW_VIEWPORT_QUERY);

    /**
     * @returns {void}
     */
    function syncOpenState() {
      if (narrowQuery.matches) {
        details.removeAttribute("open");
      } else {
        details.setAttribute("open", "");
      }
    }

    syncOpenState();
    narrowQuery.addEventListener("change", syncOpenState);
  }

  // Cerrar menú desplegable ⋯ al hacer click fuera (solo aplica en
  // <480px: en ese ancho el menú es un desplegable real. En ≥480px
  // permanece "open" siempre a propósito — ahí no es un desplegable,
  // es cómo se muestra el toggle de tema directamente en el header).
  doc.addEventListener("click", (e) => {
    if (
      details.hasAttribute("open") &&
      win &&
      typeof win.matchMedia === "function" &&
      win.matchMedia(NARROW_VIEWPORT_QUERY).matches &&
      e.target &&
      !details.contains(/** @type {Node} */ (e.target))
    ) {
      details.removeAttribute("open");
    }
  });
}
