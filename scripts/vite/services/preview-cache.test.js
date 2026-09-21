// @ts-check
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import fs from "fs-extra";
import { mkdtempSync, rmSync, utimesSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { createPreviewCacheManager, createPreviewDataHash } from "./preview-cache.js";

describe("PreviewCacheManager & createPreviewDataHash", () => {
  /** @type {string} */
  let tempDir;
  /** @type {import("./preview-cache.js").PreviewCacheManager} */
  let cacheManager;

  beforeEach(() => {
    tempDir = mkdtempSync(resolve(tmpdir(), "preview-cache-test-"));
    cacheManager = createPreviewCacheManager(tempDir);
  });

  afterEach(() => {
    if (tempDir && fs.existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe("createPreviewDataHash", () => {
    test("genera hash SHA-256 determinista para los mismos datos", () => {
      const data = { user: "Alice", count: 42, active: true };
      const hash1 = createPreviewDataHash(data);
      const hash2 = createPreviewDataHash(data);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64);
      expect(/^[0-9a-f]{64}$/.test(hash1)).toBe(true);
    });

    test("genera hashes diferentes para datos distintos", () => {
      const hash1 = createPreviewDataHash({ user: "Alice" });
      const hash2 = createPreviewDataHash({ user: "Bob" });

      expect(hash1).not.toBe(hash2);
    });
  });

  describe("saveToCache & readFromCache", () => {
    test("guarda y recupera HTML y metadata en la ruta de caché", async () => {
      const htmlContent = "<html><body><h1>Hello Test</h1></body></html>";
      const dataHash = createPreviewDataHash({ name: "Tester" });

      await cacheManager.saveToCache("welcome", htmlContent, {
        theme: "dark",
        dataHash,
      });

      const readHtml = cacheManager.readFromCache("welcome");
      expect(readHtml).toBe(htmlContent);

      const metaPath = cacheManager.getCachePath("welcome") + ".meta";
      expect(fs.existsSync(metaPath)).toBe(true);
      const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
      expect(meta).toMatchObject({
        template: "welcome",
        theme: "dark",
        dataHash,
        timestamp: expect.any(Number),
      });
    });

    test("retorna null si el archivo en caché no existe", () => {
      expect(cacheManager.readFromCache("unrendered-template")).toBeNull();
    });
  });

  describe("isCacheValid", () => {
    test("retorna false si no existe el archivo de caché ni .meta", () => {
      expect(cacheManager.isCacheValid("welcome")).toBe(false);
    });

    test("retorna false si existe el HTML pero falta el .meta", async () => {
      const cachePath = cacheManager.getCachePath("welcome");
      await fs.ensureDir(resolve(tempDir, ".cache", "preview", "welcome"));
      await fs.writeFile(cachePath, "<p>No meta</p>", "utf-8");

      expect(cacheManager.isCacheValid("welcome")).toBe(false);
    });

    test("retorna false si el tema solicitado difiere del tema en caché", async () => {
      await cacheManager.saveToCache("welcome", "<p>Content</p>", {
        theme: "light",
      });

      expect(cacheManager.isCacheValid("welcome", { theme: "dark" })).toBe(false);
      expect(cacheManager.isCacheValid("welcome", { theme: "light" })).toBe(true);
    });

    test("retorna false si el dataHash solicitado difiere del dataHash en caché", async () => {
      const hash1 = createPreviewDataHash({ value: 1 });
      const hash2 = createPreviewDataHash({ value: 2 });

      await cacheManager.saveToCache("welcome", "<p>Content</p>", {
        theme: "light",
        dataHash: hash1,
      });

      expect(cacheManager.isCacheValid("welcome", { theme: "light", dataHash: hash2 })).toBe(false);
      expect(cacheManager.isCacheValid("welcome", { theme: "light", dataHash: hash1 })).toBe(true);
    });

    test("retorna false si las fuentes del email son más recientes que la caché", async () => {
      // Crear una fuente de email en tempDir con mtime antiguo
      const templateFile = resolve(tempDir, "src/emails/templates/welcome/index.html");
      await fs.ensureDir(resolve(tempDir, "src/emails/templates/welcome"));
      await fs.writeFile(templateFile, "<h1>Source</h1>", "utf-8");

      const pastTime = (Date.now() - 50000) / 1000;
      utimesSync(templateFile, pastTime, pastTime);

      // Guardar en caché (tendrá mtime actual)
      await cacheManager.saveToCache("welcome", "<p>Cached</p>", { theme: "light" });
      expect(cacheManager.isCacheValid("welcome", { theme: "light" })).toBe(true);

      // Actualizar mtime de la fuente a futuro para simular edición
      const futureTime = (Date.now() + 10000) / 1000;
      utimesSync(templateFile, futureTime, futureTime);

      expect(cacheManager.isCacheValid("welcome", { theme: "light" })).toBe(false);
    });

    test("ignora cambios de mtime en directorios si los archivos no cambiaron", async () => {
      const templateDir = resolve(tempDir, "src/emails/templates/welcome");
      const templateFile = resolve(templateDir, "index.html");
      await fs.ensureDir(templateDir);
      await fs.writeFile(templateFile, "<h1>Source</h1>", "utf-8");

      const pastTime = (Date.now() - 50000) / 1000;
      utimesSync(templateFile, pastTime, pastTime);

      await cacheManager.saveToCache("welcome", "<p>Cached</p>", { theme: "light" });
      expect(cacheManager.isCacheValid("welcome", { theme: "light" })).toBe(true);

      // Simular cambio de timestamp solo en el directorio contenedor
      const futureTime = (Date.now() + 10000) / 1000;
      utimesSync(templateDir, futureTime, futureTime);
      utimesSync(resolve(tempDir, "src/emails/templates"), futureTime, futureTime);

      // La caché debe seguir siendo válida porque los archivos fuente no cambiaron
      expect(cacheManager.isCacheValid("welcome", { theme: "light" })).toBe(true);
    });
  });

  describe("invalidación de caché", () => {
    test("invalidateTemplate elimina el directorio del template indicado", async () => {
      await cacheManager.saveToCache("welcome", "<p>Welcome</p>");
      await cacheManager.saveToCache("receipt", "<p>Receipt</p>");

      await cacheManager.invalidateTemplate("welcome");

      expect(cacheManager.readFromCache("welcome")).toBeNull();
      expect(cacheManager.readFromCache("receipt")).toBe("<p>Receipt</p>");
    });

    test("invalidateAll y clean eliminan todo el directorio de caché", async () => {
      await cacheManager.saveToCache("welcome", "<p>Welcome</p>");
      await cacheManager.saveToCache("receipt", "<p>Receipt</p>");

      await cacheManager.clean();

      expect(fs.existsSync(resolve(tempDir, ".cache", "preview"))).toBe(false);
      expect(cacheManager.readFromCache("welcome")).toBeNull();
      expect(cacheManager.readFromCache("receipt")).toBeNull();
    });
  });
});
