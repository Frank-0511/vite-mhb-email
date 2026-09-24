# Estado de implementación — EmailForge Toolkit

## Resumen

- ID activo: MHB-39
- Estado: En revisión
- Implementador: Perfil TypeScript transversal
- Revisor: Revisor técnico independiente
- Rama: `feature/mhb-39`
- Última actualización: 2026-09-24
- Contrato activo: `docs/implementation/PLAN.md` (MHB-39)
- Nota de cierre de implementación: Finalizada la implementación y corrección de hallazgos de MHB-39. Se estandarizaron convenciones de nombres mediante 48 renombres con `git mv` eliminando toda redundancia de carpeta, se garantizó que los barrels `index.ts` sean puros (lógica extraída a `registry.ts`), se añadieron tests y manejo seguro de `res.headersSent` en `asyncHandler`, se ajustó `require-await` en ESLint (error en JS/MJS, off en TS) y se validaron los límites de archivo/carpeta y 0 hallazgos en linting con tipos.

## Baseline vigente

- La release [v1.2.0](https://github.com/Frank-0511/vite-mhb-email/releases/tag/v1.2.0) es el baseline funcional publicado.
- La migración a TypeScript por capas (núcleo, CLI, servidor Vite y dashboard web) está completada y mergeada a `master`; la trazabilidad de los IDs cerrados vive en Git.
- Las variables ESP `{{ }}` se preservan en el HTML final; `[[ page.* ]]` queda reservado para Maizzle.

## Entrega activa (MHB-39: Convenciones de nombres de archivo y linting con tipos)

- **Hechos de implementación:**
  1. Renombrados 48 archivos con `git mv` eliminando prefijos redundantes de carpeta en su totalidad (cero excepciones).
  2. Extraída lógica de `scripts/validators/email-rules/rules/index.ts` a `registry.ts` garantizando que todo `index.ts` sea un barrel puro con reexports.
  3. Actualizado `scripts/validators/lint-guards/file-tree.test.ts` (196 líneas) validando límites (250 prod / 400 test, reconociendo `*.fixtures.ts` y `test-helpers.ts`), max 8 archivos por carpeta, sin nombres genéricos, sin prefijos redundantes y barrels puros.
  4. Activado linting con tipos en `eslint.config.js` (`project: ["./tsconfig.strict.json"]`) reduciendo a 0 los hallazgos en todas las reglas tipadas. Ajustado `require-await` como error en JS/MJS y off en TS.
  5. Mejorado `asyncHandler` en `scripts/vite/api/http.ts` con manejo de `res.headersSent` y test co-locado `http.test.ts` con cobertura completa.
- **Riesgos residuales:**
  1. Incremento medido en `lint:js` de +1.95s (de 1.81s a 3.76s) debido al análisis semántico de `parserOptions.project`, balanceado por la erradicación completa de promesas flotantes y tipos redundantes.

### Controles de Calidad

| Control                  | Comando                                | Resultado                          |
| :----------------------- | :------------------------------------- | :--------------------------------- |
| Comprobación de rama     | `bun scripts/ai/check-task-branch.mjs` | Pasó (feature/mhb-39)              |
| Typecheck unificado      | `tsc --noEmit` (`bun run typecheck`)   | Pasó (0 errores en ambos tsconfig) |
| Suite global de pruebas  | `bun run test`                         | Pasó (598 tests, 78 suites)        |
| Linting completo         | `bun run lint`                         | Pasó (HTML, JS, MD, JSON, CSS)     |
| Formato de código        | `bun run format:check`                 | Pasó (100% Prettier)               |
| Build y validación email | `bun run build`                        | Pasó (6 templates, 0 errores)      |
| Validación email         | `bun run validate-email`               | Pasó (0 errores)                   |
| Adaptadores de agentes   | `bun run agents:check`                 | Pasó (7 targets declarados)        |
| Diff de Git              | `git diff --check`                     | Pasó (limpio)                      |

### Evidencia de Validación

#### Conteo de hallazgos por regla con tipos

| Regla con tipos                                      | Antes (`master`) | Después (`HEAD`) |
| :--------------------------------------------------- | :--------------: | :--------------: |
| `@typescript-eslint/no-floating-promises`            |        8         |        0         |
| `@typescript-eslint/no-misused-promises`             |        2         |        0         |
| `@typescript-eslint/await-thenable`                  |        1         |        0         |
| `@typescript-eslint/no-redundant-type-constituents`  |        9         |        0         |
| `@typescript-eslint/require-await` / `require-await` |        0         |        0         |
| `@typescript-eslint/return-await`                    |        0         |        0         |
| **Total**                                            |      **20**      |      **0**       |

#### Validación manual

- **Build limpio e idempotente:** `bun run build` ejecutado 2 veces consecutivas sin diffs en `dist/`.
- **Endpoints Vite (`bun run dev`):**
  - `GET /api/templates` → HTTP 200
  - `GET /api/data?template=welcome` → HTTP 200
  - `GET /api/components` → HTTP 200
  - `POST /api/cache/invalidate?template=welcome` → HTTP 200
  - `GET /api/render?template=welcome` → HTTP 200
  - `POST /api/copy-html?template=welcome` → HTTP 200

#### Tabla de renombres aplicados (48 archivos)

| Ruta anterior                                                             | Ruta nueva                                                           |
| :------------------------------------------------------------------------ | :------------------------------------------------------------------- |
| `scripts/build/build-helper.test.ts`                                      | `scripts/build/ensure-build.test.ts`                                 |
| `scripts/build/build-helper.ts`                                           | `scripts/build/ensure-build.ts`                                      |
| `scripts/build/build-render-cache-export-marketing.test.ts`               | `scripts/build/render-cache-export-marketing.test.ts`                |
| `scripts/build/build-render-cache-export-transactional.test.ts`           | `scripts/build/render-cache-export-transactional.test.ts`            |
| `scripts/build/build-render-cache-export.test-fixtures.ts`                | `scripts/build/render-cache-export.fixtures.ts`                      |
| `scripts/build/build-selective.test.ts`                                   | `scripts/build/selective.test.ts`                                    |
| `scripts/build/build-selective.ts`                                        | `scripts/build/selective.ts`                                         |
| `scripts/cli/index.ts`                                                    | `scripts/cli/main.ts`                                                |
| `scripts/esp/esp-constants.ts`                                            | `scripts/esp/constants.ts`                                           |
| `scripts/esp/esp-data-filter.test.ts`                                     | `scripts/esp/data-filter.test.ts`                                    |
| `scripts/esp/esp-data-filter.ts`                                          | `scripts/esp/data-filter.ts`                                         |
| `scripts/esp/esp-extractor.test.ts`                                       | `scripts/esp/extractor.test.ts`                                      |
| `scripts/esp/esp-extractor.ts`                                            | `scripts/esp/extractor.ts`                                           |
| `scripts/esp/esp-frontmatter.test.ts`                                     | `scripts/esp/frontmatter.test.ts`                                    |
| `scripts/esp/esp-frontmatter.ts`                                          | `scripts/esp/frontmatter.ts`                                         |
| `scripts/esp/esp-sources.test.ts`                                         | `scripts/esp/sources.test.ts`                                        |
| `scripts/esp/esp-sources.ts`                                              | `scripts/esp/sources.ts`                                             |
| `scripts/esp/esp-variables.test.ts`                                       | `scripts/esp/validator.test.ts`                                      |
| `scripts/esp/esp-validator.ts`                                            | `scripts/esp/validator.ts`                                           |
| `scripts/export/index.ts`                                                 | `scripts/export/main.ts`                                             |
| `scripts/export/export-screenshot.ts`                                     | `scripts/export/screenshot.ts`                                       |
| `scripts/inventory/inventory-parser.ts`                                   | `scripts/inventory/parser.ts`                                        |
| `scripts/inventory/inventory-reporter.ts`                                 | `scripts/inventory/reporter.ts`                                      |
| `scripts/validators/a11y-check.ts`                                        | `scripts/validators/check-a11y.ts`                                   |
| `scripts/validators/email-rules/test-fixtures.ts`                         | `scripts/validators/email-rules/rules.fixtures.ts`                   |
| `scripts/validators/email-rules/rules/content/esp-variables-rule.test.ts` | `scripts/validators/email-rules/rules/content/esp-variables.test.ts` |
| `scripts/validators/email-rules/rules/content/esp-variables-rule.ts`      | `scripts/validators/email-rules/rules/content/esp-variables.ts`      |
| `scripts/validators/email-rules/rules/structure/max-width-check.test.ts`  | `scripts/validators/email-rules/rules/structure/max-width.test.ts`   |
| `scripts/validators/email-rules/rules/structure/max-width-check.ts`       | `scripts/validators/email-rules/rules/structure/max-width.ts`        |
| `scripts/vite/api/maizzle-index.ts`                                       | `scripts/vite/plugins/maizzle-dev-server.ts`                         |
| `scripts/vite/services/render/render-error.test.ts`                       | `scripts/vite/services/render/error.test.ts`                         |
| `scripts/vite/services/render/render-error.ts`                            | `scripts/vite/services/render/error.ts`                              |
| `scripts/vite/services/render/render-request-handler.test.ts`             | `scripts/vite/services/render/request-handler.test.ts`               |
| `scripts/vite/services/render/render-request-handler.ts`                  | `scripts/vite/services/render/request-handler.ts`                    |
| `src/web/features/preview/modules/copy-html/copy-html-controller.test.ts` | `src/web/features/preview/modules/copy-html/controller.test.ts`      |
| `src/web/features/preview/modules/copy-html/copy-html-controller.ts`      | `src/web/features/preview/modules/copy-html/controller.ts`           |
| `src/web/features/preview/modules/copy-html/copy-html-dialog.ts`          | `src/web/features/preview/modules/copy-html/dialog.ts`               |
| `src/web/features/preview/modules/copy-html/copy-html-formatters.test.ts` | `src/web/features/preview/modules/copy-html/formatters.test.ts`      |
| `src/web/features/preview/modules/copy-html/copy-html-formatters.ts`      | `src/web/features/preview/modules/copy-html/formatters.ts`           |
| `src/web/features/preview/modules/copy-html/copy-html-view.ts`            | `src/web/features/preview/modules/copy-html/view.ts`                 |
| `src/web/features/preview/modules/editor/editor-menu-filter.test.ts`      | `src/web/features/preview/modules/editor/menu-filter.test.ts`        |
| `src/web/features/preview/modules/editor/editor-menu-filter.ts`           | `src/web/features/preview/modules/editor/menu-filter.ts`             |
| `src/web/features/preview/modules/render/render-api.test.ts`              | `src/web/features/preview/modules/render/api.test.ts`                |
| `src/web/features/preview/modules/render/render-api.ts`                   | `src/web/features/preview/modules/render/api.ts`                     |
| `src/web/features/preview/modules/render/render-error-parser.test.ts`     | `src/web/features/preview/modules/render/error-parser.test.ts`       |
| `src/web/features/preview/modules/render/render-error-parser.ts`          | `src/web/features/preview/modules/render/error-parser.ts`            |
| `src/web/features/preview/modules/render/render-error-view.test.ts`       | `src/web/features/preview/modules/render/error-view.test.ts`         |
| `src/web/features/preview/modules/render/render-error-view.ts`            | `src/web/features/preview/modules/render/error-view.ts`              |

## Decisiones y desviaciones vigentes

- **Dependencia de desarrollo:** Autorizada `eslint-plugin-check-file@3.3.2` fijada exacta para forzar kebab-case y blocklist de helpers/utils.
- **Linting con tipos:** Configurado sobre `tsconfig.strict.json` en ESLint sin alterar los archivos `tsconfig*.json`.
- **Envoltorio async de middlewares:** Todo handler async en endpoints Vite se envuelve con `asyncHandler` en `scripts/vite/api/http.ts` para captura determinista de excepciones y respuesta JSON 500, verificando `res.headersSent`.
- **Pruebas de guards sintéticos:** En `eslint-guards.test.ts` se anula `parserOptions.project` para evaluar snippets en memoria mediante AST puro sin latencia ni dependencia de disco.
- **Barrels index.ts puros:** Todos los `index.ts` bajo `scripts/` y `src/` actúan exclusivamente como puntos de reexport (`export ... from`), verificados automáticamente por `file-tree.test.ts`.

## Handoff

- Próxima acción inmediata: Revisión técnica independiente de MHB-39 para confirmar cierre.
- Siguiente tarea del roadmap:
  - MHB-34 (`desbloqueada` tras MHB-39): Cierre total y modo estricto TypeScript.
  - MHB-14 (`desbloqueado`): Evidencia de uso y compatibilidad.
  - MHB-38 (`programada`): Migración en bloque a Maizzle 6 + Tailwind v4.
