# Estado de implementación — EmailForge Toolkit

## Resumen

- ID activo: Ninguno (pendiente asignación explícita del siguiente ID)
- Estado: N/A
- Implementador: N/A
- Revisor: N/A
- Rama: N/A
- Última actualización: 2026-09-25
- Contrato activo: `docs/implementation/PLAN.md`

## Baseline vigente

- La release [v1.2.0](https://github.com/Frank-0511/vite-mhb-email/releases/tag/v1.2.0) es el baseline funcional publicado.
- La migración a TypeScript por capas (núcleo, CLI, servidor Vite y dashboard web) está completada y mergeada a `master`; la trazabilidad de los IDs cerrados vive en Git.
- Las variables ESP `{{ }}` se preservan en el HTML final; `[[ page.* ]]` queda reservado para Maizzle.

## Entrega activa

- Ninguna tarea en progreso. MHB-45 se cerró `Completada`; hechos, controles y revisión de cierre en `STATUS-HISTORY.md`.

## Últimas entregas

- MHB-45: `Completada` el 2026-09-25; protección de `master` (checks requeridos `CI Pipeline` y `Accessibility & Contrast Audit`, `enforce_admins`, historial lineal), auto-merge de Dependabot restringido con exclusión de dependencias del pipeline de email y ecosistema `github-actions` añadido, con revisión técnica independiente aprobada (D1–D2, detalle en `STATUS-HISTORY.md`).
- MHB-41: `Completada` el 2026-09-25; gate de contrato de salida (`dist/*.html` + variables ESP) y validadores de email en CI, con revisión técnica independiente aprobada (D1–D7, detalle en `STATUS-HISTORY.md`).
- MHB-40: `Completada` el 2026-09-25; gobernanza de agentes, skills `task-review` y `release-management`, corrección de 5 contradicciones y sincronización de adaptadores en 7 targets.

## Ejecuciones delegadas relevantes

| Ámbito | Estado     | Propiedad             | Handoff                                                  |
| :----- | :--------- | :-------------------- | :------------------------------------------------------- |
| MHB-45 | Completada | CI y seguridad        | Revisión técnica independiente aprobada (`task-review`). |
| MHB-41 | Completada | Tooling y CI          | Revisión técnica independiente aprobada (`task-review`). |
| MHB-40 | Completada | Gobernanza y revisión | Revisión aprobada y fusionada a `master` (ver HIST).     |

## Decisiones y desviaciones vigentes

- **Protección de `master` (aprobada 2026-09-25, MHB-45):** checks requeridos `CI Pipeline` y `Accessibility & Contrast Audit`, rama actualizada (`strict`), PR obligatorio con 0 aprobaciones (mantenedor único), `enforce_admins`, historial lineal, sin force-push ni borrado. Verificada vigente en `master` por el revisor independiente.
- **Auto-merge de Dependabot (aprobado 2026-09-25, MHB-45):** fusión con `--rebase`; se elimina el paso de aprobación automática; las actualizaciones minor/patch de `github-actions` pueden fusionarse solas con checks verdes; dependencias del pipeline de email siempre en revisión manual.
- **Directiva MD024 en Changelog:** Se añade directiva de archivo `markdownlint-configure-file { "MD024": { "siblings_only": true } }` en `CHANGELOG.md` para permitir subtítulos estándar de Keep a Changelog (`### Añadido`, etc.) entre versiones distintas.
- **Dependencia de desarrollo:** Autorizada `eslint-plugin-check-file@3.3.2` fijada exacta para forzar kebab-case y blocklist de helpers/utils.
- **Linting con tipos:** Configurado sobre `tsconfig.strict.json` en ESLint sin alterar los archivos `tsconfig*.json`.
- **Envoltorio async de middlewares:** Todo handler async en endpoints Vite se envuelve con `asyncHandler` en `scripts/vite/api/http.ts` para captura determinista de excepciones y respuesta JSON 500, verificando `res.headersSent`.
- **Pruebas de guards sintéticos:** En `eslint-guards.test.ts` se anula `parserOptions.project` para evaluar snippets en memoria mediante AST puro sin latencia ni dependencia de disco.
- **Barrels index.ts puros:** Todos los `index.ts` bajo `scripts/` y `src/` actúan exclusivamente como puntos de reexport (`export ... from`), verificados automáticamente por `file-tree.test.ts`.

## Handoff

- Próxima acción inmediata: preparar PR de `feature/mhb-45` contra `master` (checkout limpio verificado, gates verdes, revisión aprobada) cuando el usuario lo autorice.
- Siguiente tarea del roadmap:
  - MHB-44: Compatibilidad del HTML exportado con clientes reales — desbloqueada (MHB-45 completada); pendiente de asignación explícita para pasar a `En progreso`.
