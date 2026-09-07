import { describe, expect, test } from "bun:test";
import { resolve } from "node:path";
import { dashboardPlugin, getTemplates } from "./dashboard.js";

const rootDir = resolve(import.meta.dir, "../../..");

describe("dashboardPlugin", () => {
  describe("getTemplates", () => {
    test("retorna los templates reales creados y excluye scaffolds", () => {
      const templates = getTemplates(rootDir);
      const ids = templates.map((t) => t.id);

      // welcome existe en disco y no es scaffold
      expect(ids).toContain("welcome");

      // Scaffolds y fixtures de prueba quedan excluidos
      expect(ids).not.toContain("example");
      expect(ids).not.toContain("user-created");
      expect(ids).not.toContain("welcome2");

      // Templates no creados aún en src/emails/templates/ no aparecen
      expect(ids).not.toContain("password-reset");
      expect(ids).not.toContain("receipt");
      expect(ids).not.toContain("newsletter");
    });

    test("welcome tiene status 'available' y ruta de preview", () => {
      const templates = getTemplates(rootDir);
      const welcome = templates.find((t) => t.id === "welcome");

      expect(welcome).toBeDefined();
      expect(welcome?.status).toBe("available");
      expect(welcome?.path).toBe("/templates/welcome/index.html");
      expect(welcome?.hasSource).toBe(true);
    });
  });

  describe("transformIndexHtml", () => {
    const plugin = dashboardPlugin(rootDir);
    const mockHtml = `<!doctype html><html><body><div id="template-list"></div></body></html>`;

    test("inyecta tarjeta real para welcome en #template-list", () => {
      const result = /** @type {{ handler: Function }} */ (plugin.transformIndexHtml).handler(
        mockHtml,
        { filename: "/features/home/index.html" },
      );

      expect(result).toContain("/templates/welcome/");
      expect(result).toContain('href="/preview?template=welcome"');
      expect(result).toContain('<iframe src="/templates/welcome/index.html"');
      expect(result).toContain("Gmail limit: 102KB");
    });

    test("no incluye scaffolds (example, user-created) ni tarjetas fantasma de correos no creados", () => {
      const result = /** @type {{ handler: Function }} */ (plugin.transformIndexHtml).handler(
        mockHtml,
        { filename: "/features/home/index.html" },
      );

      expect(result).not.toContain("/templates/example/");
      expect(result).not.toContain("/templates/user-created/");
      expect(result).not.toContain("/templates/password-reset/");
      expect(result).not.toContain("/templates/receipt/");
      expect(result).not.toContain("/templates/newsletter/");
      expect(result).not.toContain("En roadmap");
    });

    test("inyecta el script de tamaños de template antes de </body>", () => {
      const result = /** @type {{ handler: Function }} */ (plugin.transformIndexHtml).handler(
        mockHtml,
        { filename: "/features/home/index.html" },
      );

      expect(result).toContain("loadTemplateSizes");
      expect(result).toContain("/api/template-sizes");
    });

    test("no transforma archivos dentro de /templates/", () => {
      const templateHtml = `<html><body>Template original</body></html>`;
      const result = /** @type {{ handler: Function }} */ (plugin.transformIndexHtml).handler(
        templateHtml,
        { filename: "/templates/welcome/index.html" },
      );

      expect(result).toBe(templateHtml);
    });
  });

  describe("configureServer - /api/template-sizes", () => {
    test("responde con objeto de tamaños solo para templates reales", async () => {
      const plugin = dashboardPlugin(rootDir);
      let middlewareHandler = null;

      const mockServer = {
        middlewares: {
          use(fn) {
            middlewareHandler = fn;
          },
        },
      };

      /** @type {{ configureServer: Function }} */ (plugin).configureServer(mockServer);
      expect(middlewareHandler).toBeFunction();

      const req = { url: "/api/template-sizes" };
      let responseData = "";
      const res = {
        setHeader() {},
        end(chunk) {
          responseData = chunk;
        },
      };
      let nextCalled = false;
      const next = () => {
        nextCalled = true;
      };

      await middlewareHandler(req, res, next);
      expect(nextCalled).toBe(false);

      const parsed = JSON.parse(responseData);
      expect(parsed).toHaveProperty("welcome");

      // Scaffolds y no creados no están presentes
      expect(parsed).not.toHaveProperty("example");
      expect(parsed).not.toHaveProperty("user-created");
      expect(parsed).not.toHaveProperty("password-reset");
      expect(parsed).not.toHaveProperty("receipt");
      expect(parsed).not.toHaveProperty("newsletter");
    });
  });
});
