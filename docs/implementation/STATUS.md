# Estado de implementación — EmailForge Toolkit

## Resumen

- ID activo: MHB-41
- Estado: En progreso
- Implementador: Perfil tooling/CI
- Revisor: Revisor técnico de build y email
- Rama: `feature/mhb-41`
- Última actualización: 2026-09-25
- Contrato activo: `docs/implementation/PLAN.md` (MHB-41)

## Baseline vigente

- La release [v1.2.0](https://github.com/Frank-0511/vite-mhb-email/releases/tag/v1.2.0) es el baseline funcional publicado.
- La migración a TypeScript por capas (núcleo, CLI, servidor Vite y dashboard web) está completada y mergeada a `master`; la trazabilidad de los IDs cerrados vive en Git.
- Las variables ESP `{{ }}` se preservan en el HTML final; `[[ page.* ]]` queda reservado para Maizzle.

## Entrega activa (MHB-41: Gate del contrato de salida y validadores en CI)

- **Hechos de implementación:**
  1. Inicio de implementación de MHB-41 tras verificación de baseline limpio y sin divergencia en `dist/*.html`.
- **Riesgos residuales:**
  1. Potencial no determinismo de hashes entre macOS (local) y Linux (CI); mitigado mediante spike en el paso 1.
- **Bloqueos y desviaciones:**
  - Sin bloqueos vigentes. Desviaciones aprobadas por el usuario (D1–D4):
    - D1: Modificación de entrypoint CLI de `validate-email-html.ts` y `check-html-size.ts` para retornar código 1 ante errores o archivos > 102 KB.
    - D2: Entrada de MHB-41 en `CHANGELOG.md` bajo `[Unreleased]`.
    - D3: En `docs/ai/AGENTS.md`, reemplazar comparación manual por `bun run check:dist-baseline` y sincronizar adaptadores.
    - D4: Push de `feature/mhb-41` a `origin` para el spike del paso 1, el commit rojo del paso 8 y su revert.

### Controles de Calidad

| Control                | Comando                         | Resultado             |
| :--------------------- | :------------------------------ | :-------------------- |
| Comprobación de rama   | `bun run check:task-branch`     | Pasó (feature/mhb-41) |
| Formato de código      | `bun run format:check`          | Pendiente             |
| Typecheck unificado    | `bun run typecheck`             | Pendiente             |
| Suite de pruebas       | `bun run test`                  | Pendiente             |
| Linting completo       | `bun run lint`                  | Pendiente             |
| Build y salida dist    | `bun run build`                 | Pasó (6 templates)    |
| Baseline dist local    | `git diff --exit-code -- dist/` | Pasó (0 diff)         |
| Validación email       | `bun run validate-email`        | Pasó (0 errores)      |
| Gate baseline dist     | `bun run check:dist-baseline`   | Pendiente             |
| Chequeo tamaño HTML    | `bun run check-size`            | Pendiente             |
| Adaptadores de agentes | `bun run agents:check`          | Pasó                  |
| Diff de Git            | `git diff --check`              | Pendiente             |

## Últimas entregas

- MHB-40: `Completada` el 2026-09-25; gobernanza de agentes, skills `task-review` y `release-management`, corrección de 5 contradicciones y sincronización de adaptadores en 7 targets.
- MHB-39: `Completada` el 2026-09-24; estandarización de 48 renombres `git mv` (cero prefijos redundantes), barrels `index.ts` puros, test de árbol `file-tree.test.ts`, linting con tipos en ESLint con 0 hallazgos y `asyncHandler` seguro.

## Ejecuciones delegadas relevantes

| Ámbito | Estado      | Propiedad             | Handoff                                              |
| :----- | :---------- | :-------------------- | :--------------------------------------------------- |
| MHB-41 | En progreso | Tooling y CI          | Implementación activa en rama `feature/mhb-41`.      |
| MHB-40 | Completada  | Gobernanza y revisión | Revisión aprobada y fusionada a `master` (ver HIST). |

## Decisiones y desviaciones vigentes

- **D1 (Aprobada 2026-09-25):** Autorizado tocar entrypoints CLI en `validate-email-html.ts` (código 1 si errores > 0) y `check-html-size.ts` (código 1 si tamaño > 102 KB). Ambos pasos bloquean en CI.
- **D2 (Aprobada 2026-09-25):** Entrada de MHB-41 en `CHANGELOG.md` bajo `[Unreleased]`.
- **D3 (Aprobada 2026-09-25):** Reemplazar «manual hasta que MHB-41 la automatice» en `docs/ai/` por `bun run check:dist-baseline`; ejecutar `agents:sync` y `agents:check`.
- **D4 (Aprobada 2026-09-25):** Push de rama `feature/mhb-41` a origin para spike paso 1 y validación manual paso 8 (commit rojo y revert).
- **Directiva MD024 en Changelog:** Se añade directiva de archivo `markdownlint-configure-file { "MD024": { "siblings_only": true } }` en `CHANGELOG.md` para permitir subtítulos estándar de Keep a Changelog (`### Añadido`, etc.) entre versiones distintas.
- **Dependencia de desarrollo:** Autorizada `eslint-plugin-check-file@3.3.2` fijada exacta para forzar kebab-case y blocklist de helpers/utils.
- **Linting con tipos:** Configurado sobre `tsconfig.strict.json` en ESLint sin alterar los archivos `tsconfig*.json`.
- **Envoltorio async de middlewares:** Todo handler async en endpoints Vite se envuelve con `asyncHandler` en `scripts/vite/api/http.ts` para captura determinista de excepciones y respuesta JSON 500, verificando `res.headersSent`.
- **Pruebas de guards sintéticos:** En `eslint-guards.test.ts` se anula `parserOptions.project` para evaluar snippets en memoria mediante AST puro sin latencia ni dependencia de disco.
- **Barrels index.ts puros:** Todos los `index.ts` bajo `scripts/` y `src/` actúan exclusivamente como puntos de reexport (`export ... from`), verificados automáticamente por `file-tree.test.ts`.

## Handoff

- Próxima acción inmediata: Implementar paso 1 (spike de determinismo en CI con `git diff --exit-code -- dist/`).
- Siguiente tarea del roadmap:
  - MHB-45 (`bloqueada`, depende de MHB-41): Protección de `master` y política de Dependabot.
