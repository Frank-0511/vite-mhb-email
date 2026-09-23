// Preview manager module
import { componentRenderRoute } from "../../../../../scripts/shared/contracts/routes/api-routes.ts";
import { postText } from "../../../shared/utils/http-helpers.ts";
import { COMPONENT_TYPE } from "../constants.ts";
import { isComponentType } from "../guards.ts";
import type { LibraryComponentType } from "../types.ts";

export const previewManager = {
  iframe: null as HTMLIFrameElement | null,
  emptyPreview: null as HTMLElement | null,
  skeleton: null as HTMLElement | null,

  init(iframeEl: HTMLIFrameElement, emptyPreviewEl: HTMLElement, skeletonEl: HTMLElement): void {
    this.iframe = iframeEl;
    this.emptyPreview = emptyPreviewEl;
    this.skeleton = skeletonEl;
  },

  /**
   * @param {string} componentId
   * @param {string} variant
   * @param {unknown} props
   * @param {{ showLoading?: boolean, type?: "atoms"|"molecules"|"organisms"|"templates"|string }} [options]
   * @returns {Promise<void>}
   */
  async render(
    componentId: string | undefined,
    variant: string,
    props: Record<string, unknown>,
    { showLoading = false, type }: { showLoading?: boolean; type?: LibraryComponentType } = {},
  ): Promise<void> {
    if (!componentId || !this.iframe || !this.emptyPreview) return;
    const iframe = this.iframe;
    if (showLoading) this.showSkeleton(type);

    try {
      const html = await postText(componentRenderRoute(componentId), { variant, props });
      iframe.srcdoc = html;

      // Adjust iframe height to content
      this.iframe.onload = () => {
        try {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          if (iframeDoc && iframeDoc.body) {
            const contentHeight = iframeDoc.body.scrollHeight;
            iframe.style.height = contentHeight + "px";
          }
        } catch (err) {
          console.error("Error measuring iframe content:", err);
        }
      };
    } catch (err) {
      console.error("Error rendering component:", err);
    } finally {
      if (showLoading) this.hideSkeleton();
    }
  },

  show(): void {
    if (!this.emptyPreview || !this.iframe) return;
    this.emptyPreview.style.display = "none";
    this.iframe.style.display = "block";
  },

  hide(): void {
    if (!this.emptyPreview || !this.iframe) return;
    this.emptyPreview.style.display = "flex";
    this.iframe.style.display = "none";
    if (this.skeleton) this.skeleton.style.display = "none";
  },

  /**
   * @param {"atoms"|"molecules"|"organisms"|"templates"|string} [type] - Atomic
   *   design category driving the skeleton shape shown; defaults to
   *   "organisms" when omitted or unrecognized.
   * @returns {void}
   */
  showSkeleton(type?: LibraryComponentType): void {
    if (!this.skeleton || !this.emptyPreview || !this.iframe) return;
    this.skeleton.dataset.type = isComponentType(type) ? type : COMPONENT_TYPE.ORGANISMS;
    this.emptyPreview.style.display = "none";
    this.iframe.style.display = "none";
    this.skeleton.style.display = "block";
  },

  hideSkeleton(): void {
    if (!this.skeleton || !this.iframe) return;
    this.skeleton.style.display = "none";
    this.iframe.style.display = "block";
  },
};
