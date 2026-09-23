# Estado de implementación — EmailForge Toolkit

## Resumen

- ID activo: MHB-37
- Estado: En revisión
- Implementador: Perfil TypeScript transversal
- Revisor: Revisor técnico independiente
- Rama: `feature/mhb-37`
- Última actualización: 2026-09-23
- Contrato activo: `docs/implementation/PLAN.md` (ajustado con convención modular y criterios de corrección)
- Nota de cierre de implementación: Ejecutado el plan de corrección `mhb-37-fix-plan.md` al 100%. Contratos modularizados en constants/types/guards/routes, eliminados todos los reexports y alias en archivos de implementación, eliminadas uniones `Union | string`, selectores ESLint deduplicados en módulo modular (`selectors.js`), 5 nuevos guards con 43 fixtures en suite dedicada, suite completa de 587 tests pasando y hashes de templates intactos.

## Baseline vigente

- La release [v1.2.0](https://github.com/Frank-0511/vite-mhb-email/releases/tag/v1.2.0) es el baseline funcional publicado.
- La migración a TypeScript por capas (núcleo, CLI, servidor Vite y dashboard web) está completada y mergeada a `master`; la trazabilidad de los IDs cerrados vive en Git.
- Las variables ESP `{{ }}` se preservan en el HTML final; `[[ page.* ]]` queda reservado para Maizzle.

## Entrega activa (MHB-37: Contratos compartidos, constantes tipadas y guards de tipos)

- **Hechos de implementación:**
  1. Modularización completa de contratos server↔client bajo `scripts/shared/contracts/{constants,types,guards,routes}/` y features web bajo `src/web/features/<f>/{constants,types,guards}.ts`, con types hoja con cero runtime.
  2. Eliminados todos los reexports en archivos de implementación (`render-error.ts`, `render/index.ts`, `dashboard.ts`, `maizzle-index.ts`, `preview/main.ts`, `theme-helpers.ts`, `validate-contrast.ts`). Barrels estrictamente como `index.ts` puros.
  3. Eliminados alias y magic strings residuales (`VIEW_MODE_RENDER`, `VIEW_MODE_SOURCE`, `VIEW_MODE_KEY`, `SAFE_RENDER_CAUSES`, `SafeRenderLocation`).
  4. Corregido colapso `Union | string` (eliminada la unión a string en `SeverityType` de `context.ts` y refinado el guard AST contra falsos positivos de wrappers nativos como `Promise`, `Buffer`, `URL`, `Request`).
  5. Selectores de ESLint modularizados en `scripts/validators/lint-guards/selectors.js` usando `builtinModules` de `node:module`, conservando `eslint.config.js` en 226 líneas (≤ 250).
  6. 5 nuevos guards sintácticos implementados y cubiertos por 43 tests en `scripts/validators/lint-guards/eslint-guards.test.ts` (368 líneas ≤ 400).
  7. Límites de tamaño y carpetas respetados estrictamente (todos los no-test ≤ 250 líneas, tests ≤ 400 líneas, ≤ 8 archivos por directorio).
- **Riesgo residual:** Ninguno identificado; hashes de `dist/*.html` idénticos byte a byte al baseline y suite global de 587 tests en verde.

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
