# Estado de implementación — EmailForge Toolkit

## Resumen

- ID activo: MHB-33
- Estado: Completada
- Implementador: Perfil TypeScript/frontend
- Revisor: Revisor UI/TypeScript independiente — aceptación confirmada el 2026-09-23
- Rama: `feature/mhb-33`
- Última actualización: 2026-09-23
- Contrato activo: `docs/implementation/PLAN.md`

## Baseline vigente

- La release [v1.2.0](https://github.com/Frank-0511/vite-mhb-email/releases/tag/v1.2.0) es el baseline funcional publicado.
- MHB-33 completada en rama `feature/mhb-33`.
- MHB-32 completada en rama `feature/mhb-32`.
- MHB-31 completada y mergeada a `master` (commit `ac367a8`).
- MHB-30 completada y mergeada a `master` (commits `14af516` a `f6301ea`).
- MHB-35 completada y mergeada a `master` (commit `b495ec5`).
- MHB-28 completada en `feature/mhb-28`.
- MHB-29 completada y mergeada a `master` (commits `b5f659d` y `5e18515`).
- MHB-20 mergeada a `master` (commits `4cc964f` y `619a425`).
- MHB-13 completada y mergeada a `master` (commit `5fe448a`).
- Las variables ESP `{{ }}` se preservan en el HTML final; `[[ page.* ]]` queda reservado para Maizzle.

## Entrega activa (MHB-33: Dashboard web en TypeScript)

- **Bloque inicial:** Migrar `src/web/shared` y Home a TypeScript estricto, conservando contratos DOM y comportamiento visible.
- **Refactor previsto:** dividir `library/main.js`, `view-mode-controls.js` y `theme-toggle-component.js` por responsabilidad durante sus bloques respectivos.
- **Dependencias:** MHB-28, MHB-32 y MHB-35 completadas; no se introducen React/JSX ni cambios en el HTML de email.
- **Validación de cierre:** typecheck estricto, suite, lint, formato, build, validación email, contraste, accesibilidad, hashes de `dist/` e inventario web sin JS propio.
- **Riesgo vigente:** casts DOM o cambios de imports pueden ocultar nodos ausentes o alterar comportamiento; migrar por feature y mantener guards runtime.

### Controles de Calidad

| Control                          | Comando                                       | Resultado                                                                         |
| :------------------------------- | :-------------------------------------------- | :-------------------------------------------------------------------------------- |
| Comprobación de rama             | `bun scripts/ai/check-task-branch.mjs`        | Verde                                                                             |
| Typecheck unificado              | `tsc --noEmit` (`bun run typecheck`)          | Verde (0 diagnósticos)                                                            |
| Typecheck estricto               | `bun run typecheck:strict`                    | Verde (0 diagnósticos)                                                            |
| Suite global de pruebas          | `bun run test`                                | Verde (537 pass, 0 fail)                                                          |
| Linting completo                 | `bun run lint`                                | Verde                                                                             |
| Formato de código                | `bun run format:check`                        | Verde                                                                             |
| Build y validación email         | `bun run build` / `bun run validate-email`    | Verde (2 warnings no bloqueantes)                                                 |
| Contraste WCAG                   | `bun run lint:contrast`                       | Verde (26/26 pruebas superadas en light/dark)                                     |
| Supresiones TS web               | `grep -RIl '@ts-ignore\|@ts-nocheck' src/web` | Verde (0 resultados)                                                              |
| Inventario web propio            | `find src/web -name '*.js' -o -name '*.mjs'`  | Verde (0 archivos; layer-4-web completada)                                        |
| Límite de módulos (≤ 250 líneas) | `wc -l`                                       | Verde (`viewport-controls.ts`: 240; `view-mode-controls.ts`: 243; `main.ts`: 246) |

## Últimas entregas

- MHB-33: `Completada` el 2026-09-23; dashboard web en TypeScript estricto (0 errores tsc, 537 tests verdes, límites ≤ 250 líneas verificados, claves de storage centralizadas, corrección de listener en Web Component y hashes de `dist/*.html` idénticos byte a byte); rama `feature/mhb-33`.

- MHB-32: `Completada` el 2026-09-22; servidor Vite, APIs, plugins y configuración migrados a TypeScript estricto (0 errores tsc, 537 tests verdes, modularización de transforms en subcarpetas temáticas, layer-3-vite en 0 JS / 42 TS); rama `feature/mhb-32`.
- MHB-31: `Completada` el 2026-09-22; CLI, exportación y correo migrados a TypeScript estricto (0 errores tsc, 537 tests verdes, helpers modularizados, layer-2-cli en 0 JS / 24 TS); commit `ac367a8` en `master`.
- MHB-30: `Completada` el 2026-09-22; núcleo, build, ESP, validadores, benchmarks e inventario migrados a TypeScript estricto (0 errores tsc, 529 tests verdes, hashes `dist/*.html` idénticos byte a byte, layer-1-core en 0 JS / 74 TS); rama `feature/mhb-30`.
- MHB-35: `Completada` el 2026-09-22; consolidación de utilidades shared (`format-helpers`, `theme-helpers`), adopción estricta de storage keys, eliminación de fetch crudo y saneamiento de render inicial de skeletons sin FOUC en preview; rama `feature/mhb-35`.
- MHB-28: `Completada` el 2026-09-21; modularización de superficies web sobredimensionadas (< 300 líneas en `src/web/**`, arquitectura `preview/modules/` por dominios, Web Component `<ef-skeleton>` en Light DOM, extracción de JS inline, cero regresión en `dist/*.html`); rama `feature/mhb-28`.
- MHB-29: `Completada` el 2026-09-21; base de ejecución TypeScript establecida (tsconfig unificado y estricto, eslint 10, tests piloto TS nativos en Bun, control de inventario de 194 JS / 2 TS); commits `b5f659d` y `5e18515` en `master`.
- MHB-13: `Completada` el 2026-09-20; baseline completo de tipos `checkJs` en 190 archivos JS/MJS (0 errores tsc, 0 `@ts-ignore`), tipos ambientales en `types/`, suite de benchmark reproducible y mediciones comparativas Bun vs Node.js.
- MHB-20: `Completada` el 2026-09-20; integración hermética de build, render, delimitadores, peso, caché y exportación; commits `4cc964f` y `619a425` en `master`.
- Release `v1.2.0`: cierre de la Fase B publicado el 2026-09-18 (<https://github.com/Frank-0511/vite-mhb-email/releases/tag/v1.2.0>).

## Ejecuciones delegadas relevantes

| Ámbito | Estado     | Propiedad                              | Handoff                                                                                               |
| :----- | :--------- | :------------------------------------- | :---------------------------------------------------------------------------------------------------- |
| MHB-33 | Completada | Dashboard web en TypeScript            | Aprobación técnica y cierre confirmado tras saneamiento y revisión independiente en `feature/mhb-33`. |
| MHB-32 | Completada | Servidor Vite y APIs en TS             | Aprobación técnica y cierre confirmado por el usuario en `feature/mhb-32`.                            |
| MHB-31 | Completada | CLI, exportación y correo en TS        | Aprobación técnica y merge a `master` en commit `ac367a8`.                                            |
| MHB-30 | Completada | Núcleo y validadores en TS             | Aprobación técnica y cierre confirmado por el usuario en `feature/mhb-30`.                            |
| MHB-35 | Completada | Consolidación shared y deduplicación   | Aprobación técnica y cierre confirmado por el usuario en `feature/mhb-35`.                            |
| MHB-28 | Completada | Modularización web sobredimensionada   | Aprobación técnica y cierre confirmado por el usuario en `feature/mhb-28`.                            |
| MHB-29 | Completada | Base de ejecución TypeScript           | Aprobación técnica y merge a `master` (`5e18515`).                                                    |
| MHB-13 | Completada | Baseline tipos y mediciones            | Verificación completa y merge a `master` (`5fe448a`).                                                 |
| MHB-20 | Completada | Tests integración, caché y exportación | Aceptación y merge a `master` en commit `619a425`.                                                    |

## Decisiones y desviaciones vigentes

- **Modularización de transformaciones de preview (`services/transforms/`):** Desacoplamiento de `component-preview-transforms.js` en módulos especializados (`delimiter-transforms.ts`, `conditional-transforms.ts`, `table-transforms.ts`, `script-transforms.ts`, `index.ts`) para respetar ≤ 250 líneas por archivo.
- **Reestructuración de carpetas temáticas en `services/`:** División de los 15 archivos planos de `scripts/vite/services/` en subdirectorios temáticos (`cache/`, `catalog/`, `transforms/`, `render/`) respetando ≤ 8 archivos fuente por carpeta y exponiendo un barril unificado `services/index.ts`.
- **Preservación total de contratos de desarrollo:** URLs `/api/*`, payloads de render/componentes, caché en `.cache/preview/` y resolución de rutas limpias se mantienen 100% idénticos.

## Handoff

- Entrega de MHB-33: Completada en rama `feature/mhb-33`.
- Evidencia reproducida: `tsc --noEmit` y `bun run typecheck:strict` en verde con 0 diagnósticos; suite global en verde con 537 pruebas y 0 fallos; hashes `dist/*.html` idénticos byte a byte al baseline publicado.
- Saneamiento aplicado: límite de ≤ 250 líneas restablecido en `view-mode-controls.ts` (243 l.) y `viewport-controls.ts` (240 l.); claves centralizadas en `storage-keys.ts` (`STORAGE_KEY_VIEW_MODE`, `STORAGE_KEY_VIEWPORT_MODE`, `STORAGE_KEY_VIEWPORT_CUSTOM_WIDTH`); desuscripción de eventos corregida en `ThemeToggleComponent`; `controller.ts` conectado en bootstrap de Library.
- Próxima acción inmediata: Crear Pull Request de `feature/mhb-33` hacia `master` y realizar merge.
- Siguiente tarea del roadmap:
  - MHB-14 (`desbloqueado`): Evidencia de uso y compatibilidad.
  - MHB-37 (`desbloqueado`): Contratos compartidos, constantes tipadas y guards de tipos (se desbloquea al completar MHB-33).
  - MHB-34 (`bloqueado`): Cierre total y modo estricto TypeScript; depende de MHB-37.
