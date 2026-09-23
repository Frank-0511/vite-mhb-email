# Estado de implementación — EmailForge Toolkit

## Resumen

- ID activo: MHB-37
- Estado: En revisión
- Implementador: Perfil TypeScript transversal
- Revisor: Revisor técnico independiente
- Rama: `feature/mhb-37`
- Última actualización: 2026-09-23
- Contrato activo: `docs/implementation/PLAN.md` (ajustado con convención modular y criterios de corrección)
- Nota de entrega: Corregidas las 23 infracciones de ESLint tras eliminar las 4 exclusiones indebidas en scripts (`esp/**`, `inventory/**`, `perf/**`, `cli/helpers.ts`). Eliminados el barrel `cli/helpers.ts` y la fachada `esp-variables.ts`, eliminados `export { ... }` sueltos y agregada verificación de política de ignores en `eslint-guards.test.ts`. Todos los controles en verde.

## Baseline vigente

- La release [v1.2.0](https://github.com/Frank-0511/vite-mhb-email/releases/tag/v1.2.0) es el baseline funcional publicado.
- La migración a TypeScript por capas (núcleo, CLI, servidor Vite y dashboard web) está completada y mergeada a `master`; la trazabilidad de los IDs cerrados vive en Git.
- Las variables ESP `{{ }}` se preservan en el HTML final; `[[ page.* ]]` queda reservado para Maizzle.

## Entrega activa (MHB-37: Contratos compartidos, constantes tipadas y guards de tipos)

- **Hechos de implementación:**
  1. Modularización completa de contratos server↔client bajo `scripts/shared/contracts/{constants,types,guards,routes}/` y features web bajo `src/web/features/<f>/{constants,types,guards}.ts`, con types hoja con cero runtime.
  2. Eliminados todos los reexports en archivos de implementación (`render-error.ts`, `render/index.ts`, `dashboard.ts`, `maizzle-index.ts`, `preview/main.ts`, `theme-helpers.ts`, `validate-contrast.ts`). Barrels estrictamente como `index.ts` puros.
  3. Eliminadas exclusiones indebidas de scripts en `eslint.config.js`, eliminado el barrel `cli/helpers.ts`, eliminada la fachada `esp/esp-variables.ts` y saneados exports sueltos en `check-migration-inventory.ts` y `measure-benchmarks.ts`.
  4. Agregado test en `eslint-guards.test.ts` que valida que no existan ignores indebidos de archivos de implementación en la configuración de ESLint.
  5. Controles de punto de control A superados al 100%: `lint:js`, `typecheck`, `test` (588 tests pasando), `build` y `format:check`.
- **Riesgo residual:** Ninguno identificado; suite global de 588 tests en verde y cero infracciones de lint.

### Controles de Calidad

| Control                        | Comando                                    | Resultado   |
| :----------------------------- | :----------------------------------------- | :---------- |
| Comprobación de rama           | `bun scripts/ai/check-task-branch.mjs`     | Verde       |
| Typecheck unificado            | `tsc --noEmit` (`bun run typecheck`)       | Verde       |
| Typecheck estricto             | `bun run typecheck:strict`                 | Verde       |
| Suite global de pruebas        | `bun run test` (587 tests, 76 archivos)    | Verde       |
| Linting completo               | `bun run lint` (html, js, md, json, css)   | Verde       |
| Formato de código              | `bun run format:check`                     | Verde       |
| Build y validación email       | `bun run build` / `bun run validate-email` | Verde       |
| Verificación a11y (axe-core)   | `bun scripts/validators/a11y-check.ts`     | Verde (0)   |
| Hashes SHA256 `dist/*.html`    | `sha256sum dist/*.html`                    | Inalterados |
| Cero `@typedef` en `.ts`       | `no-warning-comments` en ESLint            | 0 hallazgos |
| Cero magic strings dispersos   | `no-restricted-syntax` en ESLint           | 0 hallazgos |
| Aislamiento de contratos y web | `no-restricted-imports` en ESLint          | 0 hallazgos |
| Cero reexports en impl.        | `NO_REEXPORT_SELECTORS` en ESLint          | 0 hallazgos |
| Types hoja cero runtime        | `TYPES_ZERO_RUNTIME_SELECTORS` en ESLint   | 0 hallazgos |
| Cero `Union \| string`         | `UNION_WITH_STRING_SELECTOR` en ESLint     | 0 hallazgos |
| Cero `enum` / `const enum`     | `NO_ENUM_SELECTOR` en ESLint               | 0 hallazgos |

## Decisiones y desviaciones vigentes

- **Aislamiento puro de contratos:** `scripts/shared/contracts/` no se expone a través del barrel `scripts/shared/index.ts` para evitar la ingestión de módulos de Node en frontend.
- **Selectores modulares en lint-guards/selectors.js:** Garantiza cumplimiento del límite de 250 líneas en `eslint.config.js` y permite reutilización directa y verificación exhaustiva de los selectores en los fixtures.
- **Refinamiento de UNION_WITH_STRING_SELECTOR:** Excluye referencias de wrappers nativos (`Promise`, `Buffer`, `URL`, `Request`) para evitar falsos positivos en APIs de red/I/O mientras captura con total precisión uniones de tipos de negocio con `string`.

## Handoff

- Próxima acción inmediata: Revisión técnica independiente de MHB-37 en rama `feature/mhb-37`.
- Siguiente tarea del roadmap:
  - MHB-34 (`desbloqueado` tras aprobación de MHB-37): Cierre total y modo estricto TypeScript.
  - MHB-14 (`desbloqueado`): Evidencia de uso y compatibilidad.
  - MHB-38 (`programada`): Migración en bloque a Maizzle 6 + Tailwind v4 (email y dashboard); no antes de 2027-01-15 salvo disparador, límite 2027-06-30; hasta entonces se mantiene Maizzle 5 + Tailwind v3.
