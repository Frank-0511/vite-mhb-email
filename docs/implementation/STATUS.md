# Estado de implementación — EmailForge Toolkit

## Resumen

- ID activo: MHB-45
- Estado: En progreso
- Implementador: Perfil CI/seguridad
- Revisor: Orquestador; la configuración de GitHub la confirma el usuario
- Rama: `feature/mhb-45`
- Última actualización: 2026-09-25
- Contrato activo: `docs/implementation/PLAN.md` (MHB-45)

## Baseline vigente

- La release [v1.2.0](https://github.com/Frank-0511/vite-mhb-email/releases/tag/v1.2.0) es el baseline funcional publicado.
- La migración a TypeScript por capas (núcleo, CLI, servidor Vite y dashboard web) está completada y mergeada a `master`; la trazabilidad de los IDs cerrados vive en Git.
- Las variables ESP `{{ }}` se preservan en el HTML final; `[[ page.* ]]` queda reservado para Maizzle.

## Entrega activa (MHB-45: Protección de `master` y política de Dependabot)

- **Propiedad de archivos:** `.github/workflows/dependabot-automerge.yml`, `.github/dependabot.yml`, protección de `master` en GitHub, `CHANGELOG.md` (`[Unreleased]`, D1) y `docs/implementation/STATUS.md`.
- **Estado de partida (2026-09-25):** `master` sin protección (API → 404) y sin rulesets; el auto-merge fusiona al instante por falta de checks requeridos (#34, #36, #37 y #38 el 2026-09-23); `dependabot.yml` solo cubre `bun`.
- **Hechos de implementación:** pendientes.
- **Riesgos residuales:** pendientes de evaluar al entregar.
- **Bloqueos:** ninguno.

### Controles de Calidad

| Control              | Comando                     | Resultado               |
| :------------------- | :-------------------------- | :---------------------- |
| Comprobación de rama | `bun run check:task-branch` | Pasó (`feature/mhb-45`) |

## Últimas entregas

- MHB-41: `Completada` el 2026-09-25; gate de contrato de salida (`dist/*.html` + variables ESP) y validadores de email en CI, con revisión técnica independiente aprobada (D1–D7, detalle en `STATUS-HISTORY.md`).
- MHB-40: `Completada` el 2026-09-25; gobernanza de agentes, skills `task-review` y `release-management`, corrección de 5 contradicciones y sincronización de adaptadores en 7 targets.
- MHB-39: `Completada` el 2026-09-24; estandarización de 48 renombres `git mv` (cero prefijos redundantes), barrels `index.ts` puros, test de árbol `file-tree.test.ts`, linting con tipos en ESLint con 0 hallazgos y `asyncHandler` seguro.

## Ejecuciones delegadas relevantes

| Ámbito | Estado      | Propiedad             | Handoff                                                  |
| :----- | :---------- | :-------------------- | :------------------------------------------------------- |
| MHB-45 | En progreso | CI y seguridad        | Implementación en curso en `feature/mhb-45`.             |
| MHB-41 | Completada  | Tooling y CI          | Revisión técnica independiente aprobada (`task-review`). |
| MHB-40 | Completada  | Gobernanza y revisión | Revisión aprobada y fusionada a `master` (ver HIST).     |

## Decisiones y desviaciones vigentes

- **D1 (Aprobada 2026-09-25):** Entrada de MHB-45 en `CHANGELOG.md` bajo `[Unreleased]`, requerida por la invariante de `AGENTS.md` aunque no figura en las superficies autorizadas.
- **D2 (Aprobada 2026-09-25):** Push de una rama desechable con un check en rojo y PR borrador contra `master` para comprobar el bloqueo; se cierra el PR y se borra la rama tras la evidencia.
- **Protección de `master` (aprobada 2026-09-25):** checks requeridos `CI Pipeline` y `Accessibility & Contrast Audit`, rama actualizada (`strict`), PR obligatorio con 0 aprobaciones (mantenedor único), `enforce_admins`, historial lineal, sin force-push ni borrado. La aplica el implementador vía `gh api` con autorización explícita del usuario.
- **Auto-merge de Dependabot (aprobado 2026-09-25):** fusión con `--rebase`; se elimina el paso de aprobación automática; las actualizaciones minor/patch de `github-actions` pueden fusionarse solas con checks verdes.
- **Directiva MD024 en Changelog:** Se añade directiva de archivo `markdownlint-configure-file { "MD024": { "siblings_only": true } }` en `CHANGELOG.md` para permitir subtítulos estándar de Keep a Changelog (`### Añadido`, etc.) entre versiones distintas.
- **Dependencia de desarrollo:** Autorizada `eslint-plugin-check-file@3.3.2` fijada exacta para forzar kebab-case y blocklist de helpers/utils.
- **Linting con tipos:** Configurado sobre `tsconfig.strict.json` en ESLint sin alterar los archivos `tsconfig*.json`.
- **Envoltorio async de middlewares:** Todo handler async en endpoints Vite se envuelve con `asyncHandler` en `scripts/vite/api/http.ts` para captura determinista de excepciones y respuesta JSON 500, verificando `res.headersSent`.
- **Pruebas de guards sintéticos:** En `eslint-guards.test.ts` se anula `parserOptions.project` para evaluar snippets en memoria mediante AST puro sin latencia ni dependencia de disco.
- **Barrels index.ts puros:** Todos los `index.ts` bajo `scripts/` y `src/` actúan exclusivamente como puntos de reexport (`export ... from`), verificados automáticamente por `file-tree.test.ts`.

## Handoff

- Próxima acción inmediata: aplicar la protección de `master` y restringir el auto-merge de Dependabot (MHB-45).
- Siguiente tarea del roadmap:
  - MHB-44: Compatibilidad del HTML exportado con clientes reales (bloqueado hasta el cierre de MHB-45).
