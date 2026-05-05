#!/usr/bin/env node
// @ts-check

/**
 * @fileoverview Entry point del CLI interactivo para vite-mhb-email.
 *
 * Uso:
 *   bun run cli       — Abre el menú interactivo
 *   bun run cli --help — Muestra la ayuda y sale
 */

import { main } from "./cli/index.js";

main().catch(async (err) => {
  const { c, paint } = await import("./shared/console.js");
  console.error(paint(c.red, `\n  ❌ Error inesperado: ${err.message}\n`));
  process.exit(1);
});
