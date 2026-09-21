// @ts-check
/**
 * @fileoverview Orquestador de la transición visual entre skeletons y controles interactivos en preview.
 */

import { initLucideIcons } from "../../../../shared/utils/lucide-setup.js";
import "../../../../shared/components/ef-skeleton.js";

/**
 * Revela los controles interactivos y oculta los skeletons correspondientes
 * una vez que los datos y el renderizado inicial están completados al 100%.
 *
 * @param {Document} [doc] - Objeto Document inyectable para testing.
 * @returns {void}
 */
export function markPreviewReady(
  doc = typeof document !== "undefined" ? document : /** @type {any} */ (null),
) {
  if (!doc) return;

  // 1. Procesar componentes Web Component <ef-skeleton>
  /** @type {NodeListOf<Element> | Element[]} */
  const skeletons = doc.querySelectorAll ? doc.querySelectorAll("ef-skeleton") : [];
  const hasCustomSkeletons = Boolean(skeletons && skeletons.length > 0);

  if (hasCustomSkeletons) {
    for (const skeleton of skeletons) {
      if (typeof (/** @type {any} */ (skeleton).reveal) === "function") {
        /** @type {any} */ (skeleton).reveal(doc);
      } else {
        const forId = skeleton.getAttribute ? skeleton.getAttribute("for") : null;
        const display = skeleton.getAttribute
          ? skeleton.getAttribute("reveal-display") || "block"
          : "block";
        const mode = skeleton.getAttribute
          ? skeleton.getAttribute("reveal-mode") || "hide"
          : "hide";

        if (forId) {
          const target = doc.getElementById(forId);
          if (target) {
            target.classList.remove("hidden");
            if (display !== "block") target.classList.add(display);
          }
        }
        if (mode === "remove" && typeof skeleton.remove === "function") {
          skeleton.remove();
        } else {
          skeleton.classList.add("hidden");
        }
      }
    }
  } else {
    // Fallback de compatibilidad si aún existen skeletons como divs tradicionales
    const fallbackHideIds = [
      "header-left-skeleton",
      "back-btn-skeleton",
      "theme-toggle-skeleton",
      "actions-skeleton",
      "preview-title-skeleton",
      "topbar-skeleton",
      "sync-status-skeleton",
      "copy-html-skeleton",
    ];
    for (const id of fallbackHideIds) {
      const el = doc.getElementById(id);
      if (el) el.classList.add("hidden");
    }

    const fallbackReveals = [
      { id: "header-left-content", display: "flex" },
      { id: "template-name", display: null },
      { id: "btn-back", display: "inline-flex" },
      { id: "app-theme-toggle", display: null },
      { id: "actions-buttons", display: "flex" },
      { id: "preview-title", display: "flex" },
      { id: "topbar-controls", display: "flex" },
      { id: "sync-status", display: "flex" },
      { id: "btn-copy-html", display: "flex" },
    ];
    for (const { id, display } of fallbackReveals) {
      const el = doc.getElementById(id);
      if (el) {
        el.classList.remove("hidden");
        if (display) el.classList.add(display);
      }
    }
  }

  // 2. Excepción 1: template-name-skeleton se elimina del DOM si aún persiste
  const templateNameSkeleton = doc.getElementById("template-name-skeleton");
  if (templateNameSkeleton && typeof templateNameSkeleton.remove === "function") {
    templateNameSkeleton.remove();
  }

  // 3. Excepción 2: Desbloqueo de botones de acción de guardado y descarte
  const saveBtn = /** @type {HTMLButtonElement | null} */ (doc.getElementById("btn-save"));
  const resetBtn = /** @type {HTMLButtonElement | null} */ (doc.getElementById("btn-reset"));
  if (saveBtn) saveBtn.disabled = false;
  if (resetBtn) resetBtn.disabled = false;

  // 4. Refrescar iconos Lucide inyectados solo en entorno con document global
  if (typeof document !== "undefined") {
    initLucideIcons();
  }
}
