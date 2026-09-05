import { describe, expect, spyOn, test } from "bun:test";

import {
  isCurrentTemplateDataFile,
  setupPreviewHmr,
  shouldRefreshCurrentTemplate,
} from "./preview-hmr.js";

describe("shouldRefreshCurrentTemplate", () => {
  test("refresca si el archivo modificado pertenece al template actual", () => {
    expect(
      shouldRefreshCurrentTemplate("src/emails/templates/welcome/template.html", "welcome"),
    ).toBe(true);
    expect(shouldRefreshCurrentTemplate("src/emails/templates/welcome/data.json", "welcome")).toBe(
      true,
    );
    expect(
      shouldRefreshCurrentTemplate("src/emails/templates/welcome/nested/file.html", "welcome"),
    ).toBe(true);
  });

  test("refresca ante fuentes compartidas y configuraciones de Maizzle/Tailwind", () => {
    expect(shouldRefreshCurrentTemplate("src/emails/layouts/base.html", "welcome")).toBe(true);
    expect(shouldRefreshCurrentTemplate("src/emails/partials/hero/hero.html", "welcome")).toBe(
      true,
    );
    expect(shouldRefreshCurrentTemplate("src/emails/styles/main.css", "welcome")).toBe(true);
    expect(shouldRefreshCurrentTemplate("maizzle.config.js", "welcome")).toBe(true);
    expect(shouldRefreshCurrentTemplate("tailwind.email.config.js", "welcome")).toBe(true);
  });

  test("no refresca ante archivos de otro template", () => {
    expect(
      shouldRefreshCurrentTemplate("src/emails/templates/newsletter/template.html", "welcome"),
    ).toBe(false);
    expect(
      shouldRefreshCurrentTemplate("src/emails/templates/newsletter/data.json", "welcome"),
    ).toBe(false);
    expect(
      shouldRefreshCurrentTemplate("src/emails/templates/welcome-variant/template.html", "welcome"),
    ).toBe(false);
  });

  test("no refresca ante fuentes irrelevantes fuera del scope de email", () => {
    expect(shouldRefreshCurrentTemplate("src/web/features/preview/main.js", "welcome")).toBe(false);
    expect(shouldRefreshCurrentTemplate("package.json", "welcome")).toBe(false);
    expect(shouldRefreshCurrentTemplate("README.md", "welcome")).toBe(false);
  });

  test("refresca cuando no hay archivo especificado (fallback seguro)", () => {
    expect(shouldRefreshCurrentTemplate(undefined, "welcome")).toBe(true);
    expect(shouldRefreshCurrentTemplate("", "welcome")).toBe(true);
  });

  test("soporta rutas con separadores de Windows", () => {
    expect(
      shouldRefreshCurrentTemplate("src\\emails\\templates\\welcome\\template.html", "welcome"),
    ).toBe(true);
    expect(shouldRefreshCurrentTemplate("src\\emails\\layouts\\base.html", "welcome")).toBe(true);
    expect(
      shouldRefreshCurrentTemplate("src\\emails\\templates\\newsletter\\template.html", "welcome"),
    ).toBe(false);
  });
});

describe("isCurrentTemplateDataFile", () => {
  test("identifica el data.json del template activo", () => {
    expect(isCurrentTemplateDataFile("src/emails/templates/welcome/data.json", "welcome")).toBe(
      true,
    );
    expect(isCurrentTemplateDataFile("src\\emails\\templates\\welcome\\data.json", "welcome")).toBe(
      true,
    );
  });

  test("rechaza data.json de otro template o archivos distintos de datos", () => {
    expect(isCurrentTemplateDataFile("src/emails/templates/newsletter/data.json", "welcome")).toBe(
      false,
    );
    expect(isCurrentTemplateDataFile("src/emails/templates/welcome/template.html", "welcome")).toBe(
      false,
    );
    expect(isCurrentTemplateDataFile(undefined, "welcome")).toBe(false);
    expect(isCurrentTemplateDataFile("", "welcome")).toBe(false);
  });
});

