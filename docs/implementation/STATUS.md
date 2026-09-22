# Estado de implementación — EmailForge Toolkit

## Resumen

- ID activo: MHB-32
- Estado: En revisión
- Implementador: Perfil TypeScript/Vite
- Revisor: Revisor backend/Vite
- Rama: `feature/mhb-32`
- Última actualización: 2026-09-22
- Contrato activo: `docs/implementation/PLAN.md`

## Baseline vigente

- La release [v1.2.0](https://github.com/Frank-0511/vite-mhb-email/releases/tag/v1.2.0) es el baseline funcional publicado.
- MHB-31 completada y mergeada a `master` (commit `ac367a8`).
- MHB-30 completada y mergeada a `master` (commits `14af516` a `f6301ea`).
- MHB-35 completada y mergeada a `master` (commit `b495ec5`).
- MHB-28 completada en `feature/mhb-28`.
- MHB-29 completada y mergeada a `master` (commits `b5f659d` y `5e18515`).
- MHB-20 mergeada a `master` (commits `4cc964f` y `619a425`).
- MHB-13 completada y mergeada a `master` (commit `5fe448a`).
- Las variables ESP `{{ }}` se preservan en el HTML final; `[[ page.* ]]` queda reservado para Maizzle.

## Entrega activa (MHB-32: Servidor Vite y APIs en TypeScript)

- **Migración a TypeScript estricto:** Conversión a `.ts` de `scripts/vite/**` y `vite.config.ts` (0 JS restantes en Capa 3, 42 archivos TS).
- **Refactor integrado de `component-preview-transforms.js`:** Modularización en `transforms/` (`delimiter-transforms.ts`, `conditional-transforms.ts`, `table-transforms.ts`, `script-transforms.ts`, `index.ts`) para respetar ≤ 250 líneas.
- **Arquitectura de carpetas en `services/`:** Reestructuración de 15 archivos planos en subdirectorios temáticos (`cache/`, `catalog/`, `transforms/`, `render/`) respetando ≤ 8 archivos fuente por directorio.
- **Tipado estricto de APIs y middlewares:** Middlewares Connect/Vite y endpoints HTTP (`/api/*`) con tipos y validación runtime preservada.
- **Preservación total de contratos:** Sin cambios en URLs de preview, payloads de render, WebSocket HMR ni compatibilidad Maizzle/Handlebars.

### Controles de Calidad

| Control                                       | Comando                                | Resultado                          |
| :-------------------------------------------- | :------------------------------------- | :--------------------------------- |
| Comprobación de rama                          | `bun scripts/ai/check-task-branch.mjs` | Verde                              |
| Typecheck unificado + estricto                | `bun run typecheck`                    | Verde (0 errores en tsc y strict)  |
| Pruebas unitarias/integración (537+ tests)    | `bun test`                             | Verde (537 pass, 0 fail, 74 files) |
| Linting completo (html, js/ts, md, json, css) | `bun run lint`                         | Verde (0 errores, 0 warnings)      |
| Formato de código                             | `bun run format:check`                 | Verde (Prettier conforme)          |
| Build pipeline                                | `bun run build`                        | Verde (6 templates compilados)     |
| Validador HTML email                          | `bun run validate-email`               | Verde (0 errores, compatibilidad)  |
| Control de inventario TypeScript              | `bun run check:inventory`              | Verde (Capa 3: 0 JS / 42 TS)       |
| Sincronización de agentes                     | `bun run agents:check`                 | Verde (7 targets declarados)       |

## Últimas entregas

- MHB-31: `Completada` el 2026-09-22; CLI, exportación y correo migrados a TypeScript estricto (0 errores tsc, 537 tests verdes, helpers modularizados, layer-2-cli en 0 JS / 24 TS); commit `ac367a8` en `master`.
- MHB-30: `Completada` el 2026-09-22; núcleo, build, ESP, validadores, benchmarks e inventario migrados a TypeScript estricto (0 errores tsc, 529 tests verdes, hashes `dist/*.html` idénticos byte a byte, layer-1-core en 0 JS / 74 TS); rama `feature/mhb-30`.
- MHB-35: `Completada` el 2026-09-22; consolidación de utilidades shared (`format-helpers`, `theme-helpers`), adopción estricta de storage keys, eliminación de fetch crudo y saneamiento de render inicial de skeletons sin FOUC en preview; rama `feature/mhb-35`.
- MHB-28: `Completada` el 2026-09-21; modularización de superficies web sobredimensionadas (< 300 líneas en `src/web/**`, arquitectura `preview/modules/` por dominios, Web Component `<ef-skeleton>` en Light DOM, extracción de JS inline, cero regresión en `dist/*.html`); rama `feature/mhb-28`.
- MHB-29: `Completada` el 2026-09-21; base de ejecución TypeScript establecida (tsconfig unificado y estricto, eslint 10, tests piloto TS nativos en Bun, control de inventario de 194 JS / 2 TS); commits `b5f659d` y `5e18515` en `master`.
- MHB-13: `Completada` el 2026-09-20; baseline completo de tipos `checkJs` en 190 archivos JS/MJS (0 errores tsc, 0 `@ts-ignore`), tipos ambientales en `types/`, suite de benchmark reproducible y mediciones comparativas Bun vs Node.js.
- MHB-20: `Completada` el 2026-09-20; integración hermética de build, render, delimitadores, peso, caché y exportación; commits `4cc964f` y `619a425` en `master`.
- Release `v1.2.0`: cierre de la Fase B publicado el 2026-09-18 (<https://github.com/Frank-0511/vite-mhb-email/releases/tag/v1.2.0>).

## Ejecuciones delegadas relevantes

| Ámbito | Estado      | Propiedad                              | Handoff                                                                    |
| :----- | :---------- | :------------------------------------- | :------------------------------------------------------------------------- |
| MHB-32 | En revisión | Servidor Vite y APIs en TS             | Entregado a revisión técnica en commit `0c902c8` (rama `feature/mhb-32`).  |
| MHB-31 | Completada  | CLI, exportación y correo en TS        | Aprobación técnica y merge a `master` en commit `ac367a8`.                 |
| MHB-30 | Completada  | Núcleo y validadores en TS             | Aprobación técnica y cierre confirmado por el usuario en `feature/mhb-30`. |
| MHB-35 | Completada  | Consolidación shared y deduplicación   | Aprobación técnica y cierre confirmado por el usuario en `feature/mhb-35`. |
| MHB-28 | Completada  | Modularización web sobredimensionada   | Aprobación técnica y cierre confirmado por el usuario en `feature/mhb-28`. |
| MHB-29 | Completada  | Base de ejecución TypeScript           | Aprobación técnica y merge a `master` (`5e18515`).                         |
| MHB-13 | Completada  | Baseline tipos y mediciones            | Verificación completa y merge a `master` (`5fe448a`).                      |
| MHB-20 | Completada  | Tests integración, caché y exportación | Aceptación y merge a `master` en commit `619a425`.                         |

## Decisiones y desviaciones vigentes

- **Modularización de transformaciones de preview (`services/transforms/`):** Desacoplamiento de `component-preview-transforms.js` en módulos especializados (`delimiter-transforms.ts`, `conditional-transforms.ts`, `table-transforms.ts`, `script-transforms.ts`, `index.ts`) para respetar ≤ 250 líneas por archivo.
- **Reestructuración de carpetas temáticas en `services/`:** División de los 15 archivos planos de `scripts/vite/services/` en subdirectorios temáticos (`cache/`, `catalog/`, `transforms/`, `render/`) respetando ≤ 8 archivos fuente por carpeta y exponiendo un barril unificado `services/index.ts`.
- **Preservación total de contratos de desarrollo:** URLs `/api/*`, payloads de render/componentes, caché en `.cache/preview/` y resolución de rutas limpias se mantienen 100% idénticos.

## Handoff

- Entrega de MHB-32: En revisión técnica en commit `0c902c8` (rama `feature/mhb-32`).
- Próxima acción inmediata: Revisión técnica independiente de MHB-32 y confirmación de cierre por el revisor.
- Siguiente tarea del roadmap:
  - MHB-33 (`bloqueado`): Dashboard web en TypeScript (se desbloquea al confirmar el cierre de MHB-32).
  - MHB-14 (`desbloqueado`): Evidencia de uso y compatibilidad.
