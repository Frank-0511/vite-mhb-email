/**
 * @file Preview HMR orchestration
 * Handles Vite HMR events for email template live reload.
 */

import { EVENTS } from "../../../../../../scripts/shared/contracts/constants/events.ts";

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
function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, "/");
}

/**
 * Determines whether a changed file should refresh the current template preview.
 *
 * @param {string | undefined | null} changedFile
 * @param {string} templateName
 * @returns {boolean}
 */
export function shouldRefreshCurrentTemplate(
  changedFile: string | undefined | null,
  templateName: string,
): boolean {
  if (!changedFile || typeof changedFile !== "string") return true;

  const normalized = normalizePath(changedFile);
  const currentTemplatePrefix = `src/emails/templates/${templateName}/`;
  if (normalized.startsWith(currentTemplatePrefix)) return true;

  if (
    normalized === "maizzle.config.ts" ||
    normalized === "tailwind.email.config.ts" ||
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
export function isCurrentTemplateDataFile(
  changedFile: string | undefined | null,
  templateName: string,
): boolean {
  if (!changedFile || typeof changedFile !== "string" || !templateName) {
    return false;
  }

  const normalized = normalizePath(changedFile);
  return normalized === `src/emails/templates/${templateName}/data.json`;
}

interface EditorAPI {
  setInitialData(data: unknown): void;
  updateContent(data: unknown): void;
}

interface RenderAPI {
  render(templateName: string, data: unknown): Promise<void>;
  invalidateTemplateCache(templateName: string): Promise<void>;
}

interface ViteHot {
  on?(event: string, callback: (payload?: { file?: string }) => void | Promise<void>): void;
}

interface PreviewHmrDependencies {
  templateName?: string;
  hot?: ViteHot | null;
  fetchLatestData?: (templateName: string) => Promise<unknown>;
  editorAPI?: EditorAPI;
  renderAPI?: RenderAPI;
  renderCurrentTemplate?: () => Promise<void>;
}

/**
 * Sets up HMR event listener for live reloading email preview.
 *
 * @param {PreviewHmrDependencies | null | undefined} [dependencies]
 * @returns {((payload?: { file?: string }) => Promise<void>) | null} Handler function or null if hot is unavailable
 */
export function setupPreviewHmr(
  dependencies?: PreviewHmrDependencies | null,
): ((payload?: { file?: string }) => Promise<void>) | null {
  const { templateName, hot, fetchLatestData, editorAPI, renderAPI, renderCurrentTemplate } =
    dependencies ?? {};

  if (!hot || typeof hot.on !== "function") {
    return null;
  }
  if (!templateName || !fetchLatestData || !editorAPI || !renderAPI || !renderCurrentTemplate) {
    return null;
  }
  const activeTemplateName = templateName;
  const activeFetchLatestData = fetchLatestData;
  const activeEditorAPI = editorAPI;
  const activeRenderAPI = renderAPI;
  const activeRenderCurrentTemplate = renderCurrentTemplate;

  /**
   * Manejador del evento email-source-changed emitido por Vite.
   *
   * @param {{ file?: string }} [payload]
   * @returns {Promise<void>}
   */
  async function handleEmailSourceChanged(payload: { file?: string } = {}): Promise<void> {
    const file = payload?.file;
    if (!shouldRefreshCurrentTemplate(file, activeTemplateName)) return;

    if (isCurrentTemplateDataFile(file, activeTemplateName)) {
      try {
        const latestData = await activeFetchLatestData(activeTemplateName);
        activeEditorAPI.setInitialData(latestData);
        activeEditorAPI.updateContent(latestData);
        await activeRenderAPI.render(activeTemplateName, latestData);
      } catch (error) {
        console.error("Auto data reload error:", error);
      }
      return;
    }

    try {
      await activeRenderAPI.invalidateTemplateCache(activeTemplateName);
    } catch (error) {
      console.error("Cache invalidation error:", error);
    }

    try {
      await activeRenderCurrentTemplate();
    } catch (error) {
      console.error("Auto render error:", error);
    }
  }

  hot.on(EVENTS.EMAIL_SOURCE_CHANGED, handleEmailSourceChanged);

  return handleEmailSourceChanged;
}
