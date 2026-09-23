import { describe, expect, test } from "bun:test";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { API_ROUTES, HEADER_X_ESP_VALIDATION } from "./constants/api-routes.ts";
import { EVENTS } from "./constants/events.ts";
import {
  RENDER_ERROR_CODE,
  RENDER_ERROR_MESSAGE,
  RENDER_ERROR_VERSION,
  SAFE_RENDER_CAUSE,
  SAFE_RENDER_LOCATION_PATH,
} from "./constants/render-error.ts";
import { THEME } from "./constants/theme.ts";
import { isThemeChangedEventDetail } from "./guards/events.ts";
import { isRenderErrorCode, isSafeRenderCause } from "./guards/render-error.ts";
import { isTheme } from "./guards/theme.ts";
import {
  componentDetailRoute,
  componentRenderRoute,
  copyHtmlTemplateRoute,
  dataTemplateRoute,
  invalidateCacheRoute,
  renderTemplateRoute,
} from "./routes/api-routes.ts";

describe("scripts/shared/contracts", () => {
  const contractsDir = fileURLToPath(new URL(".", import.meta.url));

  test("los módulos de contratos no importan módulos externos ni escapan de contracts/", () => {
    const subdirs = ["constants", "types", "guards", "routes"];
    for (const subdir of subdirs) {
      const dirPath = join(contractsDir, subdir);
      const files = readdirSync(dirPath).filter((f) => f.endsWith(".ts"));
      expect(files.length).toBeGreaterThanOrEqual(1);

      for (const file of files) {
        const content = readFileSync(join(dirPath, file), "utf8");
        expect(content).not.toMatch(/from\s+["']node:/);
        expect(content).not.toMatch(/from\s+["'](?:\.\.\/){2,}/);
      }
    }
  });

  test("los módulos de types/ no contienen declaraciones runtime", () => {
    const typesDir = join(contractsDir, "types");
    const files = readdirSync(typesDir).filter((f) => f.endsWith(".ts"));
    expect(files.length).toBeGreaterThanOrEqual(3);

    for (const file of files) {
      const content = readFileSync(join(typesDir, file), "utf8");
      expect(content).not.toMatch(/^\s*(const|let|var|function|class)\b/m);
      expect(content).not.toMatch(/export\s+(const|let|var|function|class|default)\b/m);
      const nonTypeImport = /import\s+(?!type\b)[^{;]*from/m;
      expect(content).not.toMatch(nonTypeImport);
    }
  });

  describe("constants/api-routes", () => {
    test("define las rutas base esperadas", () => {
      expect(API_ROUTES.DATA).toBe("/api/data");
      expect(API_ROUTES.RENDER).toBe("/api/render");
      expect(API_ROUTES.COPY_HTML).toBe("/api/copy-html");
      expect(API_ROUTES.CACHE).toBe("/api/cache");
      expect(API_ROUTES.CACHE_INVALIDATE).toBe("/api/cache/invalidate");
      expect(API_ROUTES.CACHE_CLEAN).toBe("/api/cache/clean");
      expect(API_ROUTES.COMPONENTS).toBe("/api/components");
      expect(API_ROUTES.TEMPLATE_SIZES).toBe("/api/template-sizes");
      expect(HEADER_X_ESP_VALIDATION).toBe("X-ESP-Validation");
    });
  });

  describe("routes/api-routes", () => {
    test("genera rutas parametrizadas a partir de API_ROUTES", () => {
      expect(componentRenderRoute("button")).toBe("/api/components/button/render");
      expect(componentDetailRoute("badge")).toBe("/api/components/badge");
      expect(renderTemplateRoute("welcome")).toBe("/api/render?template=welcome");
      expect(renderTemplateRoute("welcome", THEME.DARK)).toBe(
        "/api/render?template=welcome&theme=dark",
      );
      expect(invalidateCacheRoute("newsletter")).toBe("/api/cache/invalidate?template=newsletter");
      expect(dataTemplateRoute("receipt")).toBe("/api/data?template=receipt");
      expect(copyHtmlTemplateRoute("alert")).toBe("/api/copy-html?template=alert");
    });
  });

  describe("render-error", () => {
    test("valida constantes, versión y causas seguras", () => {
      expect(RENDER_ERROR_VERSION).toBe(1);
      expect(RENDER_ERROR_CODE.FAILED).toBe("RENDER_FAILED");
      expect(isRenderErrorCode("RENDER_FAILED")).toBe(true);
      expect(isRenderErrorCode("OTHER_ERROR")).toBe(false);
      expect(isRenderErrorCode(null)).toBe(false);

      expect(RENDER_ERROR_MESSAGE).toBe("No se pudo renderizar el template.");
      expect(isSafeRenderCause(SAFE_RENDER_CAUSE.SYNTAX)).toBe(true);
      expect(isSafeRenderCause("Causa no segura")).toBe(false);

      expect(SAFE_RENDER_LOCATION_PATH.test("templates/order.html")).toBe(true);
      expect(SAFE_RENDER_LOCATION_PATH.test("/etc/passwd")).toBe(false);
      expect(SAFE_RENDER_LOCATION_PATH.test("../secret.html")).toBe(false);
    });
  });

  describe("events", () => {
    test("define los eventos y valida detalles", () => {
      expect(EVENTS.EMAIL_SOURCE_CHANGED).toBe("email-source-changed");
      expect(EVENTS.THEME_CHANGED).toBe("theme-changed");

      expect(isThemeChangedEventDetail({ isDark: true })).toBe(true);
      expect(isThemeChangedEventDetail({ isDark: false })).toBe(true);
      expect(isThemeChangedEventDetail({ isDark: "yes" })).toBe(false);
      expect(isThemeChangedEventDetail(null)).toBe(false);
    });
  });

  describe("theme", () => {
    test("valida temas light y dark", () => {
      expect(THEME.LIGHT).toBe("light");
      expect(THEME.DARK).toBe("dark");

      expect(isTheme("light")).toBe(true);
      expect(isTheme("dark")).toBe(true);
      expect(isTheme("system")).toBe(false);
      expect(isTheme(123)).toBe(false);
      expect(isTheme(undefined)).toBe(false);
    });
  });
});
