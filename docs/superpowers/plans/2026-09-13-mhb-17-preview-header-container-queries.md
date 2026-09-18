# MHB-17 Preview Header Container Queries Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adaptar el header del preview al ancho efectivo de `#right-panel`, conservar el cambio de paneles basado en viewport y terminar sin reglas, markup, estado JavaScript ni pruebas que hayan quedado obsoletos por la migración.

**Architecture:** `@media` seguirá siendo propietario del modo general de la aplicación (panel único, tabs y menú móvil), mientras un container nombrado `preview-panel` en `#right-panel` controlará la distribución y densidad del header. La migración se divide en equivalencia y limpieza: primero se demuestra el comportamiento responsive con el DOM existente; después se retira únicamente lo que tenga evidencia de no tener consumidores, incluida la duplicación actual entre `data-view-mode` e `is-source-mode`.

**Tech Stack:** HTML, CSS, Container Queries, JavaScript ESM, Bun, Vitest, ESLint, Prettier.

**Spec:** `docs/implementation/PLAN.md` (`MHB-17 — Alternar render y código fuente`) más las restricciones de diseño aprobadas por el usuario el 2026-09-13.

## Global Constraints

- Esta es una corrección dentro de MHB-17 y se ejecuta únicamente en `feature/mhb-17`.
- Preservar el diff actual de `preview.html`, `styles.css`, `view-mode-controls.js`, `view-mode-controls.test.js` y `STATUS.md`; no revertir ni atribuir cambios preexistentes a esta migración.
- No alterar IDs funcionales, listeners, ARIA, navegación por teclado, `sessionStorage`, alternancia render/código, iframe, HTML compilado, APIs Vite, templates, Maizzle, Handlebars ni variables ESP.
- Mantener los tokens `--ef-*`; no modificar la identidad Space Blue ni atravesar el límite del iframe.
- `styles.css` será la única fuente de Grid, Flexbox, wrap, gap, padding y alineación del header. El HTML conservará solo utilidades que no compitan con esas propiedades.
- No añadir JavaScript para calcular anchos o emular Container Queries.
- Conservar la progresión visual `label completo -> label corto -> solo icono`, con nombre accesible estable, `title` y foco visible.
- Los candidatos iniciales de container son `1151px`, `850px` y `710px`, derivados del layout vigente. No pasan a ser thresholds definitivos hasta verificar contenido, overflow y sus límites `x - 1`, `x`, `x + 1`.
- La limpieza es obligatoria, pero solo después de aceptar la equivalencia de la Fase A. No se elimina un wrapper, selector, atributo, clase o prueba sin buscar y revisar todos sus consumidores.
- No crear dependencias, no tocar `dist/`, no incrementar versión, no publicar, no hacer commit ni cambiar MHB-17 a `Completada` sin autorización explícita.
- El resultado final permanece `En revisión` hasta aceptación visual independiente.

---

### Task 1: Congelar alcance y establecer la línea base

**Files:**

- Read: `docs/implementation/PLAN.md`
- Read: `docs/implementation/STATUS.md`
- Read: `src/web/features/preview/preview.html`
- Read: `src/web/features/preview/styles.css`
- Read: `src/web/features/preview/view-mode-controls.js`
- Read: `src/web/features/preview/view-mode-controls.test.js`

**Interfaces:**

- Consumes: contrato MHB-17 y diff no confirmado existente.
- Produces: inventario de reglas de viewport, reglas exclusivas del header y consumidores DOM/JS que condicionan la migración.

- [ ] **Step 1: Confirmar rama, estado y contrato antes de editar**

  Run:

  ```bash
  git status --short
  git branch --show-current
  bun run check:task-branch
  ```

  Expected: rama `feature/mhb-17`; los cinco archivos ya modificados se reconocen como trabajo preexistente, este plan es la única ruta nueva y no aparecen otras rutas inesperadas atribuibles a esta ejecución.

- [ ] **Step 2: Capturar el diff de las superficies protegidas para comparación posterior**

  Run:

  ```bash
  git diff -- docs/implementation/STATUS.md src/web/features/preview/preview.html src/web/features/preview/styles.css src/web/features/preview/view-mode-controls.js src/web/features/preview/view-mode-controls.test.js
  ```

  Expected: el implementador identifica por separado los cambios existentes de MHB-17 y los cambios que añadirá esta corrección.

