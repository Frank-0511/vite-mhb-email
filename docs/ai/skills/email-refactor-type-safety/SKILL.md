---
name: email-refactor-type-safety
description: Refactorizar módulos, extraer JavaScript embebido, modularizar frontend o ampliar type safety gradualmente en EmailForge Toolkit. Usar para archivos grandes, responsabilidades mezcladas, JSDoc o cambios de tsconfig.
---

# Refactor y type safety gradual

- Refactorizar solo para reducir riesgo observable; no mezclar formato,
  extracción, renombres masivos y cambios de comportamiento.
- Para archivos cercanos a 250 líneas o con responsabilidades mezcladas,
  extraer una unidad por vez, conservar comportamiento y añadir JSDoc en los límites.
  Ningún archivo fuente no-test debe superar 250 líneas al cierre.
- Estructurar en subdirectorios por dominio cuando un directorio supere 8 archivos
  fuente (sin contar tests co-locados).
- Reutilizar helpers y constantes de `shared/` antes de crear nuevas utilidades.
  Mantener JavaScript embebido limitado a bootstrap. Llevar UI, fetch, editor,
  storage e iframe a módulos de feature o shared apropiados.
- Conservar JavaScript ESM con JSDoc. No migrar globalmente a TypeScript sin
  autorización. Usar `allowJs`/`checkJs` y `bun run typecheck` solo en el alcance
  aprobado.
- Priorizar contratos de APIs Vite, schemas, render, validadores, build, CLI,
  filesystem y datos de template. Type safety no sustituye validación runtime.

Ejecutar lint, typecheck, pruebas y el control del flujo afectado antes de
entregar a revisión.
