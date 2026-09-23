# MHB-37 — Plan de corrección

Plan temporal (se elimina al confirmar la tarea). Corrige la implementación
actual de MHB-37 (sin commitear en `feature/mhb-37`) y ajusta su contrato.

## Decisiones acordadas

1. `copy-html-modal.ts` (fachada de reexports) se convierte en `index.ts` puro.
2. El guard contra `Union | string` se activa con selector AST, revisando falsos
   positivos al activarlo.
3. Este plan se guarda aquí; la ejecución empieza por la fase 0.

## Hallazgos que motivan la corrección

| #   | Problema                                                                                                                                                           | Dónde                                                                                   |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| 1   | Reexporta lo que importa: `export type { RenderErrorLocation }`.                                                                                                   | `scripts/vite/services/render/render-error.ts`                                          |
| 2   | `NormalizedRenderError` duplica `RenderErrorPayload`, que no tiene consumidores.                                                                                   | `render-error.ts` / `contracts/render-error.ts`                                         |
| 3   | Reexports y alias: `RENDER_ERROR_MESSAGE`, `SAFE_RENDER_LOCATION_PATH`, `SafeRenderLocation`, `SAFE_RENDER_CAUSES` (muerto).                                       | `src/web/features/preview/modules/render/render-error-parser.ts`                        |
| 4   | `X \| string` colapsa a `string` (`Theme`, `ViewMode`, `ViewportMode`, `LibraryComponentType`, `RenderErrorCode`).                                                 | render.ts, render-request-handler.ts, contrast-reporter.ts, controles, state.ts, parser |
| 5   | Alias heredados `VIEW_MODE_RENDER`, `VIEW_MODE_SOURCE`, `VIEW_MODE_KEY`.                                                                                           | `view-mode-controls.ts`                                                                 |
| 6   | Builders de rutas repiten 9 `"/api/..."` en vez de derivar de `API_ROUTES`; `theme?: string`.                                                                      | `contracts/api-routes.ts`                                                               |
| 7   | `a11y-check.ts` mantiene `THEMES`/`ThemeType` propios en vez del contrato `THEME`.                                                                                 | `scripts/validators/a11y-check.ts`                                                      |
| 8   | Import `.js` vs `.ts`; selectores ESLint duplicados (244 líneas); reformateo fuera de alcance de `SELECTED_CLASSES`; tipos sin consumidor `ApiRoute`, `EventName`. | varios                                                                                  |

Causas en el plan original: la regla «tipos junto al módulo; `types.ts` solo con
≥2 consumidores» produce archivos mixtos; el paso 2 agrupa contratos por dominio
mezclando constantes, tipos, guards y builders; los criterios no prohíben
reexports, alias ni `Union | string`.

## Fase 0 — Ajuste de contrato

1. En `docs/implementation/PLAN.md` (MHB-37) sustituir la decisión «Los tipos
   viven junto al módulo que los posee…» por la convención de abajo.
2. Añadir criterios de aceptación: sin reexports en archivos de implementación,
   sin alias de símbolos, sin `Union | string`, sin constantes/tipos exportados
   sin consumidor, sin `enum`.
3. `STATUS.md`: MHB-37 → `En progreso` con nota de reapertura.

## Convención

| Qué                                                                        | Archivo                                  |
| -------------------------------------------------------------------------- | ---------------------------------------- |
| Objetos `as const`, literales, regex, números                              | `constants.ts`                           |
| Interfaces y uniones derivadas (`import type { X } from "./constants.ts"`) | `types.ts` (cero runtime)                |
| Type guards                                                                | `guards.ts`                              |
| Builders de rutas                                                          | `contracts/routes/`                      |
| `enum` / `const enum`                                                      | Prohibido (`erasableSyntaxOnly`, MHB-34) |

Ubicación:

- Server↔client: `scripts/shared/contracts/{constants,types,guards,routes}/<dominio>.ts`.
- Compartido web: `src/web/shared/{constants,types,guards}/` (`storage-keys.ts` no se mueve).
- Feature: `features/<f>/constants.ts`, `types.ts`, `guards.ts` (respeta ≤8 archivos por carpeta).
- Uso en un solo archivo: privado, sin `export`.

Todo lo que otro archivo importa vive en `constants`/`types`/`guards` y se
importa desde ahí. Barrels solo como `index.ts` puro sin implementación.

## Fase 1 — Contratos

```text
scripts/shared/contracts/
  constants/  api-routes.ts  render-error.ts  events.ts  theme.ts
  types/      render-error.ts  events.ts  theme.ts
  guards/     value-guard.ts  render-error.ts  events.ts  theme.ts
  routes/     api-routes.ts
  contracts.test.ts
```

