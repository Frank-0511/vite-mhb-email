# Estado de implementación — EmailForge Toolkit

## Resumen

- ID activo: MHB-35
- Estado: Completada
- Implementador: Perfil arquitectura frontend/shared
- Revisor: Usuario (confirmado el 2026-09-22)
- Rama: `feature/mhb-35`
- Última actualización: 2026-09-22
- Contrato activo: `docs/implementation/PLAN.md`

## Baseline vigente

- La release [v1.2.0](https://github.com/Frank-0511/vite-mhb-email/releases/tag/v1.2.0) es el baseline funcional publicado.
- MHB-28 completada en `feature/mhb-28`.
- MHB-29 completada y mergeada a `master` (commits `b5f659d` y `5e18515`).
- MHB-20 mergeada a `master` (commits `4cc964f` y `619a425`).
- MHB-13 completada y mergeada a `master` (commit `5fe448a`).
- Las variables ESP `{{ }}` se preservan en el HTML final; `[[ page.* ]]` queda reservado para Maizzle.

## Entrega activa (MHB-35: Consolidación de shared y deduplicación)

- **Adopción estricta de storage keys:** Cero cadenas literales (`"template-theme"`, `"app-theme"`, `"selectedComponentId"`) fuera de `storage-keys.js`; adoptado en `theme-manager.js`, `iframe-manager.js`, `theme-toggle-component.js` y `library/main.js`.
- **Eliminación de llamadas directas a `fetch()`:** Cero `fetch(` crudos en `src/web/features/**`; todo el tráfico web usa `fetchJSON`, `fetchText`, `postText` y `sendRequest` de `http-helpers.js`.
- **Saneamiento DOM y debounce en Library:** Eliminadas todas las ocurrencias de `document.getElementById` crudo en `library/main.js` (sustituidas por `queryRequired` y `querySafe`), y temporizador manual `setTimeout` de debounce reemplazado por `debounce` de `http-helpers.js`.
- **Centralización de formateo de bytes:** Creado `scripts/shared/format-helpers.js` (`formatBytes()`, `bytesToKB()`, constantes de límites) con suite de 10 tests; adoptado en `check-html-size.js`, `export/index.js` y `dashboard.js`.
- **Unificación de resolución de tema:** Creado `src/web/shared/utils/theme-helpers.js` con lectura, fallback seguro a dark y persistencia; deduplicando y desacoplando `theme-manager.js`, `iframe-manager.js` y `render-api.js` con suite de 6 tests.

### Controles de Calidad

| Control                                       | Comando                                | Resultado |
| :-------------------------------------------- | :------------------------------------- | :-------- |
| Comprobación de rama                          | `bun scripts/ai/check-task-branch.mjs` | Verde     |
| Typecheck unificado + estricto                | `bun run typecheck`                    | Verde     |
| Pruebas unitarias/integración (529 tests)     | `bun test`                             | Verde     |
| Linting completo (html, js/ts, md, json, css) | `bun run lint`                         | Verde     |
| Formato de código                             | `bun run format:check`                 | Verde     |
| Build pipeline                                | `bun run build`                        | Verde     |
| Validador HTML email                          | `bun run validate-email`               | Verde     |
| Verificación a11y y contraste                 | `bun run a11y-check`                   | Verde     |
| Contraste WCAG (light & dark)                 | `bun run lint:contrast`                | Verde     |
| Control de inventario TypeScript              | `bun run check:inventory`              | Verde     |
| Sincronización de agentes                     | `bun run agents:check`                 | Verde     |

## Últimas entregas

- MHB-35: `Completada` el 2026-09-22; consolidación de utilidades shared (`format-helpers`, `theme-helpers`), adopción estricta de storage keys, eliminación de fetch crudo y saneamiento de render inicial de skeletons sin FOUC en preview; rama `feature/mhb-35`.
- MHB-28: `Completada` el 2026-09-21; modularización de superficies web sobredimensionadas (< 300 líneas en `src/web/**`, arquitectura `preview/modules/` por dominios, Web Component `<ef-skeleton>` en Light DOM, extracción de JS inline, cero regresión en `dist/*.html`); rama `feature/mhb-28`.
- MHB-29: `Completada` el 2026-09-21; base de ejecución TypeScript establecida (tsconfig unificado y estricto, eslint 10, tests piloto TS nativos en Bun, control de inventario de 194 JS / 2 TS); commits `b5f659d` y `5e18515` en `master`.
- MHB-13: `Completada` el 2026-09-20; baseline completo de tipos `checkJs` en 190 archivos JS/MJS (0 errores tsc, 0 `@ts-ignore`), tipos ambientales en `types/`, suite de benchmark reproducible y mediciones comparativas Bun vs Node.js.
- MHB-20: `Completada` el 2026-09-20; integración hermética de build, render, delimitadores, peso, caché y exportación; commits `4cc964f` y `619a425` en `master`.
- Release `v1.2.0`: cierre de la Fase B publicado el 2026-09-18 (<https://github.com/Frank-0511/vite-mhb-email/releases/tag/v1.2.0>).

## Ejecuciones delegadas relevantes

| Ámbito | Estado     | Propiedad                              | Handoff                                                                    |
| :----- | :--------- | :------------------------------------- | :------------------------------------------------------------------------- |
| MHB-35 | Completada | Consolidación shared y deduplicación   | Aprobación técnica y cierre confirmado por el usuario en `feature/mhb-35`. |
| MHB-28 | Completada | Modularización web sobredimensionada   | Aprobación técnica y cierre confirmado por el usuario en `feature/mhb-28`. |
| MHB-29 | Completada | Base de ejecución TypeScript           | Aprobación técnica y merge a `master` (`5e18515`).                         |
| MHB-13 | Completada | Baseline tipos y mediciones            | Verificación completa y merge a `master` (`5fe448a`).                      |
| MHB-20 | Completada | Tests integración, caché y exportación | Aceptación y merge a `master` en commit `619a425`.                         |

## Decisiones y desviaciones vigentes

- **Sincronización de baseline de inventario para MHB-35:** Incorporación de 5 archivos JS/MJS legítimos (`format-helpers.js`, `format-helpers.test.js`, `theme-helpers.js`, `theme-helpers.test.js`, `http-helpers.test.js`), elevando el baseline a 206 archivos JS para control estricto decreciente hacia MHB-30 y MHB-33.
- **Robustez en helpers de red:** `fetchJSON` y `fetchText` admiten respuestas mockeadas de test verificando explícitamente `response.ok === false` y códigos HTTP fuera de rango 200-299 para garantizar compatibilidad con mocks mínimos de tests unitarios existentes.
- **Light DOM en `<ef-skeleton>`:** Obligatorio para permitir que las utilidades Tailwind (`animate-pulse`) alcancen los elementos internos y no ocultar los IDs consumidos por scripts y tests.
- **División de `copy-html-modal.css`:** Dividido en `styles/modal-dialog.css` y `styles/modal-cards.css` para respetar el umbral de 300 líneas sin alterar ninguna regla ni valor de especificidad.
- **Eliminación de componentes huérfanos:** Los 5 fragmentos HTML en `src/web/features/library/components/` se eliminan al no tener referencias en runtime.
- **Estructuración en subcarpetas de `preview/modules/`:** 40+ archivos planos organizados en subcarpetas cohesivas por dominio (`controls`, `copy-html`, `editor`, `render`, `runtime`) alineando preview con la estructura modular de `library/modules/`.
- **Política de refactor integrado y límites cuantitativos:** Se acuerda no crear más tareas de refactor aisladas; todo trabajo debe refactorizar mientras avanza respetando límites estrictos (≤250 líneas archivo fuente, ≤8 archivos por carpeta).

## Handoff

- Próxima acción inmediata: Merge de rama `feature/mhb-35` a `master` y preparación de rama `feature/mhb-30`.
- Siguiente tarea del roadmap:
  - MHB-30 (`desbloqueado`): Núcleo y validadores en TypeScript.
  - MHB-14 (`desbloqueado`): Evidencia de uso y compatibilidad.
