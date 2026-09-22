# Estado de implementación — EmailForge Toolkit

## Resumen

- ID activo: MHB-30
- Estado: Completada
- Implementador: Perfil TypeScript/backend
- Revisor: Frank-0511 (Aprobación técnica usuario)
- Rama: `feature/mhb-30`
- Última actualización: 2026-09-22
- Contrato activo: `docs/implementation/PLAN.md`

## Baseline vigente

- La release [v1.2.0](https://github.com/Frank-0511/vite-mhb-email/releases/tag/v1.2.0) es el baseline funcional publicado.
- MHB-35 completada y mergeada a `master` (commit `b495ec5`).
- MHB-28 completada en `feature/mhb-28`.
- MHB-29 completada y mergeada a `master` (commits `b5f659d` y `5e18515`).
- MHB-20 mergeada a `master` (commits `4cc964f` y `619a425`).
- MHB-13 completada y mergeada a `master` (commit `5fe448a`).
- Las variables ESP `{{ }}` se preservan en el HTML final; `[[ page.* ]]` queda reservado para Maizzle.

## Entrega activa (MHB-30: Núcleo y validadores en TypeScript)

- **Estructuración en subdirectorios temáticos:** Organización de `scripts/shared/` en `io/`, `template/`, `ui/`, `env/` y `rules/` en `structure/`, `accessibility/`, `content/` respetando el límite estricto de ≤ 8 archivos fuente por carpeta.
- **División de módulos sobredimensionados:** Desacople de `validate-contrast.js` (261 líneas), `check-migration-inventory.js` (335 líneas), `measure-benchmarks.js` (321 líneas) y `build-render-cache-export.test.js` (571 líneas) para cumplir ≤ 250 líneas (y tests ≤ 400 líneas).
- **Desacoplamiento hero test:** Eliminación de dependencia cruzada desde `src/emails/partials/organisms/hero/index.test.js` hacia `scripts/shared/component-folders.js`.
- **Desambiguación de nombres:** Renombrado de `rules/esp-variables.js` a `rules/content/esp-variables-rule.ts` preservando `ruleId: "esp-variables"`.
- **Conversión TypeScript estricta:** Migración a `.ts` con tipado estricto para `scripts/shared/**`, `scripts/esp/**`, `scripts/build/**`, `scripts/validators/**`, `scripts/inventory/**`, `scripts/perf/**` y hero test.

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

- MHB-30: `Completada` el 2026-09-22; núcleo, build, ESP, validadores, benchmarks e inventario migrados a TypeScript estricto (0 errores tsc, 529 tests verdes, hashes `dist/*.html` idénticos byte a byte, layer-1-core en 0 JS / 74 TS); rama `feature/mhb-30`.
- MHB-35: `Completada` el 2026-09-22; consolidación de utilidades shared (`format-helpers`, `theme-helpers`), adopción estricta de storage keys, eliminación de fetch crudo y saneamiento de render inicial de skeletons sin FOUC en preview; rama `feature/mhb-35`.
- MHB-28: `Completada` el 2026-09-21; modularización de superficies web sobredimensionadas (< 300 líneas en `src/web/**`, arquitectura `preview/modules/` por dominios, Web Component `<ef-skeleton>` en Light DOM, extracción de JS inline, cero regresión en `dist/*.html`); rama `feature/mhb-28`.
- MHB-29: `Completada` el 2026-09-21; base de ejecución TypeScript establecida (tsconfig unificado y estricto, eslint 10, tests piloto TS nativos en Bun, control de inventario de 194 JS / 2 TS); commits `b5f659d` y `5e18515` en `master`.
- MHB-13: `Completada` el 2026-09-20; baseline completo de tipos `checkJs` en 190 archivos JS/MJS (0 errores tsc, 0 `@ts-ignore`), tipos ambientales en `types/`, suite de benchmark reproducible y mediciones comparativas Bun vs Node.js.
- MHB-20: `Completada` el 2026-09-20; integración hermética de build, render, delimitadores, peso, caché y exportación; commits `4cc964f` y `619a425` en `master`.
- Release `v1.2.0`: cierre de la Fase B publicado el 2026-09-18 (<https://github.com/Frank-0511/vite-mhb-email/releases/tag/v1.2.0>).

## Ejecuciones delegadas relevantes

| Ámbito | Estado     | Propiedad                              | Handoff                                                                    |
| :----- | :--------- | :------------------------------------- | :------------------------------------------------------------------------- |
| MHB-30 | Completada | Núcleo y validadores en TS             | Aprobación técnica y cierre confirmado por el usuario en `feature/mhb-30`. |
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

- Entrega de MHB-30: Completada en rama `feature/mhb-30`.
  - Commits en rama:
    - `14af516`: `feat(shared): estructurar en subdirectorios tematicos y migrar a typescript estricto (MHB-30)`
    - `73b5fb4`: `feat(esp): migrar subsistema esp a typescript estricto (MHB-30)`
    - `a0ab073`: `feat(build): migrar pipeline de build y modularizar tests de integracion a typescript (MHB-30)`
    - `7ce545b`: `feat(validators): migrar suite de validadores y reglas a typescript estricto (MHB-30)`
    - `653c69e`: `feat(tooling): migrar inventory y benchmarks a typescript modular (MHB-30)`
  - Evidencia de calidad:
    - `bun run typecheck`: 0 errores en base y `tsconfig.strict.json`.
    - `bun test`: 529 pasados en 73 suites, 0 fallos.
    - `bun run lint:js`: 0 errores.
    - `bun run build`: 6 templates generados en 3.35s.
    - `shasum -a 256 dist/*.html`: hashes idénticos al baseline byte a byte.
    - `bun run validate-email`: 0 errores de compatibilidad.
    - `bun run a11y-check`: 0 violaciones axe-core en light y dark.
    - `bun run lint:contrast`: 26 contrastes WCAG conformes.
    - `bun run check:inventory`: Capa `layer-1-core` en 0 JS / 74 TS (`✅ Migrado`), total proyecto 135 JS / 82 TS.
    - `bun run agents:check`: 7 adaptadores declarados válidos.
  - Riesgos residuales:
    - Declaraciones ambientales en `types/fs-extra.d.ts` cubren sync y async methods para capas posteriores (MHB-31).
  - Próxima acción inmediata: Merge de la rama `feature/mhb-30` a `master` mediante Pull Request.
- Siguiente tarea del roadmap:
  - MHB-31 (`desbloqueado`): CLI, exportación y correo en TypeScript.
  - MHB-14 (`desbloqueado`): Evidencia de uso y compatibilidad.
