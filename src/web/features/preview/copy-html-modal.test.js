// @ts-check
import { describe, expect, test } from "bun:test";

import {
  copyTextToClipboard,
  createCopyHtmlModalController,
  downloadHtml,
  formatDownloadSuccessMessage,
  formatErrorMessage,
  formatLoadingMessage,
  formatSuccessMessage,
  formatValidation,
  initCopyHtmlModal,
  isSafeDownloadTemplateName,
  renderModalState,
} from "./copy-html-modal.js";

describe("copy-html-modal re-exports (contrato público)", () => {
  test("re-exporta todas las funciones de formateo, vista y utilidades", () => {
    expect(typeof formatValidation).toBe("function");
    expect(typeof formatLoadingMessage).toBe("function");
    expect(typeof formatSuccessMessage).toBe("function");
    expect(typeof formatDownloadSuccessMessage).toBe("function");
    expect(typeof downloadHtml).toBe("function");
    expect(typeof isSafeDownloadTemplateName).toBe("function");
    expect(typeof formatErrorMessage).toBe("function");
    expect(typeof copyTextToClipboard).toBe("function");
    expect(typeof renderModalState).toBe("function");
    expect(typeof createCopyHtmlModalController).toBe("function");
    expect(typeof initCopyHtmlModal).toBe("function");
  });
});
