# Estado de implementación — EmailForge Toolkit

## Resumen

- ID activo: MHB-28
- Estado: En progreso
- Implementador: Perfil UI/web
- Revisor: Revisor UI
- Rama: `feature/mhb-28`
- Última actualización: 2026-09-21
- Contrato activo: `docs/implementation/PLAN.md`

## Baseline vigente

- La release [v1.2.0](https://github.com/Frank-0511/vite-mhb-email/releases/tag/v1.2.0) es el baseline funcional publicado.
- MHB-29 completada y mergeada a `master` (commits `b5f659d` y `5e18515`).
- MHB-20 mergeada a `master` (commits `4cc964f` y `619a425`).
- MHB-13 completada y mergeada a `master` (commit `5fe448a`).
- Las variables ESP `{{ }}` se preservan en el HTML final; `[[ page.* ]]` queda reservado para Maizzle.

## Entrega activa (MHB-28: Modularización de superficies web sobredimensionadas)

- **División modular de estilos:** `styles.css` dividido en 5 subhojas temáticas en `styles/` y `copy-html-modal.css` desacoplado bajo el umbral de 300 líneas.
- **JavaScript embebido extraído:** eliminación de scripts inline en `preview.html`, delegando a `mobile-tabs.js` y `more-menu.js`.
- **Web Component `<ef-skeleton>`:** implementación nativa en Light DOM con API declarativa y refactorización desacoplada de `preview-ready.js`.
- **Limpieza de superficie:** eliminación de fragmentos HTML huérfanos en `src/web/features/library/components/` y reglas CSS obsoletas.
- **Cero regresión:** integridad garantizada de diseño visual y de templates compilados (`dist/*.html`) sin alteración byte a byte.

### Controles de Calidad

| Control                                       | Comando                                | Resultado   |
| :-------------------------------------------- | :------------------------------------- | :---------- |
| Comprobación de rama                          | `bun scripts/ai/check-task-branch.mjs` | Verde       |
| Typecheck unificado + estricto                | `bun run typecheck`                    | En progreso |
| Pruebas unitarias/integración                 | `bun test`                             | En progreso |
| Linting completo (html, js/ts, md, json, css) | `bun run lint`                         | En progreso |
| Formato de código                             | `bun run format:check`                 | En progreso |
| Build pipeline                                | `bun run build`                        | En progreso |
| Validador HTML email                          | `bun run validate-email`               | En progreso |
| Verificación a11y y contraste                 | `bun run a11y-check`                   | En progreso |
| Sincronización de agentes                     | `bun run agents:check`                 | En progreso |

## Últimas entregas

- MHB-29: `Completada` el 2026-09-21; base de ejecución TypeScript establecida (tsconfig unificado y estricto, eslint 10, tests piloto TS nativos en Bun, control de inventario de 194 JS / 2 TS); commits `b5f659d` y `5e18515` en `master`.
- MHB-13: `Completada` el 2026-09-20; baseline completo de tipos `checkJs` en 190 archivos JS/MJS (0 errores tsc, 0 `@ts-ignore`), tipos ambientales en `types/`, suite de benchmark reproducible y mediciones comparativas Bun vs Node.js.
- MHB-20: `Completada` el 2026-09-20; integración hermética de build, render, delimitadores, peso, caché y exportación; commits `4cc964f` y `619a425` en `master`.
- Release `v1.2.0`: cierre de la Fase B publicado el 2026-09-18 (<https://github.com/Frank-0511/vite-mhb-email/releases/tag/v1.2.0>).

## Ejecuciones delegadas relevantes

| Ámbito | Estado     | Propiedad                              | Handoff                                               |
| :----- | :--------- | :------------------------------------- | :---------------------------------------------------- |
| MHB-29 | Completada | Base de ejecución TypeScript           | Aprobación técnica y merge a `master` (`5e18515`).    |
| MHB-13 | Completada | Baseline tipos y mediciones            | Verificación completa y merge a `master` (`5fe448a`). |
| MHB-20 | Completada | Tests integración, caché y exportación | Aceptación y merge a `master` en commit `619a425`.    |

## Decisiones y desviaciones vigentes

- **Light DOM en `<ef-skeleton>`:** Obligatorio para permitir que las utilidades Tailwind (`animate-pulse`) alcancen los elementos internos y no ocultar los IDs consumidos por scripts y tests.
- **División de `copy-html-modal.css`:** Dividido en `styles/modal-dialog.css` y `styles/modal-cards.css` para respetar el umbral de 300 líneas sin alterar ninguna regla ni valor de especificidad.
- **Eliminación de componentes huérfanos:** Los 5 fragmentos HTML en `src/web/features/library/components/` se eliminan al no tener referencias en runtime.

## Handoff

- Próxima acción inmediata: Implementación modular de fases F0 a F5 en `feature/mhb-28`.
- Siguiente tarea del roadmap:
  - MHB-30 (`desbloqueado`): Núcleo y validadores en TypeScript (prerrequisito MHB-29 completado).
  - MHB-14 (`desbloqueado`): Evidencia de uso y compatibilidad.
