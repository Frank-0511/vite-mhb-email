# Estado de implementación — EmailForge Toolkit

## Resumen

- ID activo: MHB-33
- Estado: En revisión
- Implementador: Perfil TypeScript/frontend
- Revisor: Revisor UI independiente — revisión rechazada el 2026-09-22
- Rama: `feature/mhb-33`
- Última actualización: 2026-09-23
- Contrato activo: `docs/implementation/PLAN.md`

## Baseline vigente

- La release [v1.2.0](https://github.com/Frank-0511/vite-mhb-email/releases/tag/v1.2.0) es el baseline funcional publicado.
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

| Control                               | Comando                                    | Resultado                                                                 |
| :------------------------------------ | :----------------------------------------- | :------------------------------------------------------------------------ |
| Comprobación de rama                  | `bun scripts/ai/check-task-branch.mjs`     | Verde                                                                     |
| Typecheck unificado + estricto        | `bun run typecheck`                        | Verde; 0 diagnósticos estrictos                                           |
| Pruebas focalizadas                   | `bun test ...`                             | Verde (62 pass, 0 fail en slices finales)                                 |
| Linting completo                      | `bun run lint`                             | Verde                                                                     |
| Formato de código                     | `bun run format:check`                     | Verde                                                                     |
| Build y validación email              | `bun run build` / `bun run validate-email` | Verde (2 warnings no bloqueantes)                                         |
| Inventario, contraste y accesibilidad | Gates MHB-33                               | Inventario web verde; revisión independiente pendiente                    |
| Suite global                          | `bun run test`                             | Verde (537 pass, 0 fail)                                                  |
| Typecheck estricto                    | `bun run typecheck:strict`                 | Verde (0 diagnósticos)                                                    |
| Supresiones TS web                    | `grep -RIl '^// @ts-nocheck$' src/web`     | Verde (0 resultados; excepción ESLint retirada)                           |
| Pruebas tras saneamiento              | `bun test ...viewport-controls`            | Verde (6 pass, 0 fail)                                                    |
| Límite de módulos                     | `wc -l`                                    | Verde (`view-mode-controls.ts`: 250; `state.ts`: 29; `controller.ts`: 15) |

## Últimas entregas

- MHB-33: `En revisión` el 2026-09-23; tipado estricto completado, 0 diagnósticos, 537 tests verdes y controles de lint/formato/diff verdes.

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

| Ámbito | Estado      | Propiedad                              | Handoff                                                                                           |
| :----- | :---------- | :------------------------------------- | :------------------------------------------------------------------------------------------------ |
| MHB-33 | En revisión | Dashboard web en TypeScript            | Reentregada tras corregir los 271 diagnósticos; pendiente de revisión independiente y aceptación. |
| MHB-32 | Completada  | Servidor Vite y APIs en TS             | Aprobación técnica y cierre confirmado por el usuario en `feature/mhb-32`.                        |
| MHB-31 | Completada  | CLI, exportación y correo en TS        | Aprobación técnica y merge a `master` en commit `ac367a8`.                                        |
| MHB-30 | Completada  | Núcleo y validadores en TS             | Aprobación técnica y cierre confirmado por el usuario en `feature/mhb-30`.                        |
| MHB-35 | Completada  | Consolidación shared y deduplicación   | Aprobación técnica y cierre confirmado por el usuario en `feature/mhb-35`.                        |
| MHB-28 | Completada  | Modularización web sobredimensionada   | Aprobación técnica y cierre confirmado por el usuario en `feature/mhb-28`.                        |
| MHB-29 | Completada  | Base de ejecución TypeScript           | Aprobación técnica y merge a `master` (`5e18515`).                                                |
| MHB-13 | Completada  | Baseline tipos y mediciones            | Verificación completa y merge a `master` (`5fe448a`).                                             |
| MHB-20 | Completada  | Tests integración, caché y exportación | Aceptación y merge a `master` en commit `619a425`.                                                |

## Decisiones y desviaciones vigentes

- **Modularización de transformaciones de preview (`services/transforms/`):** Desacoplamiento de `component-preview-transforms.js` en módulos especializados (`delimiter-transforms.ts`, `conditional-transforms.ts`, `table-transforms.ts`, `script-transforms.ts`, `index.ts`) para respetar ≤ 250 líneas por archivo.
- **Reestructuración de carpetas temáticas en `services/`:** División de los 15 archivos planos de `scripts/vite/services/` en subdirectorios temáticos (`cache/`, `catalog/`, `transforms/`, `render/`) respetando ≤ 8 archivos fuente por carpeta y exponiendo un barril unificado `services/index.ts`.
- **Preservación total de contratos de desarrollo:** URLs `/api/*`, payloads de render/componentes, caché en `.cache/preview/` y resolución de rutas limpias se mantienen 100% idénticos.

## Handoff

- Entrega activa: MHB-33 reentregada en `feature/mhb-33`; estado `En revisión`, sin cierre administrativo.
- Evidencia reproducida: `bun run typecheck:strict` en verde con 0 diagnósticos; suite global en verde con 537 pruebas y 0 fallos.
- Correcciones aplicadas: se retiraron las 60 directivas `@ts-nocheck` y la excepción global de `ban-ts-comment`; se tiparon contratos base de Library/Preview, Web Components y mocks compartidos; se corrigió el CDN de JSONEditor.
- Typecheck posterior: se corrigieron los 271 diagnósticos pendientes en Preview/Library y sus tests; no se añadieron supresiones ni regresaron los slices ya saneados.
- Entrega parcial 2026-09-23: `viewport-controls.ts` y sus fixtures DOM quedaron tipados; 6 pruebas focalizadas, lint y formato pasan; el total estricto bajó de 340 a 315.
- Entrega parcial 2026-09-23: `iframe-manager.ts`, `preview-ready.ts` y sus fixtures runtime quedaron tipados; 9 pruebas focalizadas y lint pasan; el total estricto bajó de 315 a 282.
- Entrega parcial 2026-09-23: `preview-status.ts` y su fixture DOM compartido quedaron alineados con el contrato estricto; 7 pruebas focalizadas pasan; el total estricto bajó de 282 a 271.
- Hashes `dist/*.html` antes/después: idénticos; `example` `15df26c930ff71fc6bbae6dfef92233807185e628bb8f376c3885cbaba040b84`, `newsletter` `46d2ca012c6ed322c07216388d70da83cdb0d1fbc2f4656129fdfc36ac5797a8`, `password-reset` `cbc7a669473da4fe851cd19b7b53eb65db46457100d966eb58d4aaa96ae35c59`, `receipt` `e3778cd67de181b2d0d8fff1201170a8f7074f0b9ad9b5947e6076be713e4f7b`, `user-created` `8b6a9527bfd8757ba65b7f4db9f607299ff0c2ead12fed64f50feffe7de685ee`, `welcome` `82713780e64b5b87d793fefa766bd53a9f0a543c76505040f606891bbee3cb28`.
- Recorrido browser 2026-09-23: Home, Preview y Library ejecutados en 375/768/1440 px y light/dark (18 combinaciones); los PNG de evidencia fueron temporales y se eliminaron. El CDN `vanilla-jsoneditor@3.11.0/standalone.js` responde 200; Preview emite solo el warning de API deprecada del constructor JSONEditor.
- Alcance: no se observan rutas modificadas fuera de `src/web`, `eslint.config.js` y `STATUS.md`; quedan 21 JS/MJS fuera de `src/web`, asignados a MHB-34.
- Próxima acción inmediata: revisión independiente de MHB-33 con diff y evidencia; no marcar `Completada` sin aceptación.
- Siguiente tarea del roadmap:
  - MHB-14 (`desbloqueado`): Evidencia de uso y compatibilidad.
  - MHB-34 (`bloqueado`): Cierre total y modo estricto TypeScript; depende de la aceptación de MHB-33.
