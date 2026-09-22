#!/usr/bin/env node
import { resolve } from "node:path";
import fs from "fs-extra";
import { globSync } from "glob";
import {
  formatBytes,
  GMAIL_MAX_SAFE_BYTES,
  GMAIL_WARNING_THRESHOLD_BYTES,
} from "../shared/format-helpers.js";

const rootDir = process.cwd();
const GMAIL_LIMIT = GMAIL_MAX_SAFE_BYTES;
const WARNING_THRESHOLD = GMAIL_WARNING_THRESHOLD_BYTES;

/**
 * Verifica el tamaño de los archivos HTML generados frente al límite de Gmail (102 KB).
 *
 * @param {string} [distDirOverride] Directorio opcional para buscar archivos HTML.
 * @returns {boolean} `true` si algún archivo excede límites o tiene warnings, `false` en caso contrario.
 */
export function checkHtmlSize(distDirOverride) {
  const distDir = distDirOverride ?? resolve(rootDir, "dist");
  const htmlFiles = globSync("**/*.html", { cwd: distDir });

  if (htmlFiles.length === 0) {
    console.log(`\n⚠️  No HTML files found in ${distDir}`);
    return false;
  }

  console.log("\n📊 HTML Size Check for Gmail Compatibility:\n");

  let hasWarnings = false;
  let totalSize = 0;

  for (const file of htmlFiles) {
    const filePath = resolve(distDir, file);
    const stats = fs.statSync(filePath);
    const formattedSize = formatBytes(stats.size, { useKBOnly: true, includeSpace: false });
    totalSize += stats.size;

    let status;
    let color;

    if (stats.size > GMAIL_LIMIT) {
      status = "❌ EXCEEDS";
      color = "\x1b[31m"; // red
      hasWarnings = true;
    } else if (stats.size > WARNING_THRESHOLD) {
      status = "⚠️  WARNING";
      color = "\x1b[33m"; // yellow
      hasWarnings = true;
    } else {
      status = "✅ OK";
      color = "\x1b[32m"; // green
    }

    const resetColor = "\x1b[0m";
    console.log(`${color}${status}${resetColor} ${file.padEnd(30)} ${formattedSize} / 102KB`);
  }

  const formattedTotal = formatBytes(totalSize, { useKBOnly: true, includeSpace: false });
  console.log(`\n📦 Total size: ${formattedTotal} (All files combined)\n`);

  if (hasWarnings) {
    console.log(
      "⚠️  TIP: Files exceeding 100KB may be truncated by Gmail ('View entire message')\n",
    );
    console.log("💡 Consider: minifying CSS, reducing images, using inlining strategically\n");
  } else {
    console.log("✅ All files are within Gmail's safe limit!\n");
  }

  return hasWarnings;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  checkHtmlSize();
}
