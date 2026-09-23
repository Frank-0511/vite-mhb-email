/**
 * @fileoverview Web Component nativo <ef-skeleton> (Light DOM).
 *
 * Proporciona un contenedor semántico y declarativo para estados de carga tipo skeleton.
 * Al completarse la carga, oculta o elimina el skeleton y revela el elemento interactivo
 * asociado vía el atributo `for`.
 *
 * RESTricción DE ARQUITECTURA:
 * Opera estrictamente en Light DOM (sin Shadow DOM) para permitir que los estilos globales
 * de Tailwind CSS (animate-pulse, bg-slate-200) estilicen el contenido interno y para no
 * encapsular los IDs consumidos por scripts, pruebas y accesibilidad.
 */

const BaseElement = (
  typeof HTMLElement === "undefined" ? class {} : HTMLElement
) as typeof HTMLElement;

/**
 * @class EfSkeleton
 * @extends {BaseElement}
 */
export class EfSkeleton extends BaseElement {
  reveal(doc?: Document): void {
    const documentObj =
      doc ||
      (this.ownerDocument ? this.ownerDocument : typeof document !== "undefined" ? document : null);

    const targetId = this.getAttribute("for");
    const revealDisplay = this.getAttribute("reveal-display") || "block";
    const revealMode = this.getAttribute("reveal-mode") || "hide";

    // 1. Revelar el elemento objetivo si está declarado
    if (targetId && documentObj) {
      const target = documentObj.getElementById(targetId);
      if (target) {
        target.classList.remove("hidden");
        if (revealDisplay !== "block") {
          target.classList.add(revealDisplay);
        }
      }
    }

    // 2. Ocultar o remover el propio skeleton
    if (revealMode === "remove") {
      if (typeof this.remove === "function") {
        this.remove();
      } else if (this.parentNode) {
        this.parentNode.removeChild(this);
      }
    } else {
      this.classList.add("hidden");
    }
  }
}

// Registro global del custom element
if (typeof customElements !== "undefined" && !customElements.get("ef-skeleton")) {
  customElements.define("ef-skeleton", EfSkeleton);
}
