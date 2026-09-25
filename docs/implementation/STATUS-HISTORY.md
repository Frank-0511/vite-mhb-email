# Historial de estado y revisiones de cierre — EmailForge Toolkit

Este documento almacena el histórico de revisiones de cierre, tablas de validación y detalles de tareas completadas para mantener `STATUS.md` conciso y operativo (< 160 líneas).

---

## MHB-41 — Gate del contrato de salida y validadores de email en CI

- **Fecha de cierre:** 2026-09-25
- **Estado:** Completada
- **Implementador:** Perfil tooling/CI
- **Revisor independiente:** Revisor técnico de build y email
- **Rama:** `feature/mhb-41` (commit `823218b`, PR #44)
- **Contrato:** `docs/implementation/PLAN.md` (MHB-41)

### Hechos de implementación (MHB-41)

1. Módulo `scripts/validators/dist-baseline/` (`snapshot`, `compare`, `baseline-guard`, `check`, `update`, `baseline.json`) con 23 tests unitarios y fixtures deterministas; scripts `check:dist-baseline` y `update:dist-baseline` en `package.json`.
2. Entrypoints CLI de `validate-email-html.ts` y `check-html-size.ts` retornan código 1 ante errores o archivos > 102 KB.
3. `ci.yml` ejecuta tras `build`: `git diff --exit-code -- dist/`, `validate-email`, `check:dist-baseline`, `check-size` y `check:inventory` (informe).
4. `ci.yml` paralelizado (D5): jobs `Format & Lint`, `Typecheck`, `Test` y `Build & Validate` agregados por el check `CI Pipeline`; `push` solo en `master`, `concurrency`, caché de `node_modules` y `PUPPETEER_SKIP_DOWNLOAD`.
5. CI verde ([`36099115433`](https://github.com/Frank-0511/vite-mhb-email/actions/runs/36099115433)), rojo forzado ([`36099267303`](https://github.com/Frank-0511/vite-mhb-email/actions/runs/36099267303)) y verde tras revert ([`36099402152`](https://github.com/Frank-0511/vite-mhb-email/actions/runs/36099402152)), sin incremento de tiempo (1m1s vs 1m3s). Determinismo comprobado entre macOS y Linux.

### Controles de calidad (MHB-41)

Todos los controles pasaron: `check:task-branch`, `format:check`, `typecheck`, `test` (634 pass), `lint`, `build` (6 templates), `git diff --exit-code -- dist/`, `validate-email`, `check:dist-baseline`, `check-size`, `agents:check` y `git diff --check`.

### Desviaciones aprobadas (MHB-41)

- D1: entrypoints CLI de `validate-email-html.ts` y `check-html-size.ts` con código 1 ante errores.
- D2: entrada de MHB-41 en `CHANGELOG.md` bajo `[Unreleased]`.
- D3: `docs/ai/` referencia `bun run check:dist-baseline` en vez de comparación manual; adaptadores sincronizados.
- D4: push de `feature/mhb-41` para el spike y la prueba roja con revert.
- D5: paralelizar y cachear `ci.yml`, con `CI Pipeline` como check agregado requerido.
- D6: `permissions: contents: read` en `ci.yml` y `audit.yml` (autorizado retroactivamente).
- D7: correcciones de paso en `scripts/mail/send-mailtester.ts` y `scripts/vite/services/transforms/script-transforms.ts` (autorizado retroactivamente).

### Revisión de cierre (MHB-41)

- **Procedimiento:** `task-review` sobre checkout limpio de `feature/mhb-41` @ `823218b`, re-ejecutando todos los gates sin asumir lo declarado.
- **Auditoría de diff `master...HEAD`:** sin supresiones ni `.js`/`.mjs` nuevos; cuatro desviaciones no documentadas en la primera pasada quedaron autorizadas como D6–D7.
- **Contrato de salida:** `dist/` sin diff, variables ESP intactas y `check:dist-baseline` en coincidencia.
- **Veredicto:** Aprobado.

---

## MHB-40 — Gobernanza de agentes y revisión independiente

- **Fecha de cierre:** 2026-09-25
- **Estado:** Completada
- **Implementador:** Perfil gobernanza/documentación
- **Revisor independiente:** Orquestador
- **Rama:** `feature/mhb-40` (commit `d568f69`)
- **Contrato:** `docs/implementation/PLAN.md` (MHB-40)

### Hechos de implementación

1. Corregidas 5 contradicciones históricas en `docs/ai/` y `PLAN.md` (eliminadas referencias a JS/allowJs, typedefs, any, `storage-keys.js` e `IMPLEMENTATION-PLAN.md`).
2. Incorporadas 6 reglas de gobernanza en `AGENTS.md`, `email-quality-gates`, `task-verification` y `task-status-management` (supresiones registradas, `.ts` obligatorio, criterios con comando, actualización de rutas, baseline de dist y CHANGELOG unreleased).
3. Creadas skills canónicas `task-review` y `release-management` con sus `agents/openai.yaml`.
4. Sincronizados y verificados los adaptadores en los 7 targets declarados mediante `bun run agents:sync` y `bun run agents:check`.
5. Documentadas entradas retroactivas de MHB-37, MHB-39 y MHB-40 en `CHANGELOG.md` bajo `[Unreleased]` y ejecutado ensayo de `task-review` sobre el diff de MHB-39.

### Controles de calidad

Todos los controles pasaron: `check:task-branch`, `lint:md`, `format:check`, `agents:check`, `typecheck`, `test` (598 tests), `lint`, `build`, `validate-email`, `git diff --check`.

### Evidencia de validación

- **Contradicciones corregidas:**
  - `docs/ai/skills/email-refactor-type-safety/SKILL.md`: Conservar JS ESM / no migrar globalmente -> Reemplazado por cierre TS estricto y nuevos `.ts`.
  - `docs/ai/skills/email-quality-gates/SKILL.md`: typedefs y explicar cualquier any -> Prohibido any y `@typedef` en `.ts`.
  - `docs/ai/AGENTS.md`: `storage-keys.js` / `IMPLEMENTATION-PLAN.md` -> Corregido a `.ts` y `PLAN.md`.
  - `docs/implementation/PLAN.md`: `a11y-check.ts` -> Corregido a `check-a11y.ts`.
- **Ensayo de `task-review` sobre MHB-39:**
  - Diff `2f3600b..b512883`: 0 supresiones, 0 `.js`/`.mjs` nuevos.
  - Salida: 0 diff en `dist/*.html`, variables ESP `{{ }}` preservadas.
  - Árbol: `file-tree.test.ts` 100% pasando. Veredicto: Aprobado.

### Revisión de cierre

- **Procedimiento:** `task-review` sobre checkout de `feature/mhb-40`, commit `d568f69`.
- **Gates re-ejecutados:** Todos verde. Auditoría diff `master...HEAD` limpia y sin supresiones.
- **Veredicto:** Aprobado.
