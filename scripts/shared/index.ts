/**
 * @fileoverview Punto de entrada consolidado (barrel) para el núcleo compartido (scripts/shared).
 */

// I/O & Rutas
export * from "./io/paths.ts";
export * from "./io/path-safety.ts";
export * from "./io/format-helpers.ts";

// Templates & Handlebars
export * from "./template/handlebars.ts";
export * from "./template/built-templates.ts";
export * from "./template/component-folders.ts";

// UI & Terminal
export * from "./ui/console.ts";
export * from "./ui/prompts.ts";

// Entorno & Runtime
export * from "./env/env.ts";
export * from "./env/pilot.ts";