- `guards/value-guard.ts`: `createValueGuard(OBJ)` sustituye las 6 copias del guard.
- Builders derivan de `API_ROUTES`; `renderTemplateRoute(template, theme?: Theme)`.
- `RENDER_ERROR_VERSION` pasa al contrato.
- Eliminar `ApiRoute` y `EventName`; `RenderErrorPayload` es el tipo único del payload.
- Test de contrato verifica además que `types/` no contiene runtime.

## Fase 2 — Servidor (`scripts/`)

| Archivo                                                      | Cambio                                                                   |
| ------------------------------------------------------------ | ------------------------------------------------------------------------ |
| `vite/services/render/render-error.ts`                       | Borrar `NormalizedRenderError` y el reexport; usar `RenderErrorPayload`. |
| `vite/services/render/index.ts`                              | Quitar reexports de tipos del contrato.                                  |
| `vite/services/render/render-request-handler.ts`             | Validar `theme` del query con `isTheme` + fallback; después `Theme`.     |
| `vite/api/render.ts`                                         | `applyPreviewTheme(html, theme: Theme)`.                                 |
| `vite/plugins/page-resolver.ts`                              | Import `.js` → `.ts`.                                                    |
| `validators/a11y-check.ts`                                   | Eliminar `THEMES`/`ThemeType`; usar `Object.values(THEME)`.              |
| `validators/contrast-calculator.ts` / `contrast-reporter.ts` | `name: THEME.LIGHT/DARK`; `theme: Theme`.                                |

## Fase 3 — Web (`src/web/`)

Preview:

- `features/preview/{constants,types,guards}.ts` con `VIEW_MODE`, `VIEWPORT_MODE`,
  `MODAL_STATE`, `EXPORT_MODE`.
- `applyViewMode(mode: ViewMode)`, `applyViewport(mode: ViewportMode)`; guard en
  la lectura de storage/DOM.
- Eliminar `VIEW_MODE_RENDER`, `VIEW_MODE_SOURCE`, `VIEW_MODE_KEY`; actualizar tests.
- `render-error-parser.ts`: sin reexports, sin `SafeRenderLocation`, sin
  `SAFE_RENDER_CAUSES`; `code` → `RenderErrorCode | undefined` vía `isRenderErrorCode`.
- `copy-html-modal.ts` → `copy-html/index.ts` puro; actualizar import en `main.ts`.
- Revertir el reformateo de `SELECTED_CLASSES`/`UNSELECTED_CLASSES` en `viewport-controls.ts`.

Library:

- `features/library/{constants,types,guards}.ts` con `COMPONENT_TYPE` y las
  interfaces de `state.ts` consumidas por ≥2 archivos.
- `currentType: LibraryComponentType | null` con guard al leer `dataset`.
- `components-api.ts`: `import type` separado.

## Fase 4 — Guards de ESLint (sin dependencias nuevas)

1. Deduplicar selectores en `CONTRACT_LITERAL_SELECTORS`; lista de Node vía
   `builtinModules` de `node:module`. Si `eslint.config.js` supera 250 líneas,
   extraer los selectores a un módulo aparte.
2. Sin `enum`: `TSEnumDeclaration`.
3. Sin reexports fuera de `index.ts`: `ExportNamedDeclaration[source]`,
   `ExportAllDeclaration`, `ExportNamedDeclaration[declaration=null]`.
4. `types.ts` / `types/**` sin runtime: `VariableDeclaration`,
   `FunctionDeclaration`, `ClassDeclaration`, imports de valor.
5. `constants.ts` / `constants/**` sin funciones ni declaraciones de tipo.
6. Sin `Union | string`: `TSUnionType:has(> TSStringKeyword):has(> TSTypeReference)`;
   revisar falsos positivos al activarlo.
7. Un fixture por guard nuevo en `scripts/validators/lint-guards/eslint-guards.test.ts`
   (dividir si supera 400 líneas).

Exports sin consumidor: verificación manual con `rg` como evidencia.

## Fase 5 — Commits

1. `docs(mhb-37)`: plan, skill `email-refactor-type-safety`, `AGENTS.md`, `agents:sync` + `agents:check`.
2. `refactor(mhb-37)`: contracts.
3. `refactor(mhb-37)`: web shared.
4. `refactor(mhb-37)`: library.
5. `refactor(mhb-37)`: preview.
6. `refactor(mhb-37)`: scripts.
7. `chore(mhb-37)`: guards ESLint + fixtures.

## Fase 6 — Verificación

- `bun run lint`, `typecheck`, `test`, `format:check`, `build`, `validate-email`,
  `a11y-check`, hashes `dist/*.html` idénticos al baseline, `git diff --check`.
- Evidencia `rg`: cero `| string` sobre uniones, cero reexports fuera de
  `index.ts`, cero `"/api/` fuera de contracts, cero exports sin consumidor.
- Inventario de mantenibilidad: ≤250 líneas por archivo fuente, ≤400 por test,
  ≤8 archivos por carpeta.
- Entregar `En revisión`; cierre por revisor distinto.