- [ ] **Step 3: Clasificar cada regla responsive actual por propietario**

  Run:

  ```bash
  rg -n '@media|@container|right-panel|preview-top-container|preview-header-bar|preview-contextual-bar|topbar-controls|view-mode-label|viewport-label|btn-copy-html' src/web/features/preview/styles.css src/web/features/preview/preview.html
  ```

  Expected:
  - Permanecen en `@media`: tabs, panel único, visibilidad editor/preview y menú móvil.
  - Migran a `@container`: una/dos filas, orden, wrap, gap, labels y compactación de Exportar.
  - Las reglas de tokens/colores siguen siendo reglas base y no se duplican dentro de los nuevos containers.

### Task 2: Fase A — Migración responsive equivalente

**Files:**

- Modify: `src/web/features/preview/styles.css`
- Modify only if CSS cannot express the label progression without ambiguity: `src/web/features/preview/preview.html`

**Interfaces:**

- Consumes: `#right-panel`, `.preview-top-container`, `.preview-header-bar`, `.preview-contextual-bar`, `#topbar-controls`, `.preview-status-wrap` y `.preview-copy-wrap` existentes.
- Produces: container `preview-panel` y estados de header gobernados por su inline size, sin cambio de comportamiento de aplicación.

- [ ] **Step 1: Añadir el container estable al panel**

  Add to the existing base rule for `#right-panel`:

  ```css
  #right-panel {
    container: preview-panel / inline-size;
    min-width: 0;
  }
  ```

  Preserve its current `display`, `flex`, `flex-direction` and `overflow` declarations.

- [ ] **Step 2: Separar decisiones de viewport y decisiones del header**

  Consolidate the repeated desktop panel sizing under one application breakpoint:

  ```css
  @media (width >= 1260px) {
    #left-panel {
      width: 550px;
      flex-shrink: 0;
    }

    #right-panel {
      flex: 1;
      width: auto;
    }
  }
  ```

  Keep the existing `@media (width <= 1259px)` declarations for panel direction, tabs and editor/preview visibility. Move out of `@media` every declaration whose only purpose is header rows, ordering, label density, wrapping, gaps or Exportar density. Do not move editor/mobile navigation behavior.

- [ ] **Step 3: Crear estados provisionales del header según el panel**

  Implement the first measurable prototype with the derived candidates. Use these exact declarations as the initial state, while preserving the existing color/token rules outside the containers:

  ```css
  .preview-top-container {
    display: flex;
    flex-direction: column;
    width: 100%;
    padding: 0.5rem 0.75rem;
    gap: 0.5rem;
  }

  .preview-header-bar,
  .preview-contextual-bar,
  #topbar-controls,
  .preview-render-controls,
  .preview-viewport-controls,
  .preview-status-wrap,
  .preview-copy-wrap {
    display: flex;
    align-items: center;
  }

  .preview-header-bar,
  .preview-contextual-bar {
    justify-content: space-between;
    width: 100%;
  }

  .preview-title-wrap {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-width: 0;
  }

  .preview-status-wrap,
  .preview-contextual-bar,
  #topbar-controls {
    gap: 0.5rem;
  }

  .preview-render-controls,
  .preview-viewport-controls {
    gap: 0.5rem;
    min-width: 0;
  }

  .preview-contextual-bar,
  #topbar-controls,
  .preview-status-wrap {
    flex-wrap: wrap;
  }

  .preview-copy-wrap {
    margin-left: auto;
    flex-shrink: 0;
  }

  @container preview-panel (width >= 1151px) {
    .preview-top-container {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1.5rem;
    }

    .preview-header-bar,
    .preview-contextual-bar {
      display: contents;
    }

    .preview-title-wrap {
      order: 1;
      gap: 1rem;
    }

    #topbar-skeleton,
    #topbar-controls {
      order: 2;
      margin-left: 1rem;
    }

    .preview-status-wrap {
      order: 3;
      margin-left: auto;
    }

    .preview-copy-wrap {
      order: 4;
      margin-left: 0.75rem;
    }
  }

  @container preview-panel (710px <= width < 1151px) {
    .preview-top-container {
      padding: 0.625rem 1.25rem;
    }

    .preview-header-bar,
    .preview-contextual-bar {
      flex-wrap: nowrap;
    }

    .preview-contextual-bar {
      padding-top: 0.5rem;
      border-top: 1px solid var(--ef-border);
      gap: 0.75rem;
    }

    #topbar-controls,
    .preview-status-wrap {
      gap: 0.75rem;
    }
  }

  @container preview-panel (width < 710px) {
    .preview-header-bar {
      align-items: flex-start;
      flex-wrap: wrap;
    }

    .preview-title-wrap,
    .preview-status-wrap {
      flex-basis: 100%;
    }

    .preview-contextual-bar,
    #topbar-controls {
      flex-wrap: wrap;
      min-width: 0;
    }
  }

  @container preview-panel (width <= 850px) {
    :is(.viewport-label-full, .view-mode-label-full, .export-label-full) {
      display: none;
    }

    :is(.viewport-label-short, .view-mode-label-short, .export-label-short) {
      display: inline;
    }
  }

  @container preview-panel (width <= 550px) {
    :is(
      .viewport-label-full,
      .viewport-label-short,
      .viewport-custom-label,
      .view-mode-label,
      .export-label
    ) {
      display: none;
    }
  }
  ```

  Keep `display: contents` during this task wherever it is currently required to preserve the wide-state visual order.

