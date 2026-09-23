---
name: email-refactor-type-safety
description: Refactorizar módulos, extraer JavaScript embebido, modularizar frontend o ampliar type safety gradualmente en EmailForge Toolkit. Usar para archivos grandes, responsabilidades mezcladas, JSDoc o cambios de tsconfig.
---

# Refactor y type safety gradual

- Refactorizar solo para reducir riesgo observable; no mezclar formato,
  extracción, renombres masivos y cambios de comportamiento.
- Para archivos cercanos a 250 líneas o con responsabilidades mezcladas,
  extraer una unidad por vez, conservar comportamiento y añadir JSDoc o tipos nativos en los límites.
  Ningún archivo fuente no-test debe superar 250 líneas al cierre.
- Estructurar en subdirectorios por dominio cuando un directorio supere 8 archivos
  fuente (sin contar tests co-locados).
- Reutilizar helpers y constantes de `shared/` antes de crear nuevas utilidades.
  Mantener JavaScript embebido limitado a bootstrap. Llevar UI, fetch, editor,
  storage e iframe a módulos de feature o shared apropiados.
- Contratos aislados: ubicar contratos cliente-servidor en `scripts/shared/contracts/`
  como módulos hoja puros sin dependencias de `node:*`, módulos externos ni imports
  ascendentes `../*`. Quedan excluidos del barrel `scripts/shared/index.ts`.
- Prohibición de magic strings: rutas de API (`API_ROUTES`), headers (`HEADER_X_ESP_VALIDATION`),
  errores (`RENDER_ERROR_CODE`), eventos (`EVENTS`) y temas (`THEME`) deben exportarse como
  objetos `as const` con uniones tipadas derivadas (`UPPER_SNAKE_CASE` / `PascalCase`).
- Type guards en límites externos: validar con guardas y fallbacks seguros cualquier lectura
  de `localStorage`, parámetros de URL o respuestas de red.
- Cero `any` y cero `@typedef`: en TypeScript (`.ts`) está prohibido `any` (usar `unknown` o
  tipos estrictos) y las etiquetas `@typedef` en JSDoc (usar `type` o `interface` nativos).
- Conservar JavaScript ESM con JSDoc donde aplique. No migrar globalmente a TypeScript sin
  autorización. Usar `allowJs`/`checkJs` y `bun run typecheck` solo en el alcance
  aprobado.
- Priorizar contratos de APIs Vite, schemas, render, validadores, build, CLI,
  filesystem y datos de template. Type safety no sustituye validación runtime.

Ejecutar lint, typecheck, pruebas y el control del flujo afectado antes de
entregar a revisión.
