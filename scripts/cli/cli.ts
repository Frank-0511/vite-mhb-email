#!/usr/bin/env node

/**
 * @fileoverview Entry point del CLI interactivo para vite-mhb-email.
 *
 * Uso:
 *   <pm> run cli          — Abre el menú interactivo
 *   <pm> run cli --help   — Muestra la ayuda y sale
 */

import { main } from "./main.ts";

main().catch(async (err: unknown) => {
  const { c, paint } = await import("../shared/index.ts");
  const message = err instanceof Error ? err.message : String(err);
  console.error(paint(c.red, `\n  ❌ Error inesperado: ${message}\n`));
  process.exit(1);
});
