// @ts-check
import { expect, test } from "bun:test";

import { initCopyHtmlDialog } from "./copy-html-dialog.js";

function createElement() {
  /** @type {Map<string, () => void>} */
  const listeners = new Map();
  return {
    addEventListener(event, listener) {
      listeners.set(event, listener);
    },
    emit(event) {
      listeners.get(event)?.({ target: this });
    },
    showModal() {},
    close() {},
  };
}

test("el diálogo conecta la descarga existente con el controlador inyectado", async () => {
  const openBtn = createElement();
  const dialog = createElement();
  const downloadExistingBtn = createElement();
  let downloaded = false;

  initCopyHtmlDialog({
    templateName: "welcome",
    openBtn,
    dialog,
    downloadExistingBtn,
    createController: () => ({
      reset() {},
      performCopy: async () => {},
      performDownload: (build) => {
        downloaded = build === false;
        return Promise.resolve();
      },
    }),
    renderState: () => {},
  });

  downloadExistingBtn.emit("click");
  await Promise.resolve();
  expect(downloaded).toBe(true);
});
