#!/usr/bin/env node
// @ts-check

/**
 * @fileoverview Entry point del CLI interactivo para vite-mhb-email.
 *
 * Uso:
 *   yarn cli          — Abre el menú interactivo
 *   yarn cli --help   — Muestra la ayuda y sale
 */

import { main } from "./cli/index.js";

main().catch(async (err) => {
  const { c, paint } = await import("./utils.js");
  console.error(paint(c.red, `\n  ❌ Error inesperado: ${err.message}\n`));
  process.exit(1);
});