describe("setupPreviewHmr", () => {
  /**
   * Helper para armar dependencias mockeadas de HMR.
   */
  function createHmrTestHarness(overrides = {}) {
    const events = [];
    const logs = [];

    /** @type {((payload?: { file?: string }) => Promise<void>) | null} */
    let registeredCallback = null;

    const hot = {
      on: (event, callback) => {
        events.push({ type: "hot.on", event });
        if (event === "email-source-changed") {
          registeredCallback = callback;
        }
      },
    };

    const latestDataFixture = { user: "Jane Doe", balance: 150 };

    const editorAPI = {
      setInitialData: (data) => events.push({ type: "editor.setInitialData", data }),
      updateContent: (data) => events.push({ type: "editor.updateContent", data }),
    };

    const renderAPI = {
      render: (template, data) => {
        events.push({ type: "renderAPI.render", template, data });
        return Promise.resolve();
      },
      invalidateTemplateCache: (template) => {
        events.push({ type: "renderAPI.invalidateTemplateCache", template });
        return Promise.resolve();
      },
    };

    const fetchLatestData = (template) => {
      events.push({ type: "fetchLatestData", template });
      return Promise.resolve(latestDataFixture);
    };

    const renderCurrentTemplate = () => {
      events.push({ type: "renderCurrentTemplate" });
      return Promise.resolve();
    };

    const deps = {
      templateName: "welcome",
      hot,
      fetchLatestData,
      editorAPI,
      renderAPI,
      renderCurrentTemplate,
      ...overrides,
    };

    const handler = setupPreviewHmr(deps);

    return {
      events,
      logs,
      latestDataFixture,
      handler,
      trigger: async (file) => {
        if (registeredCallback) {
          await registeredCallback({ file });
        }
      },
    };
  }

  test("retorna null de forma segura si hot no está disponible o carece de on()", () => {
    expect(setupPreviewHmr(null)).toBeNull();
    expect(setupPreviewHmr({})).toBeNull();
    expect(setupPreviewHmr({ hot: {} })).toBeNull();
  });

  test("rutas del template actual refrescan (invalidar cache y luego rerenderizar)", async () => {
    const harness = createHmrTestHarness();

    await harness.trigger("src/emails/templates/welcome/template.html");

    expect(harness.events).toEqual([
      { type: "hot.on", event: "email-source-changed" },
      { type: "renderAPI.invalidateTemplateCache", template: "welcome" },
      { type: "renderCurrentTemplate" },
    ]);
  });

  test("shared source refresca (layouts, partials, styles, config)", async () => {
    const harness = createHmrTestHarness();

    await harness.trigger("src/emails/partials/hero/hero.html");
    await harness.trigger("src/emails/layouts/base.html");
    await harness.trigger("tailwind.email.config.js");

    const invalidationEvents = harness.events.filter(
      (e) => e.type === "renderAPI.invalidateTemplateCache",
    );
    const rerenderEvents = harness.events.filter((e) => e.type === "renderCurrentTemplate");

    expect(invalidationEvents).toHaveLength(3);
    expect(rerenderEvents).toHaveLength(3);
  });

  test("data.json activo sigue flujo de rehidratación ordenado", async () => {
    const harness = createHmrTestHarness();

    await harness.trigger("src/emails/templates/welcome/data.json");

    expect(harness.events).toEqual([
      { type: "hot.on", event: "email-source-changed" },
      { type: "fetchLatestData", template: "welcome" },
      { type: "editor.setInitialData", data: harness.latestDataFixture },
      { type: "editor.updateContent", data: harness.latestDataFixture },
      {
        type: "renderAPI.render",
        template: "welcome",
        data: harness.latestDataFixture,
      },
    ]);
  });

  test("archivo de otro template no refresca", async () => {
    const harness = createHmrTestHarness();

    await harness.trigger("src/emails/templates/newsletter/template.html");
    await harness.trigger("src/emails/templates/newsletter/data.json");
    await harness.trigger("src/web/features/preview/main.js");

    // Solo se registró hot.on al inicio
    expect(harness.events).toEqual([{ type: "hot.on", event: "email-source-changed" }]);
  });

  test("invalidación fallida igualmente intenta rerender, como el comportamiento actual", async () => {
    const consoleErrorSpy = spyOn(console, "error").mockImplementation(() => {});

    try {
      const harness = createHmrTestHarness({
        renderAPI: {
          invalidateTemplateCache: () => Promise.reject(new Error("Network cache failure")),
          render: () => Promise.resolve(),
        },
      });

      await harness.trigger("src/emails/templates/welcome/template.html");

      expect(harness.events).toEqual([
        { type: "hot.on", event: "email-source-changed" },
        { type: "renderCurrentTemplate" },
      ]);
      expect(consoleErrorSpy).toHaveBeenCalled();
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });

  test("captura y reporta error si falla la rehidratación de data.json sin lanzar excepción no controlada", async () => {
    const consoleErrorSpy = spyOn(console, "error").mockImplementation(() => {});

    try {
      let fetchAttempted = false;
      const harness = createHmrTestHarness({
        fetchLatestData: () => {
          fetchAttempted = true;
          return Promise.reject(new Error("Failed to fetch data.json"));
        },
      });

      await harness.trigger("src/emails/templates/welcome/data.json");

      expect(fetchAttempted).toBe(true);
      expect(harness.events).toEqual([{ type: "hot.on", event: "email-source-changed" }]);
      expect(consoleErrorSpy).toHaveBeenCalled();
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });
});
