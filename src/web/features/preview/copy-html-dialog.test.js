// @ts-check
import { expect, test } from "bun:test";

import { initCopyHtmlDialog } from "./copy-html-dialog.js";

function createElement(props = {}) {
  /** @type {Map<string, () => void>} */
  const listeners = new Map();
  return {
    ...props,
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

test("los botones unificados ejecutan performCopy cuando el modo es copy", async () => {
  const openBtn = createElement();
  const dialog = createElement();
  const buildActionBtn = createElement();
  const existingActionBtn = createElement();
  const modeCopyRadio = createElement({ checked: true });
  const modeDownloadRadio = createElement({ checked: false });
  /** @type {any[]} */
  const calls = [];

  initCopyHtmlDialog({
    templateName: "welcome",
    openBtn,
    dialog,
    buildActionBtn,
    existingActionBtn,
    modeCopyRadio,
    modeDownloadRadio,
    createController: () => ({
      reset() {},
      performCopy: (build) => {
        calls.push({ action: "copy", build });
        return Promise.resolve();
      },
      performDownload: (build) => {
        calls.push({ action: "download", build });
        return Promise.resolve();
      },
    }),
    renderState: () => {},
  });

  buildActionBtn.emit("click");
  await Promise.resolve();
  existingActionBtn.emit("click");
  await Promise.resolve();

  expect(calls).toEqual([
    { action: "copy", build: true },
    { action: "copy", build: false },
  ]);
});

test("los botones unificados ejecutan performDownload cuando el modo es download", async () => {
  const openBtn = createElement();
  const dialog = createElement();
  const buildActionBtn = createElement();
  const existingActionBtn = createElement();
  const modeCopyRadio = createElement({ checked: true });
  const modeDownloadRadio = createElement({ checked: false });
  /** @type {any[]} */
  const calls = [];

  initCopyHtmlDialog({
    templateName: "welcome",
    openBtn,
    dialog,
    buildActionBtn,
    existingActionBtn,
    modeCopyRadio,
    modeDownloadRadio,
    createController: () => ({
      reset() {},
      performCopy: (build) => {
        calls.push({ action: "copy", build });
        return Promise.resolve();
      },
      performDownload: (build) => {
        calls.push({ action: "download", build });
        return Promise.resolve();
      },
    }),
    renderState: () => {},
  });

  // Cambiar a download
  modeCopyRadio.checked = false;
  modeDownloadRadio.checked = true;
  modeDownloadRadio.emit("change");

  buildActionBtn.emit("click");
  await Promise.resolve();
  existingActionBtn.emit("click");
  await Promise.resolve();

  expect(calls).toEqual([
    { action: "download", build: true },
    { action: "download", build: false },
  ]);
});

test("al abrir el modal o cerrarlo se resetea al modo copy", () => {
  const openBtn = createElement();
  const dialog = createElement();
  const modeCopyRadio = createElement({ checked: false });
  const modeDownloadRadio = createElement({ checked: true });
  let lastMode = "";

  initCopyHtmlDialog({
    templateName: "welcome",
    openBtn,
    dialog,
    modeCopyRadio,
    modeDownloadRadio,
    createController: () => ({
      reset() {},
      performCopy: async () => {},
      performDownload: async () => {},
    }),
    renderState: () => {},
    updateExportModeView: (_elements, mode) => {
      lastMode = mode;
    },
  });

  openBtn.emit("click");
  expect(modeCopyRadio.checked).toBe(true);
  expect(modeDownloadRadio.checked).toBe(false);
  expect(lastMode).toBe("copy");

  modeCopyRadio.checked = false;
  modeDownloadRadio.checked = true;
  dialog.emit("close");
  expect(modeCopyRadio.checked).toBe(true);
  expect(lastMode).toBe("copy");
});
