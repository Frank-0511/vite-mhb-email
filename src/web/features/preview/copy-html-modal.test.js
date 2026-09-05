// @ts-check
import { describe, expect, test } from "bun:test";

import {
  copyTextToClipboard,
  createCopyHtmlModalController,
  formatErrorMessage,
  formatLoadingMessage,
  formatSuccessMessage,
  formatValidation,
  renderModalState,
} from "./copy-html-modal.js";

describe("copy-html-modal re-exports (contrato público)", () => {
  test("re-exporta todas las funciones de formateo, vista y utilidades", () => {
    expect(typeof formatValidation).toBe("function");
    expect(typeof formatLoadingMessage).toBe("function");
    expect(typeof formatSuccessMessage).toBe("function");
    expect(typeof formatErrorMessage).toBe("function");
    expect(typeof copyTextToClipboard).toBe("function");
    expect(typeof renderModalState).toBe("function");
    expect(typeof createCopyHtmlModalController).toBe("function");
  });
});

describe("createCopyHtmlModalController", () => {
  test("flujo exitoso: build = true envía petición, copia al portapapeles y notifica", async () => {
    const transitions = [];
    const httpCalls = [];
    let clipboardPayload = "";

    const controller = createCopyHtmlModalController({
      templateName: "welcome",
      postJsonFn: (url, body) => {
        httpCalls.push({ url, body });
        return Promise.resolve({
          success: true,
          html: "<html><body>Bienvenido</body></html>",
          validation: { unused: ["extraKey"] },
        });
      },
      copyToClipboard: (text) => {
        clipboardPayload = text;
        return Promise.resolve(true);
      },
      renderState: (state, options) => {
        transitions.push({ state, message: options?.message });
      },
    });

    expect(controller.getState()).toBe("idle");
    expect(controller.getLastHtml()).toBe("");

    await controller.performCopy(true);

    expect(httpCalls).toEqual([
      {
        url: "/api/copy-html?template=welcome",
        body: { build: true },
      },
    ]);
    expect(clipboardPayload).toBe("<html><body>Bienvenido</body></html>");
    expect(controller.getLastHtml()).toBe("<html><body>Bienvenido</body></html>");
    expect(controller.getState()).toBe("success");
    expect(transitions).toEqual([
      { state: "loading", message: "Buildeando template…" },
      {
        state: "success",
        message: "✅ Build completado. HTML copiado al portapapeles. ℹ️ Claves sin uso: extraKey",
      },
    ]);
  });

  test("flujo exitoso: build = false envía build=false y mensaje estándar", async () => {
    const transitions = [];
    const httpCalls = [];

    const controller = createCopyHtmlModalController({
      templateName: "newsletter",
      postJsonFn: (url, body) => {
        httpCalls.push({ url, body });
        return Promise.resolve({
          success: true,
          html: "<html>Contenido previo</html>",
        });
      },
      copyToClipboard: () => Promise.resolve(true),
      renderState: (state, options) => {
        transitions.push({ state, message: options?.message });
      },
    });

    await controller.performCopy(false);

    expect(httpCalls).toEqual([
      {
        url: "/api/copy-html?template=newsletter",
        body: { build: false },
      },
    ]);
    expect(controller.getState()).toBe("success");
    expect(transitions).toEqual([
      { state: "loading", message: "Leyendo HTML…" },
      { state: "success", message: "✅ HTML copiado al portapapeles." },
    ]);
  });

  test("manejo de error devuelto por la API (success: false)", async () => {
    const transitions = [];
    let clipboardAttempted = false;

    const controller = createCopyHtmlModalController({
      templateName: "promo",
      postJsonFn: () =>
        Promise.resolve({
          success: false,
          error: "El template aún no ha sido buildeado",
        }),
      copyToClipboard: () => {
        clipboardAttempted = true;
        return Promise.resolve(true);
      },
      renderState: (state, options) => {
        transitions.push({ state, message: options?.message });
      },
    });

    await controller.performCopy(false);

    expect(clipboardAttempted).toBe(false);
    expect(controller.getState()).toBe("error");
    expect(transitions).toEqual([
      { state: "loading", message: "Leyendo HTML…" },
      {
        state: "error",
        message: "❌ El template aún no ha sido buildeado",
      },
    ]);
  });

  test("manejo de excepción de red o fetch", async () => {
    const transitions = [];

    const controller = createCopyHtmlModalController({
      templateName: "promo",
      postJsonFn: () => Promise.reject(new Error("Network request failed")),
      renderState: (state, options) => {
        transitions.push({ state, message: options?.message });
      },
    });

    await controller.performCopy(true);

    expect(controller.getState()).toBe("error");
    expect(transitions).toEqual([
      { state: "loading", message: "Buildeando template…" },
      { state: "error", message: "❌ Network request failed" },
    ]);
  });

  test("bloqueo de portapapeles pasa a clipboard-error y reintento exitoso recupera el HTML", async () => {
    const transitions = [];
    let clipboardCalls = 0;
    /** @type {(() => void) | undefined} */
    let onRetryCallback;

    const controller = createCopyHtmlModalController({
      templateName: "welcome",
      postJsonFn: () =>
        Promise.resolve({
          success: true,
          html: "<p>Recibido</p>",
        }),
      copyToClipboard: () => {
        clipboardCalls += 1;
        // Primer intento falla, segundo intento (reintento) tiene éxito
        return Promise.resolve(clipboardCalls > 1);
      },
      renderState: (state, options) => {
        transitions.push({ state, message: options?.message });
        if (options?.onRetry) {
          onRetryCallback = options.onRetry;
        }
      },
    });

    await controller.performCopy(true);

    expect(clipboardCalls).toBe(1);
    expect(controller.getState()).toBe("clipboard-error");
    expect(controller.getLastHtml()).toBe("<p>Recibido</p>");
    expect(typeof onRetryCallback).toBe("function");

    // Ejecutar el reintento mediante el callback de la vista
    if (onRetryCallback) {
      onRetryCallback();
    }

    // Esperar microtareas del reintento
    await Promise.resolve();
    await Promise.resolve();

    expect(clipboardCalls).toBe(2);
    expect(controller.getState()).toBe("success");
  });

  test("reintento fallido de portapapeles muestra mensaje de persistencia del bloqueo", async () => {
    let onRetryCallback;

    const controller = createCopyHtmlModalController({
      templateName: "welcome",
      postJsonFn: () =>
        Promise.resolve({
          success: true,
          html: "<p>Recibido</p>",
        }),
      copyToClipboard: () => Promise.resolve(false), // Siempre falla
      renderState: (state, options) => {
        if (options?.onRetry) {
          onRetryCallback = options.onRetry;
        }
      },
    });

    await controller.performCopy(false);

    expect(controller.getState()).toBe("clipboard-error");

    if (onRetryCallback) {
      onRetryCallback();
    }

    await Promise.resolve();
    await Promise.resolve();

    expect(controller.getState()).toBe("error");
  });

  test("reset limpia estado y cache de HTML", async () => {
    const controller = createCopyHtmlModalController({
      templateName: "welcome",
      postJsonFn: () => Promise.resolve({ success: true, html: "data" }),
      copyToClipboard: () => Promise.resolve(true),
    });

    await controller.performCopy(false);
    expect(controller.getState()).toBe("success");
    expect(controller.getLastHtml()).toBe("data");

    controller.reset();
    expect(controller.getState()).toBe("idle");
    expect(controller.getLastHtml()).toBe("");
  });
});
