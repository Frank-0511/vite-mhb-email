import { describe, expect, test } from "bun:test";

import { createCopyHtmlModalController } from "./controller.ts";
import type { ValidationResult } from "./formatters.ts";
import type { ModalState } from "../../types.ts";
import type { RenderModalStateOptions } from "./view.ts";
import type { DownloadHtmlOptions, DownloadHtmlResult } from "./html-download.ts";

type ApiResponse = {
  success: boolean;
  html?: unknown;
  error?: string;
  template?: string;
  validation?: ValidationResult;
};
type HarnessOverrides = {
  templateName?: string;
  apiResponse?: ApiResponse;
  clipboardResult?: boolean;
  downloadResult?: DownloadHtmlResult;
  postJsonFn?: (url: string, body: { build: boolean }) => Promise<ApiResponse>;
  copyToClipboard?: (text: string) => Promise<boolean>;
  downloadHtmlFn?: (input: DownloadHtmlOptions) => DownloadHtmlResult;
};

/**
 * Crea un controlador con harness de pruebas para capturar llamadas y estados sin boilerplate.
 * @param {{
 *   templateName?: string,
 *   apiResponse?: any,
 *   clipboardResult?: boolean,
 *   downloadResult?: { ok: boolean, filename?: string, error?: string },
 *   postJsonFn?: (url: string, body: { build: boolean }) => Promise<any>,
 *   copyToClipboard?: (text: string) => Promise<boolean>,
 *   downloadHtmlFn?: (input: any) => any,
 * }} [overrides]
 */
function setupHarness(overrides: HarnessOverrides = {}) {
  const httpCalls: Array<{ url: string; body: { build: boolean } }> = [];
  const transitions: Array<{ state: ModalState; message?: string }> = [];
  const clipboard = { text: "", calls: 0 };
  const download: { input: DownloadHtmlOptions | null; calls: number } = { input: null, calls: 0 };
  /** @type {(() => void) | undefined} */
  let onRetryCallback: (() => void) | undefined;

  const controller = createCopyHtmlModalController({
    templateName: overrides.templateName ?? "welcome",
    postJsonFn:
      overrides.postJsonFn ??
      ((url: string, body: { build: boolean }) => {
        httpCalls.push({ url, body });
        return Promise.resolve(
          overrides.apiResponse ?? {
            success: true,
            html: "<html><body>Bienvenido</body></html>",
          },
        );
      }),
    copyToClipboard:
      overrides.copyToClipboard ??
      ((text: string) => {
        clipboard.text = text;
        clipboard.calls += 1;
        return Promise.resolve(overrides.clipboardResult ?? true);
      }),
    downloadHtmlFn:
      overrides.downloadHtmlFn ??
      ((input: DownloadHtmlOptions) => {
        download.input = input;
        download.calls += 1;
        return overrides.downloadResult ?? { ok: true, filename: "welcome.html" };
      }),
    renderState: (state: ModalState, options: RenderModalStateOptions = {}) => {
      transitions.push({ state, message: options?.message });
      if (options?.onRetry) {
        onRetryCallback = options.onRetry;
      }
    },
  });

  return {
    controller,
    httpCalls,
    transitions,
    clipboard,
    download,
    getOnRetry: () => onRetryCallback,
  };
}

