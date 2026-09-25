# Historial de estado y revisiones de cierre — EmailForge Toolkit

Este documento almacena el histórico de revisiones de cierre, tablas de validación y detalles de tareas completadas para mantener `STATUS.md` conciso y operativo (< 160 líneas).

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