- [ ] **Step 4: Hacer explícita la progresión de labels sin cambiar el nombre accesible**

  Reuse `.view-mode-label-full`, `.view-mode-label-short`, `.viewport-label-full` and `.viewport-label-short`. Add `class="viewport-custom-label"` to the existing `Custom` span so it can enter the icon-only state. Change only the presentational span inside Exportar to:

  ```html
  <span class="export-label">
    <span class="export-label-full">Exportar HTML</span>
    <span class="export-label-short">Exportar</span>
  </span>
  ```

  Preserve the existing button ID, `title`, icon and click listener. Add or preserve an `aria-label="Exportar HTML final"` on `#btn-copy-html` so the icon-only state does not change its accessible name.

- [ ] **Step 5: Derivar los thresholds definitivos desde el contenido**

  For each candidate (`1151`, `850`, `710`, and `550` when icon-only is needed), inspect `x - 1`, `x`, and `x + 1` with the following states:
  - skeleton inicial;
  - controles listos y estado Sincronizado;
  - error de render largo;
  - advertencia ESP con tooltip/foco;
  - render y código;
  - Desktop, Mobile y Custom con input visible;
  - Exportar visible;
  - dark y light;
  - zoom 200% y recorrido por teclado.

  Move a threshold only to the first integer width at which the relevant group fits without clipping, overlap or horizontal overflow. Record every final value and the state that determined it; do not retain a candidate merely because it matches the old viewport arithmetic.

- [ ] **Step 6: Ejecutar comprobaciones enfocadas de Fase A**

  Run:

  ```bash
  bun run lint
  bun run format:check
  git diff --check
  ```

  Expected: all commands exit 0. Do not claim visual equivalence unless the responsive matrix was actually inspected.

- [ ] **Step 7: Gate de aceptación de equivalencia**

  Report the final thresholds, changed declarations, automatic results and any visual cells not executed. Pause here for independent visual acceptance before performing structural cleanup.

### Task 3: Fase B — Limpieza obligatoria sin código muerto

**Files:**

- Modify: `src/web/features/preview/styles.css`
- Modify when the consumer audit proves a change is required: `src/web/features/preview/preview.html`
- Modify to remove duplicated view-mode layout state: `src/web/features/preview/view-mode-controls.js`
- Modify: `src/web/features/preview/view-mode-controls.test.js`

**Interfaces:**

- Consumes: Fase A aceptada, selectors found by repository-wide search and current render/source state contract.
- Produces: one source of responsive layout in CSS and one shell-level source for render/source styling.

- [ ] **Step 1: Auditar consumidores antes de eliminar cualquier cosa**

  Run:

  ```bash
  rg -n 'preview-header-bar|preview-contextual-bar|preview-top-container|view-mode-label|viewport-label|export-label|preview-viewport-divider|data-view-mode|is-source-mode|btn-copy-html' src/web scripts
  ```

  Expected: every deletion is paired with its complete consumer list. Keep wrappers that still group skeleton, ready, status or export states; cleanup is not authorization for an unrelated DOM redesign.