describe("createCopyHtmlModalController", () => {
  // --- Flujo de copia al portapapeles ---

  test("flujo exitoso: build = true envía petición, copia al portapapeles y notifica", async () => {
    const { controller, httpCalls, clipboard, transitions } = setupHarness({
      apiResponse: {
        success: true,
        html: "<html><body>Bienvenido</body></html>",
        validation: { unused: ["extraKey"] },
      },
    });

    expect(controller.getState()).toBe("idle");
    expect(controller.getLastHtml()).toBe("");

    await controller.performCopy(true);

    expect(httpCalls).toEqual([{ url: "/api/copy-html?template=welcome", body: { build: true } }]);
    expect(clipboard.text).toBe("<html><body>Bienvenido</body></html>");
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
    const { controller, httpCalls, transitions } = setupHarness({
      templateName: "newsletter",
      apiResponse: { success: true, html: "<html>Contenido previo</html>" },
    });

    await controller.performCopy(false);

    expect(httpCalls).toEqual([
      { url: "/api/copy-html?template=newsletter", body: { build: false } },
    ]);
    expect(controller.getState()).toBe("success");
    expect(transitions).toEqual([
      { state: "loading", message: "Leyendo HTML…" },
      { state: "success", message: "✅ HTML copiado al portapapeles." },
    ]);
  });

  test("manejo de error devuelto por la API (success: false)", async () => {
    const { controller, clipboard, transitions } = setupHarness({
      templateName: "promo",
      apiResponse: { success: false, error: "El template aún no ha sido buildeado" },
    });

    await controller.performCopy(false);

    expect(clipboard.calls).toBe(0);
    expect(controller.getState()).toBe("error");
    expect(transitions).toEqual([
      { state: "loading", message: "Leyendo HTML…" },
      { state: "error", message: "❌ El template aún no ha sido buildeado" },
    ]);
  });

  test("manejo de excepción de red o fetch", async () => {
    const { controller, transitions } = setupHarness({
      templateName: "promo",
      postJsonFn: () => Promise.reject(new Error("Network request failed")),
    });

    await controller.performCopy(true);

    expect(controller.getState()).toBe("error");
    expect(transitions).toEqual([
      { state: "loading", message: "Buildeando template…" },
      { state: "error", message: "❌ Network request failed" },
    ]);
  });

  test("bloqueo de portapapeles pasa a clipboard-error y reintento exitoso recupera el HTML", async () => {
    let calls = 0;
    const { controller, getOnRetry } = setupHarness({
      apiResponse: { success: true, html: "<p>Recibido</p>" },
      copyToClipboard: () => {
        calls += 1;
        return Promise.resolve(calls > 1);
      },
    });

    await controller.performCopy(true);

    expect(calls).toBe(1);
    expect(controller.getState()).toBe("clipboard-error");
    expect(controller.getLastHtml()).toBe("<p>Recibido</p>");

    const onRetry = getOnRetry();
    expect(typeof onRetry).toBe("function");
    onRetry?.();

    await Promise.resolve();
    await Promise.resolve();

    expect(calls).toBe(2);
    expect(controller.getState()).toBe("success");
  });

  test("reintento fallido de portapapeles muestra mensaje de persistencia del bloqueo", async () => {
    const { controller, getOnRetry } = setupHarness({
      apiResponse: { success: true, html: "<p>Recibido</p>" },
      clipboardResult: false,
    });

    await controller.performCopy(false);
    expect(controller.getState()).toBe("clipboard-error");

    getOnRetry()?.();
    await Promise.resolve();
    await Promise.resolve();

    expect(controller.getState()).toBe("error");
  });

  test("reset limpia estado y cache de HTML", async () => {
    const { controller } = setupHarness({
      apiResponse: { success: true, html: "data" },
    });

    await controller.performCopy(false);
    expect(controller.getState()).toBe("success");
    expect(controller.getLastHtml()).toBe("data");

    controller.reset();
    expect(controller.getState()).toBe("idle");
    expect(controller.getLastHtml()).toBe("");
  });

  // --- Flujo de descarga de HTML ---

  test("descarga el HTML de build usando el template inicial y el body exacto", async () => {
    const { controller, httpCalls, download, transitions } = setupHarness({
      apiResponse: {
        success: true,
        template: "untrusted-attacker-name", // Debe ser ignorado
        html: "<p>final</p>",
        validation: { unused: ["legacy"] },
      },
    });

    await controller.performDownload(true);

    expect(httpCalls).toEqual([{ url: "/api/copy-html?template=welcome", body: { build: true } }]);
    expect(download.input).toEqual({ templateName: "welcome", html: "<p>final</p>" });
    expect(controller.getState()).toBe("success");
    expect(transitions).toEqual([
      { state: "loading", message: "Buildeando template…" },
      {
        state: "success",
        message: "✅ Build completado. HTML descargado. ℹ️ Claves sin uso: legacy",
      },
    ]);
  });

  test("descarga el HTML existente usando build: false", async () => {
    const { controller, httpCalls, download, transitions } = setupHarness({
      templateName: "newsletter",
      apiResponse: { success: true, html: "<p>existente</p>" },
      downloadResult: { ok: true, filename: "newsletter.html" },
    });

    await controller.performDownload(false);

    expect(httpCalls).toEqual([
      { url: "/api/copy-html?template=newsletter", body: { build: false } },
    ]);
    expect(download.input).toEqual({ templateName: "newsletter", html: "<p>existente</p>" });
    expect(controller.getState()).toBe("success");
    expect(transitions).toEqual([
      { state: "loading", message: "Leyendo HTML…" },
      { state: "success", message: "✅ HTML descargado." },
    ]);
  });

  test("manejo de error devuelto por la API durante descarga (success: false)", async () => {
    const { controller, download, transitions } = setupHarness({
      apiResponse: { success: false, error: "El template aún no ha sido buildeado" },
    });

    await controller.performDownload(false);

    expect(download.calls).toBe(0);
    expect(controller.getState()).toBe("error");
    expect(transitions).toEqual([
      { state: "loading", message: "Leyendo HTML…" },
      { state: "error", message: "❌ El template aún no ha sido buildeado" },
    ]);
  });

  test("manejo de respuesta con html no string o ausente durante descarga", async () => {
    const { controller, download, transitions } = setupHarness({
      apiResponse: { success: true, html: 123 },
    });

    await controller.performDownload(true);

    expect(download.calls).toBe(0);
    expect(controller.getState()).toBe("error");
    expect(transitions[1]?.state).toBe("error");
  });

  test("manejo de fallo devuelto por downloadHtmlFn ({ ok: false, error: ... })", async () => {
    const { controller, transitions } = setupHarness({
      apiResponse: { success: true, html: "<p>final</p>" },
      downloadResult: { ok: false, error: "Nombre de template inseguro" },
    });

    await controller.performDownload(true);

    expect(controller.getState()).toBe("error");
    expect(transitions).toEqual([
      { state: "loading", message: "Buildeando template…" },
      { state: "error", message: "❌ Nombre de template inseguro" },
    ]);
  });

  test("manejo de excepción de red durante descarga", async () => {
    const { controller, download, transitions } = setupHarness({
      postJsonFn: () => Promise.reject(new Error("Conexión rechazada")),
    });

    await controller.performDownload(true);

    expect(download.calls).toBe(0);
    expect(controller.getState()).toBe("error");
    expect(transitions).toEqual([
      { state: "loading", message: "Buildeando template…" },
      { state: "error", message: "❌ Conexión rechazada" },
    ]);
  });
});
