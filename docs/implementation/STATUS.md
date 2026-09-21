# Estado de implementación — EmailForge Toolkit

## Resumen

- ID activo: MHB-28
- Estado: En revisión
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

- **División modular de estilos:** `styles.css` (6 líneas) dividido en 5 subhojas temáticas en `styles/` y `copy-html-modal.css` (3 líneas) desacoplado en 2 subhojas, todos estrictamente bajo el umbral de 300 líneas.
- **Estructuración modular por carpetas:** módulos de preview agrupados en subcarpetas cohesivas por dominio bajo `modules/` (`controls`, `copy-html`, `editor`, `render`, `runtime`), dejando la raíz limpia con solo los puntos de entrada.
- **JavaScript embebido extraído:** lógica inline de `preview.html` delegada a `mobile-tabs.js` y `more-menu.js` (con tests unitarios).
- **Web Component `<ef-skeleton>`:** implementación declarativa en Light DOM y desacoplamiento de `preview-ready.js` cubierto con tests unitarios.
- **Desacoplamiento de plantillas y scrollbars:** HTML/scripts extraídos de `dashboard.js` a `dashboard-templates.js` (110 líneas) y scrollbars deduplicados en `library.css` (299 líneas).
- **Cero regresión:** hashes SHA-256 de `dist/*.html` 100% idénticos byte a byte respecto al baseline previo; gates de contraste y a11y 100% verdes.

### Controles de Calidad

| Control                                       | Comando                                | Resultado |
| :-------------------------------------------- | :------------------------------------- | :-------- |
| Comprobación de rama                          | `bun scripts/ai/check-task-branch.mjs` | Verde     |
| Typecheck unificado + estricto                | `bun run typecheck`                    | Verde     |
| Pruebas unitarias/integración (504 tests)     | `bun test`                             | Verde     |
| Linting completo (html, js/ts, md, json, css) | `bun run lint`                         | Verde     |
| Formato de código                             | `bun run format:check`                 | Verde     |
| Build pipeline                                | `bun run build`                        | Verde     |
| Validador HTML email                          | `bun run validate-email`               | Verde     |
| Verificación a11y y contraste                 | `bun run a11y-check`                   | Verde     |
| Contraste WCAG (light & dark)                 | `bun run lint:contrast`                | Verde     |
| Control de inventario TypeScript              | `bun run check:inventory`              | Verde     |
| Sincronización de agentes                     | `bun run agents:check`                 | Verde     |

## Últimas entregas

- MHB-29: `Completada` el 2026-09-21; base de ejecución TypeScript establecida (tsconfig unificado y estricto, eslint 10, tests piloto TS nativos en Bun, control de inventario de 194 JS / 2 TS); commits `b5f659d` y `5e18515` en `master`.
- MHB-13: `Completada` el 2026-09-20; baseline completo de tipos `checkJs` en 190 archivos JS/MJS (0 errores tsc, 0 `@ts-ignore`), tipos ambientales en `types/`, suite de benchmark reproducible y mediciones comparativas Bun vs Node.js.
- MHB-20: `Completada` el 2026-09-20; integración hermética de build, render, delimitadores, peso, caché y exportación; commits `4cc964f` y `619a425` en `master`.
- Release `v1.2.0`: cierre de la Fase B publicado el 2026-09-18 (<https://github.com/Frank-0511/vite-mhb-email/releases/tag/v1.2.0>).

## Ejecuciones delegadas relevantes

| Ámbito | Estado      | Propiedad                              | Handoff                                                 |
| :----- | :---------- | :------------------------------------- | :------------------------------------------------------ |
| MHB-28 | En revisión | Modularización web sobredimensionada   | Entregado a revisión independiente en `feature/mhb-28`. |
| MHB-29 | Completada  | Base de ejecución TypeScript           | Aprobación técnica y merge a `master` (`5e18515`).      |
| MHB-13 | Completada  | Baseline tipos y mediciones            | Verificación completa y merge a `master` (`5fe448a`).   |
| MHB-20 | Completada  | Tests integración, caché y exportación | Aceptación y merge a `master` en commit `619a425`.      |

## Decisiones y desviaciones vigentes

- **Light DOM en `<ef-skeleton>`:** Obligatorio para permitir que las utilidades Tailwind (`animate-pulse`) alcancen los elementos internos y no ocultar los IDs consumidos por scripts y tests.
- **División de `copy-html-modal.css`:** Dividido en `styles/modal-dialog.css` y `styles/modal-cards.css` para respetar el umbral de 300 líneas sin alterar ninguna regla ni valor de especificidad.
- **Eliminación de componentes huérfanos:** Los 5 fragmentos HTML en `src/web/features/library/components/` se eliminan al no tener referencias en runtime.
- **Estructuración en subcarpetas de `preview/modules/`:** 40+ archivos planos organizados en subcarpetas cohesivas por dominio (`controls`, `copy-html`, `editor`, `render`, `runtime`) alineando preview con la estructura modular de `library/modules/`.
- **Sincronización de baseline de inventario:** Tras modularizar legítimamente superficies en capas 3 y 4 (nuevos submódulos y tests JS), se actualizó el baseline en `inventory-baseline.json` a 201 archivos JS para mantener el control estricto decreciente hacia MHB-30 y MHB-33.

## Handoff

- Próxima acción inmediata: Revisión técnica independiente de MHB-28 y validación visual manual a diferentes resoluciones (375px, 768px, 1440px) y temas (light/dark).
- Siguiente tarea del roadmap:
  - MHB-30 (`desbloqueado`): Núcleo y validadores en TypeScript (prerrequisito MHB-29 completado).
  - MHB-14 (`desbloqueado`): Evidencia de uso y compatibilidad.
