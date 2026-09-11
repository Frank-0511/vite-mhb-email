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
 * @returns {void}
 */
export function setupMoreMenu() {
  const details = document.getElementById("editor-more-menu");
  if (!(details instanceof HTMLDetailsElement)) return;

  const narrowQuery = window.matchMedia(NARROW_VIEWPORT_QUERY);

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
