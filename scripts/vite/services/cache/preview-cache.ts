/**
 * @fileoverview Preview Cache Manager para templates de email compilados.
 * Maneja la cache de previews renderizadas en .cache/preview/<template>/rendered.html
 * y detecta staleness basado en cambios en fuentes de email.
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { EMAIL_SOURCE_PATHS } from "../../../shared/contracts/constants/email-sources.ts";
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
    let maxTime = 0;

    for (const pattern of EMAIL_SOURCE_PATHS) {
      const fullPath = resolve(this.rootDir, pattern);
      try {
        if (existsSync(fullPath)) {
          const stat = statSync(fullPath);

          if (stat.isFile()) {
            maxTime = Math.max(maxTime, stat.mtimeMs);
          } else if (stat.isDirectory()) {
            const files = readdirSync(fullPath, { recursive: true, encoding: "utf-8" });
            for (const file of files) {
              try {
                const filePath = resolve(fullPath, file);
                const fileStat = statSync(filePath);
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
    if (!existsSync(cachePath)) {
      return false;
    }

    try {
      const metaPath = cachePath + ".meta";
      if (!existsSync(metaPath)) {
        return false;
      }

      const cacheData: PreviewCacheMetadata = JSON.parse(readFileSync(metaPath, "utf-8"));
      const cacheStat = statSync(cachePath);
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
    await mkdir(resolve(this.cacheDir, templateName), { recursive: true });

    // Guardar HTML
    await writeFile(cachePath, html, "utf-8");

    // Guardar metadata
    const metadata: PreviewCacheMetadata = {
      template: templateName,
      theme: options.theme || "light",
      dataHash: options.dataHash || "",
      timestamp: Date.now(),
    };
    await writeFile(cachePath + ".meta", JSON.stringify(metadata, null, 2), "utf-8");
  }

  /**
   * Leer HTML desde cache.
   */
  readFromCache(templateName: string): string | null {
    const cachePath = this.getCachePath(templateName);
    if (existsSync(cachePath)) {
      return readFileSync(cachePath, "utf-8");
    }
    return null;
  }

  /**
   * Invalidar cache de un template específico.
   */
  async invalidateTemplate(templateName: string): Promise<void> {
    const cachePath = this.getCachePath(templateName);
    if (existsSync(cachePath)) {
      await rm(resolve(this.cacheDir, templateName), { recursive: true, force: true });
    }
  }

  /**
   * Invalidar toda la cache.
   */
  async invalidateAll(): Promise<void> {
    if (existsSync(this.cacheDir)) {
      await rm(this.cacheDir, { recursive: true, force: true });
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
