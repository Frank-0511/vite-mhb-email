/**
 * @fileoverview Preview Cache Manager para templates de email compilados.
 * Maneja la cache de previews renderizadas en .cache/preview/<template>/rendered.html
 * y detecta staleness basado en cambios en fuentes de email.
 */

import fs from "fs-extra";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { assertValidTemplateName } from "../../../shared/index.ts";

export interface PreviewCacheOptions {
  theme?: string;
  dataHash?: string;
}

export interface PreviewCacheMetadata {
  template: string;
  theme: string;
  dataHash: string;
  timestamp: number;
}

export class PreviewCacheManager {
  readonly rootDir: string;
  readonly cacheDir: string;

  constructor(rootDir: string) {
    this.rootDir = rootDir;
    this.cacheDir = resolve(rootDir, ".cache", "preview");
  }

  /**
   * Valida nombres de template usados para rutas de cache.
   */
  assertValidTemplateName(templateName: string): void {
    assertValidTemplateName(templateName);
  }

  /**
   * Obtener el timestamp más reciente de las fuentes de email.
   */
  getSourcesMaxTimestamp(): number {
    const sourcePatterns = [
      "src/emails/templates",
      "src/emails/layouts",
      "src/emails/partials",
      "src/emails/styles",
      "maizzle.config.js",
      "tailwind.email.config.js",
    ];

    let maxTime = 0;

    for (const pattern of sourcePatterns) {
      const fullPath = resolve(this.rootDir, pattern);
      try {
        if (fs.existsSync(fullPath)) {
          const stat = fs.statSync(fullPath);

          if (stat.isFile()) {
            maxTime = Math.max(maxTime, stat.mtimeMs);
          } else if (stat.isDirectory()) {
            const files = fs.readdirSync(fullPath, { recursive: true, encoding: "utf-8" });
            for (const file of files) {
              try {
                const filePath = resolve(fullPath, file);
                const fileStat = fs.statSync(filePath);
                if (fileStat.isFile()) {
                  maxTime = Math.max(maxTime, fileStat.mtimeMs);
                }
              } catch {
                // Ignorar archivos individuales inaccesibles
              }
            }
          }
        }
      } catch {
        // Ignorar rutas no existentes
      }
    }

    return maxTime;
  }

  /**
   * Obtener ruta de cache para un template.
   */
  getCachePath(templateName: string): string {
    this.assertValidTemplateName(templateName);
    return resolve(this.cacheDir, templateName, "rendered.html");
  }

  /**
   * Verificar si cache está válida y actualizada.
   */
  isCacheValid(templateName: string, options: PreviewCacheOptions = {}): boolean {
    const cachePath = this.getCachePath(templateName);
    if (!fs.existsSync(cachePath)) {
      return false;
    }

    try {
      const metaPath = cachePath + ".meta";
      if (!fs.existsSync(metaPath)) {
        return false;
      }

      const cacheData: PreviewCacheMetadata = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
      const cacheStat = fs.statSync(cachePath);
      const sourcesMaxTime = this.getSourcesMaxTimestamp();

      if (options.theme && cacheData.theme !== options.theme) {
        return false;
      }

      if (options.dataHash && cacheData.dataHash !== options.dataHash) {
        return false;
      }

      // Cache válida solo si es estrictamente más nueva que las fuentes.
      return Boolean(cacheData.timestamp && cacheStat.mtimeMs > sourcesMaxTime);
    } catch {
      return false;
    }
  }

  /**
   * Guardar HTML en cache.
   */
  async saveToCache(
    templateName: string,
    html: string,
    options: PreviewCacheOptions = {},
  ): Promise<void> {
    const cachePath = this.getCachePath(templateName);
    await fs.ensureDir(resolve(this.cacheDir, templateName));

    // Guardar HTML
    await fs.writeFile(cachePath, html, "utf-8");

    // Guardar metadata
    const metadata: PreviewCacheMetadata = {
      template: templateName,
      theme: options.theme || "light",
      dataHash: options.dataHash || "",
      timestamp: Date.now(),
    };
    await fs.writeFile(cachePath + ".meta", JSON.stringify(metadata, null, 2), "utf-8");
  }

  /**
   * Leer HTML desde cache.
   */
  readFromCache(templateName: string): string | null {
    const cachePath = this.getCachePath(templateName);
    if (fs.existsSync(cachePath)) {
      return fs.readFileSync(cachePath, "utf-8");
    }
    return null;
  }

  /**
   * Invalidar cache de un template específico.
   */
  async invalidateTemplate(templateName: string): Promise<void> {
    const cachePath = this.getCachePath(templateName);
    if (fs.existsSync(cachePath)) {
      await fs.remove(resolve(this.cacheDir, templateName));
    }
  }

  /**
   * Invalidar toda la cache.
   */
  async invalidateAll(): Promise<void> {
    if (fs.existsSync(this.cacheDir)) {
      await fs.remove(this.cacheDir);
    }
  }

  /**
   * Limpiar cache.
   */
  async clean(): Promise<void> {
    await this.invalidateAll();
  }
}

/**
 * Crear hash estable para los datos del preview.
 *
 * @param data Datos del editor JSON.
 * @returns Hash SHA-256 de los datos serializados.
 */
export function createPreviewDataHash(data: unknown): string {
  return createHash("sha256").update(JSON.stringify(data)).digest("hex");
}

export function createPreviewCacheManager(rootDir: string): PreviewCacheManager {
  return new PreviewCacheManager(rootDir);
}

export default PreviewCacheManager;
