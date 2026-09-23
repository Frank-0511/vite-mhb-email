# Estado de implementación — EmailForge Toolkit

## Resumen

- ID activo: MHB-37
- Estado: En progreso
- Implementador: Perfil TypeScript transversal
- Revisor: Revisor técnico independiente
- Rama: `feature/mhb-37`
- Última actualización: 2026-09-23
- Contrato activo: `docs/implementation/PLAN.md` (ajustado con convención modular y criterios de corrección)
- Nota de reapertura: Ejecutando plan de corrección `mhb-37-fix-plan.md` para separar contratos por responsabilidad (constants/types/guards/routes), eliminar reexports/alias, corregir uniones `Union | string`, deduplicar selectores ESLint y reforzar guards.

## Baseline vigente

- La release [v1.2.0](https://github.com/Frank-0511/vite-mhb-email/releases/tag/v1.2.0) es el baseline funcional publicado.
- La migración a TypeScript por capas (núcleo, CLI, servidor Vite y dashboard web) está completada y mergeada a `master`; la trazabilidad de los IDs cerrados vive en Git.
- Las variables ESP `{{ }}` se preservan en el HTML final; `[[ page.* ]]` queda reservado para Maizzle.

## Entrega activa (MHB-37: Contratos compartidos, constantes tipadas y guards de tipos)

- **Hechos de implementación:**
  1. Capa aislada `scripts/shared/contracts/` creada (`api-routes.ts`, `render-error.ts`, `events.ts`, `theme.ts`) con suite `contracts.test.ts` sin dependencias de Node.js ni módulos externos, excluida de `scripts/shared/index.ts`.
  2. Eliminados todos los magic strings en la frontera servidor↔cliente (`API_ROUTES`, `HEADER_X_ESP_VALIDATION`, `RENDER_ERROR_CODE`, `EVENTS`, `THEME`, `VIEW_MODE`, `VIEWPORT_MODE`, `COMPONENT_TYPE`, `MODAL_STATE`) tipados como uniones `as const`.
  3. Cero `@typedef` en `.ts` (7 removidos en `src/web/`), type guards exhaustivos en fronteras externas (`localStorage`, parámetros URL, respuestas de red).
  4. Guardas ESLint activadas (`no-explicit-any`, `consistent-type-imports`, `no-warning-comments` para `@typedef`, `no-restricted-syntax`, `no-restricted-imports`) y verificadas por `eslint-guards.test.ts` (22 tests).
  5. Límites de tamaño respetados (archivos fuente ≤ 250 líneas, tests ≤ 400 líneas, carpetas ≤ 8 archivos).
- **Riesgo residual:** Ninguno identificado; hashes de `dist/*.html` idénticos byte a byte a baseline y suite de 565 tests en verde.

### Controles de Calidad

| Control                        | Comando                                    | Resultado   |
| :----------------------------- | :----------------------------------------- | :---------- |
| Comprobación de rama           | `bun scripts/ai/check-task-branch.mjs`     | Verde       |
| Typecheck unificado            | `tsc --noEmit` (`bun run typecheck`)       | Verde       |
| Typecheck estricto             | `bun run typecheck:strict`                 | Verde       |
| Suite global de pruebas        | `bun run test` (565 tests, 76 archivos)    | Verde       |
| Linting completo               | `bun run lint` (html, js, md, json, css)   | Verde       |
| Formato de código              | `bun run format:check`                     | Verde       |
| Build y validación email       | `bun run build` / `bun run validate-email` | Verde       |
| Hashes SHA256 `dist/*.html`    | `sha256sum dist/*.html`                    | Inalterados |
| Cero `@typedef` en `.ts`       | `no-warning-comments` en ESLint            | 0 hallazgos |
| Cero magic strings dispersos   | `no-restricted-syntax` en ESLint           | 0 hallazgos |
| Aislamiento de contratos y web | `no-restricted-imports` en ESLint          | 0 hallazgos |

## Decisiones y desviaciones vigentes

- **Aislamiento puro de contratos:** `scripts/shared/contracts/` no se expone a través del barrel `scripts/shared/index.ts` para evitar la ingestión de módulos de Node en frontend.
- **Unificación de no-restricted-syntax en ESLint:** Bloque específico por entorno (`scripts/` vs `src/web/`) para evitar sobreescritura de reglas flat y soportar guardas de `localStorage` exclusivas de frontend.
- **Helper `getDefaultStorage` en viewport-controls:** Reduce duplicación y garantiza cumplimiento estricto del límite de 250 líneas (245 líneas al cierre tras formato Prettier).

## Handoff

- Próxima acción inmediata: Revisión técnica independiente de MHB-37 en rama `feature/mhb-37`.
- Siguiente tarea del roadmap:
  - MHB-34 (`desbloqueado` tras aprobación de MHB-37): Cierre total y modo estricto TypeScript.
  - MHB-14 (`desbloqueado`): Evidencia de uso y compatibilidad.
  - MHB-38 (`programada`): Migración en bloque a Maizzle 6 + Tailwind v4 (email y dashboard); no antes de 2027-01-15 salvo disparador, límite 2027-06-30; hasta entonces se mantiene Maizzle 5 + Tailwind v3.
