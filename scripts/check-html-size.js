#!/usr/bin/env node
import fs from "fs-extra";
import { globSync } from "glob";
import { resolve } from "node:path";

const rootDir = process.cwd();
const GMAIL_LIMIT = 102 * 1024; // 102KB
const WARNING_THRESHOLD = 100 * 1024; // 100KB

export async function checkHtmlSize() {
  const distDir = resolve(rootDir, "dist");
  const htmlFiles = globSync("**/*.html", { cwd: distDir });

  if (htmlFiles.length === 0) {
    console.log("\n⚠️  No HTML files found in dist/");
    return;
  }

  console.log("\n📊 HTML Size Check for Gmail Compatibility:\n");

  let hasWarnings = false;
  let totalSize = 0;

  for (const file of htmlFiles) {
    const filePath = resolve(distDir, file);
    const stats = fs.statSync(filePath);
    const sizeInKB = stats.size / 1024;
    totalSize += stats.size;

    let status = "✅";
    let color = "";

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
    console.log(
      `${color}${status}${resetColor} ${file.padEnd(30)} ${sizeInKB.toFixed(2)}KB / 102KB`,
    );
  }

  const totalSizeKB = totalSize / 1024;
  console.log(`\n📦 Total size: ${totalSizeKB.toFixed(2)}KB (All files combined)\n`);

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

checkHtmlSize().catch((err) => {
  console.error("Error checking HTML size:", err);
  process.exit(1);
});
