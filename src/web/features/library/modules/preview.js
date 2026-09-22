// Preview manager module
import { postText } from "../../../shared/utils/http-helpers.js";

const SKELETON_TYPES = new Set(["atoms", "molecules", "organisms", "templates"]);

export const previewManager = {
  iframe: null,
  emptyPreview: null,
  skeleton: null,

  init(iframeEl, emptyPreviewEl, skeletonEl) {
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
  async render(componentId, variant, props, { showLoading = false, type } = {}) {
    if (showLoading) this.showSkeleton(type);

    try {
      const html = await postText(`/api/components/${componentId}/render`, { variant, props });
      this.iframe.srcdoc = html;

      // Adjust iframe height to content
      this.iframe.onload = () => {
        try {
          const iframeDoc = this.iframe.contentDocument || this.iframe.contentWindow.document;
          if (iframeDoc && iframeDoc.body) {
            const contentHeight = iframeDoc.body.scrollHeight;
            this.iframe.style.height = contentHeight + "px";
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

  show() {
    this.emptyPreview.style.display = "none";
    this.iframe.style.display = "block";
  },

  hide() {
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
  showSkeleton(type) {
    if (!this.skeleton) return;
    this.skeleton.dataset.type = SKELETON_TYPES.has(type) ? type : "organisms";
    this.emptyPreview.style.display = "none";
    this.iframe.style.display = "none";
    this.skeleton.style.display = "block";
  },

  hideSkeleton() {
    if (!this.skeleton) return;
    this.skeleton.style.display = "none";
    this.iframe.style.display = "block";
  },
};
