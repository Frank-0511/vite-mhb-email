// Preview manager module
export const previewManager = {
  iframe: null,
  emptyPreview: null,

  init(iframeEl, emptyPreviewEl) {
    this.iframe = iframeEl;
    this.emptyPreview = emptyPreviewEl;
  },

  async render(componentId, variant, props) {
    try {
      const response = await fetch(`/api/components/${componentId}/render`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variant, props }),
      });

      const html = await response.text();
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
    }
  },

  show() {
    this.emptyPreview.style.display = "none";
    this.iframe.style.display = "block";
  },

  hide() {
    this.emptyPreview.style.display = "flex";
    this.iframe.style.display = "none";
  },
};