- [ ] **Step 2: Eliminar reglas responsive sustituidas y utilidades HTML conflictivas**

  Delete the old header-only `@media` blocks and any duplicate declarations superseded by `@container`. From header group wrappers in `preview.html`, remove Tailwind utilities that still set `display`, `gap`, `padding` or alignment already owned by `styles.css`; preserve visibility utilities such as `hidden` where JavaScript relies on them.

  Expected: there is no viewport query whose remaining purpose is header density, and no wrapper receives competing layout declarations from both HTML utilities and feature CSS.

- [ ] **Step 3: Consolidar el estado CSS de modo código**

  Keep `.preview-shell[data-view-mode="source"]` as the single CSS contract because it controls both `#preview-frame` and sibling header controls. Remove the duplicate `#preview-frame.is-source-mode` selector and stop toggling `is-source-mode` in JavaScript.

  In `view-mode-controls.js`:
  - remove `previewFrame` from `ViewModeElements`;
  - remove it from destructuring and setup lookup;
  - remove `previewFrame.classList.toggle(...)`;
  - preserve `shell.setAttribute("data-view-mode", resolvedMode)` and all render/source, storage and visibility behavior.

  In `view-mode-controls.test.js`, replace the duplicated class-and-attribute test with assertions that `data-view-mode` starts as `render`, changes to `source`, and returns to `render`. Do not reduce tests for escaping, persistence or redundant compilation.

- [ ] **Step 4: Confirmar que no quedan nombres huérfanos ni reglas competidoras**

  Run:

  ```bash
  rg -n 'is-source-mode|previewFrame' src/web/features/preview
  rg -n '@media|@container|display:|gap:|padding:|align-items:|flex-wrap:' src/web/features/preview/styles.css
  ```

  Expected: the first command has no matches related to the removed state; the second inspection shows header density only under base/`@container` rules, while application-mode changes remain under `@media`.

- [ ] **Step 5: Ejecutar pruebas de la limpieza**

  Run:

  ```bash
  bun run test -- src/web/features/preview/view-mode-controls.test.js
  bun run lint
  bun run typecheck
  bun run format:check
  git diff --check
  ```

  Expected: all commands exit 0 and the focused view-mode suite preserves its prior behavioral coverage.

### Task 4: Regresión global, matriz visual y handoff

**Files:**

- Modify: `docs/implementation/STATUS.md`
- Verify: all modified MHB-17 files

**Interfaces:**

- Consumes: implementation after cleanup.
- Produces: evidence-separated MHB-17 handoff that remains `En revisión`.

- [ ] **Step 1: Ejecutar controles globales aplicables**

  Run:

  ```bash
  bun run check:task-branch
  bun run lint
  bun run typecheck
  bun run test
  bun run a11y-check
  bun run format:check
  bun run build
  git diff --check
  ```

  Expected: every command exits 0. `bun run build` is only a regression gate and does not count as responsive acceptance.

- [ ] **Step 2: Ejecutar la matriz visual final**

  Inspect `375`, `768`, `1024`, `1280`, `1440`, `1559` and `1560px`, plus `x - 1`, `x`, `x + 1` for every final container threshold. Cover dark/light, one/two panels, loading, ready, custom and source states, keyboard focus, zoom 200%, clipping and horizontal overflow.

  Expected: header state follows the measured width of `#right-panel`, while panel-mode transitions still follow viewport width. Browser inspection requires the user's explicit request under the repository policy; otherwise record this gate as `No ejecutado`, never as green.

- [ ] **Step 3: Revisar el diff y demostrar la ausencia de limpieza colateral**

  Run:

  ```bash
  git diff -- src/web/features/preview/preview.html src/web/features/preview/styles.css src/web/features/preview/view-mode-controls.js src/web/features/preview/view-mode-controls.test.js docs/implementation/STATUS.md
  git status --short
  ```

  Expected: only MHB-17 surfaces are changed; the report distinguishes preserved preexisting work, responsive migration and dead-code cleanup.

- [ ] **Step 4: Actualizar el estado sin cerrar MHB-17**

  Update `STATUS.md` with:
  - final container thresholds and the content state that determined each one;
  - files changed and dead code removed;
  - automatic controls as `Verde`, `Fallido` or `No ejecutado` using actual outputs;
  - visual matrix status separately from automated checks;
  - residual risks and immediate independent-review action.

  Keep MHB-17 as `En revisión`. Do not claim visual acceptance, completion, commit, merge or release.
