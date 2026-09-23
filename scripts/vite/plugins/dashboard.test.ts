import { describe, expect, test } from "bun:test";
import { resolve } from "node:path";
import type { IndexHtmlTransformContext, ViteDevServer } from "vite";
import { dashboardPlugin, getTemplates } from "./dashboard.ts";

interface TransformIndexHtmlHandler {
  handler: (html: string, ctx: IndexHtmlTransformContext) => string;
}

const rootDir = resolve(import.meta.dir ?? process.cwd(), "../../..");

describe("dashboardPlugin", () => {
  describe("getTemplates", () => {
    test("retorna todos los templates creados en src/emails/templates/", () => {
      const templates = getTemplates(rootDir);
      const ids = templates.map((t) => t.id);

      // Templates existentes en disco deben aparecer
      expect(ids).toContain("welcome");
      expect(ids).toContain("example");
      expect(ids).toContain("user-created");

      // Los templates de producto promovidos desde los arquetipos aparecen
      expect(ids).toContain("password-reset");
      expect(ids).toContain("receipt");
      expect(ids).toContain("newsletter");
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
    const transform = (plugin.transformIndexHtml as TransformIndexHtmlHandler).handler;
    const mockHtml = `<!doctype html><html><body><div id="template-list"></div></body></html>`;

    test("inyecta tarjeta real para welcome en #template-list", () => {
      const result = transform(mockHtml, {
        filename: "/features/home/index.html",
      } as IndexHtmlTransformContext);

      expect(result).toContain("/templates/welcome/");
      expect(result).toContain('href="/preview?template=welcome"');
      expect(result).toContain('class="template-card"');
      expect(result).toContain('class="template-card-preview"');
      expect(result).toContain(
        '<iframe data-preview-src="/templates/welcome/index.html" loading="lazy"',
      );
      expect(result).toContain('data-template-preview-skeleton="welcome"');
      expect(result).toContain("Gmail limit: 102KB");
    });

    test("incluye tarjetas para los templates de producto creados", () => {
      const result = transform(mockHtml, {
        filename: "/features/home/index.html",
      } as IndexHtmlTransformContext);

      expect(result).toContain("/templates/password-reset/");
      expect(result).toContain("/templates/receipt/");
      expect(result).toContain("/templates/newsletter/");
      expect(result).not.toContain("En roadmap");
    });

    test("inyecta el script de tamaños de template antes de </body>", () => {
      const result = transform(mockHtml, {
        filename: "/features/home/index.html",
      } as IndexHtmlTransformContext);

      expect(result).toContain("loadTemplateSizes");
      expect(result).toContain("/api/template-sizes");
    });

    test("no transforma archivos dentro de /templates/", () => {
      const templateHtml = `<html><body>Template original</body></html>`;
      const result = transform(templateHtml, {
        filename: "/templates/welcome/index.html",
      } as IndexHtmlTransformContext);

      expect(result).toBe(templateHtml);
    });
  });

  describe("configureServer - /api/template-sizes", () => {
    test("responde con objeto de tamaños solo para templates reales", () => {
      const plugin = dashboardPlugin(rootDir);
      type MiddlewareFn = (
        req: { url?: string },
        res: { setHeader: (k: string, v: string) => void; end: (chunk: string) => void },
        next: () => void,
      ) => void;
      let middlewareHandler: MiddlewareFn | null = null;

      const mockServer = {
        middlewares: {
          use(fn: MiddlewareFn) {
            middlewareHandler = fn;
          },
        },
      } as unknown as ViteDevServer;

      if (typeof plugin.configureServer === "function") {
        const configure = plugin.configureServer as (server: ViteDevServer) => void;
        configure(mockServer);
      }
      expect(typeof middlewareHandler).toBe("function");

      const req = { url: "/api/template-sizes" };
      let responseData = "";
      const res = {
        setHeader() {},
        end(chunk: string) {
          responseData = chunk;
        },
      };
      let nextCalled = false;
      const next = () => {
        nextCalled = true;
      };

      const activeHandler = middlewareHandler as MiddlewareFn | null;
      if (!activeHandler) throw new Error("middlewareHandler no configurado");
      activeHandler(req, res, next);
      expect(nextCalled).toBe(false);

      const parsed = JSON.parse(responseData);
      expect(parsed).toHaveProperty("welcome");
      expect(parsed).toHaveProperty("example");
      expect(parsed).toHaveProperty("user-created");

      expect(parsed).toHaveProperty("password-reset");
      expect(parsed).toHaveProperty("receipt");
      expect(parsed).toHaveProperty("newsletter");
    });
  });
});
