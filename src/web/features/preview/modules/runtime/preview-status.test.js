// @ts-check
import { describe, expect, test } from "bun:test";
import { createPreviewStatus } from "./preview-status.js";
import { createMockElement } from "./test-helpers.js";

describe("preview-status (controlador de estado visual)", () => {
  test("sync actualiza clase y contenido del indicador con dotColor y texto", () => {
    const syncStatus = createMockElement();
    const status = createPreviewStatus({
      syncStatus,
      espStatus: null,
      renderErrorView: { show: () => {}, clear: () => {} },
    });

    status.sync("Guardado", "text-emerald-600", "bg-emerald-500");

    expect(syncStatus.className).toContain("text-emerald-600");
    expect(syncStatus.innerHTML).toContain("bg-emerald-500");
    expect(syncStatus.innerHTML).toContain("Guardado");
  });

  test("sync preserva la clase hidden si el indicador aún está oculto", () => {
    const syncStatus = createMockElement("hidden");
    const status = createPreviewStatus({
      syncStatus,
      espStatus: null,
      renderErrorView: { show: () => {}, clear: () => {} },
    });

    status.sync("Compilando...", "text-sky-500", "bg-sky-500");

    expect(syncStatus.className).toContain("hidden");
    expect(syncStatus.className).toContain("text-sky-500");
    expect(syncStatus.innerHTML).toContain("Compilando...");
  });

  test("esp resume variables faltantes y expone sus nombres como detalle", () => {
    const espStatus = createMockElement();
    const status = createPreviewStatus({
      syncStatus: createMockElement(),
      espStatus,
      renderErrorView: { show: () => {}, clear: () => {} },
    });

    status.esp({ missing: ["first_name", "cta_url"], unused: [] });

    expect(espStatus.textContent).toBe("⚠️ 2 variables faltantes");
    expect(espStatus.getAttribute("data-details")).toBe("Faltantes: first_name, cta_url");
    expect(espStatus.getAttribute("aria-label")).toBe(
      "2 variables faltantes. Faltantes: first_name, cta_url",
    );
    expect(espStatus.className).toBe("esp-validation-status visible warning");
    expect(espStatus.getAttribute("aria-hidden")).toBe("false");
  });

  test("esp resume claves sin uso como información ámbar y expone el detalle", () => {
    const espStatus = createMockElement();
    const status = createPreviewStatus({
      syncStatus: createMockElement(),
      espStatus,
      renderErrorView: { show: () => {}, clear: () => {} },
    });

    status.esp({ missing: [], unused: ["extra_key", "promo_code"] });

    expect(espStatus.textContent).toBe("ⓘ 2 claves sin usar");
    expect(espStatus.getAttribute("data-details")).toBe("Sin uso: extra_key, promo_code");
    expect(espStatus.getAttribute("aria-label")).toBe(
      "2 claves sin usar. Sin uso: extra_key, promo_code",
    );
    expect(espStatus.className).toBe("esp-validation-status visible info");
    expect(espStatus.getAttribute("aria-hidden")).toBe("false");
  });

  test("esp separa los resúmenes de faltantes y claves sin uso", () => {
    const espStatus = createMockElement();
    const status = createPreviewStatus({
      syncStatus: createMockElement(),
      espStatus,
      renderErrorView: { show: () => {}, clear: () => {} },
    });

    status.esp({ missing: ["first_name"], unused: ["legacy"] });

    expect(espStatus.textContent).toBe("⚠️ 1 variable faltante · ⓘ 1 clave sin usar");
    expect(espStatus.getAttribute("data-details")).toBe("Faltantes: first_name · Sin uso: legacy");
    expect(espStatus.className).toBe("esp-validation-status visible warning");
  });

  test("renderSuccess limpia errores y actualiza el contenido del iframe", () => {
    let clearCalled = false;
    let updatedContent = "";

    const status = createPreviewStatus({
      syncStatus: createMockElement(),
      espStatus: null,
      renderErrorView: {
        clear: () => {
          clearCalled = true;
        },
        show: () => {},
      },
    });

    const mockIframeManager = {
      updateContent: (html) => {
        updatedContent = html;
      },
    };

    status.renderSuccess("<h1>Hola Mundo</h1>", mockIframeManager);

    expect(clearCalled).toBe(true);
    expect(updatedContent).toBe("<h1>Hola Mundo</h1>");
  });

  test("renderError delega el error a renderErrorView.show", () => {
    /** @type {any} */
    let receivedError = null;

    const status = createPreviewStatus({
      syncStatus: createMockElement(),
      espStatus: null,
      renderErrorView: {
        clear: () => {},
        show: (err) => {
          receivedError = err;
        },
      },
    });

    const testError = new Error("Fallo de render");
    status.renderError(testError);

    expect(receivedError).toBe(testError);
  });
});
