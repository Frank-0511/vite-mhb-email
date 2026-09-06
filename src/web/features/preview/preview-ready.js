// @ts-check
/**
 * @fileoverview Orquestador de la transición visual entre skeletons y controles interactivos en preview.
 */

import { initLucideIcons } from "../../shared/utils/lucide-setup.js";

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

  // 1. Cabecera del editor: botón atrás, icono y título del template
  const headerLeftSkeleton = doc.getElementById("header-left-skeleton");
  const headerLeftContent = doc.getElementById("header-left-content");
  const templateNameEl = doc.getElementById("template-name");
  const templateNameSkeleton = doc.getElementById("template-name-skeleton");
  const backBtnSkeleton = doc.getElementById("back-btn-skeleton");
  const backBtn = doc.getElementById("btn-back");

  if (headerLeftSkeleton) headerLeftSkeleton.classList.add("hidden");
  if (headerLeftContent) {
    headerLeftContent.classList.remove("hidden");
    headerLeftContent.classList.add("flex");
  }
  if (templateNameEl) templateNameEl.classList.remove("hidden");
  if (templateNameSkeleton && typeof templateNameSkeleton.remove === "function") {
    templateNameSkeleton.remove();
  }
  if (backBtnSkeleton) backBtnSkeleton.classList.add("hidden");
  if (backBtn) {
    backBtn.classList.remove("hidden");
    backBtn.classList.add("inline-flex");
  }

  // 2. Cabecera del editor: toggle de tema de la app
  const themeToggleSkeleton = doc.getElementById("theme-toggle-skeleton");
  const appThemeToggle = doc.getElementById("app-theme-toggle");
  if (themeToggleSkeleton) themeToggleSkeleton.classList.add("hidden");
  if (appThemeToggle) appThemeToggle.classList.remove("hidden");

  // 3. Acciones del editor (botones guardar y descartar)
  const actionsSkeleton = doc.getElementById("actions-skeleton");
  const actionsButtons = doc.getElementById("actions-buttons");
  const saveBtn = /** @type {HTMLButtonElement | null} */ (doc.getElementById("btn-save"));
  const resetBtn = /** @type {HTMLButtonElement | null} */ (doc.getElementById("btn-reset"));
  if (actionsSkeleton) actionsSkeleton.classList.add("hidden");
  if (actionsButtons) {
    actionsButtons.classList.remove("hidden");
    actionsButtons.classList.add("flex");
  }
  if (saveBtn) saveBtn.disabled = false;
  if (resetBtn) resetBtn.disabled = false;

  // 4. Controles superiores (título de preview, viewport, theme template, estado de sincronización y copiar html)
  const previewTitleSkeleton = doc.getElementById("preview-title-skeleton");
  const previewTitle = doc.getElementById("preview-title");
  const topbarSkeleton = doc.getElementById("topbar-skeleton");
  const topbarControls = doc.getElementById("topbar-controls");
  const syncStatusSkeleton = doc.getElementById("sync-status-skeleton");
  const syncStatus = doc.getElementById("sync-status");
  const copyHtmlSkeleton = doc.getElementById("copy-html-skeleton");
  const copyHtmlBtn = doc.getElementById("btn-copy-html");

  if (previewTitleSkeleton) previewTitleSkeleton.classList.add("hidden");
  if (previewTitle) {
    previewTitle.classList.remove("hidden");
    previewTitle.classList.add("flex");
  }

  if (topbarSkeleton) topbarSkeleton.classList.add("hidden");
  if (topbarControls) {
    topbarControls.classList.remove("hidden");
    topbarControls.classList.add("flex");
  }

  if (syncStatusSkeleton) syncStatusSkeleton.classList.add("hidden");
  if (syncStatus) {
    syncStatus.classList.remove("hidden");
    syncStatus.classList.add("flex");
  }

  if (copyHtmlSkeleton) copyHtmlSkeleton.classList.add("hidden");
  if (copyHtmlBtn) {
    copyHtmlBtn.classList.remove("hidden");
    copyHtmlBtn.classList.add("flex");
  }

  // Refrescar iconos Lucide inyectados
  initLucideIcons();
}
