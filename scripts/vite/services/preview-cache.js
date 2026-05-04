/**
 * Preview Cache Manager
 * Maneja la cache de previews renderizadas en .cache/preview/<template>/rendered.html
 * Detecta staleness basado en cambios en fuentes de email
 */
import fs from "fs-extra";
import { createHash } from "node:crypto";
import { resolve } from "node:path";

/**
 * @typedef {Object} CacheEntry
 * @property {string} html - HTML renderizado
 * @property {string} theme - Tema usado (light|dark)
 * @property {string} dataHash - Hash de los datos usados
 * @property {number} timestamp - Timestamp de creación
 */

class PreviewCacheManager {
  constructor(rootDir) {
    this.rootDir = rootDir;
    this.cacheDir = resolve(rootDir, ".cache", "preview");
  }

  /**
   * Obtener el timestamp más reciente de las fuentes de email
   * @returns {number}
   */
  getSourcesMaxTimestamp() {
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
          maxTime = Math.max(maxTime, stat.mtimeMs);

          // Si es un directorio, revisar archivos internos también
          if (stat.isDirectory()) {
            const files = fs.readdirSync(fullPath, { recursive: true });
            for (const file of files) {
              try {
                const filePath = resolve(fullPath, file);
                const fileStat = fs.statSync(filePath);
                if (fileStat.isFile()) {
                  maxTime = Math.max(maxTime, fileStat.mtimeMs);
                }
              } catch {
                // Ignorar errores
              }
            }
          }
        }
      } catch {
        // Ignorar si no existe
      }
    }

    return maxTime;
  }

  /**
   * Obtener ruta de cache para un template
   * @param {string} templateName
   * @returns {string}
   */
  getCachePath(templateName) {
    return resolve(this.cacheDir, templateName, "rendered.html");
  }

  /**
   * Verificar si cache está válida y actualizada
   * @param {string} templateName
   * @param {{ theme?: string, dataHash?: string }} [options]
   * @returns {boolean}
   */
  isCacheValid(templateName, options = {}) {
    const cachePath = this.getCachePath(templateName);
    if (!fs.existsSync(cachePath)) {
      return false;
    }

    try {
      const metaPath = cachePath + ".meta";
      if (!fs.existsSync(metaPath)) {
        return false;
      }

      const cacheData = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
      const cacheStat = fs.statSync(cachePath);
      const sourcesMaxTime = this.getSourcesMaxTimestamp();

      if (options.theme && cacheData.theme !== options.theme) {
        return false;
      }

      if (options.dataHash && cacheData.dataHash !== options.dataHash) {
        return false;
      }

      // Cache válida si fue creada después que cualquier fuente
      return cacheData.timestamp && cacheStat.mtimeMs >= sourcesMaxTime;
    } catch {
      return false;
    }
  }

  /**
   * Guardar HTML en cache
   * @param {string} templateName
   * @param {string} html
   * @param {{ theme?: string, dataHash?: string }} [options]
   * @returns {Promise<void>}
   */
  async saveToCache(templateName, html, options = {}) {
    const cachePath = this.getCachePath(templateName);
    await fs.ensureDir(resolve(this.cacheDir, templateName));

    // Guardar HTML
    await fs.writeFile(cachePath, html, "utf-8");

    // Guardar metadata
    const metadata = {
      template: templateName,
      theme: options.theme || "light",
      dataHash: options.dataHash || "",
      timestamp: Date.now(),
    };
    await fs.writeFile(cachePath + ".meta", JSON.stringify(metadata, null, 2), "utf-8");
  }

  /**
   * Leer HTML desde cache
   * @param {string} templateName
   * @returns {string | null}
   */
  readFromCache(templateName) {
    const cachePath = this.getCachePath(templateName);
    if (fs.existsSync(cachePath)) {
      return fs.readFileSync(cachePath, "utf-8");
    }
    return null;
  }

  /**
   * Invalidar cache de un template específico
   * @param {string} templateName
   * @returns {Promise<void>}
   */
  async invalidateTemplate(templateName) {
    const cachePath = this.getCachePath(templateName);
    if (fs.existsSync(cachePath)) {
      await fs.remove(resolve(this.cacheDir, templateName));
    }
  }

  /**
   * Invalidar toda la cache
   * @returns {Promise<void>}
   */
  async invalidateAll() {
    if (fs.existsSync(this.cacheDir)) {
      await fs.remove(this.cacheDir);
    }
  }

  /**
   * Limpiar cache (para .gitignore)
   * @returns {Promise<void>}
   */
  async clean() {
    await this.invalidateAll();
  }
}

/**
 * Crear hash estable para los datos del preview.
 *
 * @param {unknown} data Datos del editor JSON.
 * @returns {string} Hash SHA-256 de los datos serializados.
 */
export function createPreviewDataHash(data) {
  return createHash("sha256").update(JSON.stringify(data)).digest("hex");
}

export function createPreviewCacheManager(rootDir) {
  return new PreviewCacheManager(rootDir);
}

export default PreviewCacheManager;
