/**
 * @file Preview HMR orchestration
 * Handles Vite HMR events for email template live reload.
 */

/**
 * Paths that affect all templates and should refresh the active preview.
 * @type {string[]}
 */
const SHARED_EMAIL_SOURCE_PREFIXES = [
  "src/emails/layouts/",
  "src/emails/partials/",
  "src/emails/styles/",
];

/**
 * Normaliza separadores de ruta a formato POSIX.
 *
 * @param {string} filePath
 * @returns {string}
 */
function normalizePath(filePath) {
  return filePath.replace(/\\/g, "/");
}

/**
 * Determines whether a changed file should refresh the current template preview.
 *
 * @param {string | undefined | null} changedFile
 * @param {string} templateName
 * @returns {boolean}
 */
export function shouldRefreshCurrentTemplate(changedFile, templateName) {
  if (!changedFile || typeof changedFile !== "string") return true;

  const normalized = normalizePath(changedFile);
  const currentTemplatePrefix = `src/emails/templates/${templateName}/`;
  if (normalized.startsWith(currentTemplatePrefix)) return true;

  if (
    normalized === "maizzle.config.js" ||
    normalized === "tailwind.email.config.js" ||
    SHARED_EMAIL_SOURCE_PREFIXES.some((prefix) => normalized.startsWith(prefix))
  ) {
    return true;
  }

  return false;
}

/**
 * Determines whether the changed file is the current template data source.
 *
 * @param {string | undefined | null} changedFile
 * @param {string} templateName
 * @returns {boolean}
 */
export function isCurrentTemplateDataFile(changedFile, templateName) {
  if (!changedFile || typeof changedFile !== "string" || !templateName) {
    return false;
  }

  const normalized = normalizePath(changedFile);
  return normalized === `src/emails/templates/${templateName}/data.json`;
}

/**
 * @typedef {Object} EditorAPI
 * @property {(data: unknown) => void} setInitialData
 * @property {(data: unknown) => void} updateContent
 */

/**
 * @typedef {Object} RenderAPI
 * @property {(templateName: string, data: unknown) => Promise<void>} render
 * @property {(templateName: string) => Promise<void>} invalidateTemplateCache
 */

/**
 * @typedef {Object} ViteHot
 * @property {(event: string, cb: (payload?: { file?: string }) => void | Promise<void>) => void} on
 */

/**
 * @typedef {Object} PreviewHmrDependencies
 * @property {string} templateName
 * @property {ViteHot | null | undefined} [hot]
 * @property {(templateName: string) => Promise<unknown>} fetchLatestData
 * @property {EditorAPI} editorAPI
 * @property {RenderAPI} renderAPI
 * @property {() => Promise<void>} renderCurrentTemplate
 */

/**
 * Sets up HMR event listener for live reloading email preview.
 *
 * @param {PreviewHmrDependencies} dependencies
 * @returns {((payload?: { file?: string }) => Promise<void>) | null} Handler function or null if hot is unavailable
 */
export function setupPreviewHmr(dependencies) {
  const { templateName, hot, fetchLatestData, editorAPI, renderAPI, renderCurrentTemplate } =
    dependencies ?? {};

  if (!hot || typeof hot.on !== "function") {
    return null;
  }

  /**
   * Manejador del evento email-source-changed emitido por Vite.
   *
   * @param {{ file?: string }} [payload]
   * @returns {Promise<void>}
   */
  async function handleEmailSourceChanged(payload = {}) {
    const file = payload?.file;
    if (!shouldRefreshCurrentTemplate(file, templateName)) return;

    if (isCurrentTemplateDataFile(file, templateName)) {
      try {
        const latestData = await fetchLatestData(templateName);
        editorAPI.setInitialData(latestData);
        editorAPI.updateContent(latestData);
        await renderAPI.render(templateName, latestData);
      } catch (error) {
        console.error("Auto data reload error:", error);
      }
      return;
    }

    try {
      await renderAPI.invalidateTemplateCache(templateName);
    } catch (error) {
      console.error("Cache invalidation error:", error);
    }

    try {
      await renderCurrentTemplate();
    } catch (error) {
      console.error("Auto render error:", error);
    }
  }

  hot.on("email-source-changed", handleEmailSourceChanged);

  return handleEmailSourceChanged;
}
