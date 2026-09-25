# Estado de implementación — EmailForge Toolkit

## Resumen

- ID activo: MHB-41
- Estado: Completada
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
  1. Creado módulo `scripts/validators/dist-baseline/` (`snapshot`, `compare`, `baseline-guard`, `check`, `update`, `baseline.json`) con 23 tests unitarios y fixtures deterministas.
  2. Añadidos scripts `check:dist-baseline` y `update:dist-baseline` a `package.json`.
  3. Modificados entrypoints CLI de `validate-email-html.ts` y `check-html-size.ts` para retornar código 1 ante errores (> 102 KB) en CI, con tests unitarios.
  4. Configurado `.github/workflows/ci.yml` con: `git diff --exit-code -- dist/`, `validate-email`, `check:dist-baseline`, `check-size`, `check:inventory` (informe).
  5. Optimización de `ci.yml` (D5): jobs paralelos `Format & Lint`, `Typecheck`, `Test` y `Build & Validate` agregados por el check `CI Pipeline`; `push` solo en `master` (los PR cubren las ramas), `concurrency` con cancelación, caché de `node_modules` y `PUPPETEER_SKIP_DOWNLOAD`.
  6. Verificación manual en CI completada: verde inicial ([`36099115433`](https://github.com/Frank-0511/vite-mhb-email/actions/runs/36099115433)), rojo forzado ([`36099267303`](https://github.com/Frank-0511/vite-mhb-email/actions/runs/36099267303)) y verde tras revert ([`36099402152`](https://github.com/Frank-0511/vite-mhb-email/actions/runs/36099402152)) sin incremento en tiempo de pipeline (1m1s vs 1m3s).
- **Riesgos residuales:**
  1. Ninguno identificado. Determinismo multiplataforma comprobado entre macOS local y runner Linux en GitHub Actions.
- **Bloqueos y desviaciones:**
  - Sin bloqueos vigentes. Desviaciones aprobadas por el usuario (D1–D7):
    - D1: Modificación de entrypoints CLI de `validate-email-html.ts` y `check-html-size.ts` para retornar código 1 ante errores o archivos > 102 KB.
    - D2: Entrada de MHB-41 en `CHANGELOG.md` bajo `[Unreleased]`.
    - D3: En `docs/ai/AGENTS.md`, reemplazar comparación manual por `bun run check:dist-baseline` y sincronizar adaptadores.
    - D4: Push de `feature/mhb-41` a `origin` para el spike del paso 1, el commit rojo del paso 8 y su revert.
    - D5: Paralelizar y cachear `ci.yml` dentro de MHB-41 (sin ID nuevo), conservando `CI Pipeline` como check agregado requerido.
    - D6: Añadir `permissions: contents: read` en `ci.yml` y, fuera de la superficie autorizada, en `audit.yml`; hardening de mínimo privilegio del `GITHUB_TOKEN`, detectado durante la revisión independiente y autorizado retroactivamente por el usuario el 2026-09-25.
    - D7: Corregir de paso, fuera de la superficie autorizada, `scripts/mail/send-mailtester.ts` (validación de dirección con regex `correo@mail-tester.com` en vez de `.includes()`) y `scripts/vite/services/transforms/script-transforms.ts` (bucle que elimina todos los bloques `<script props>` duplicados, no solo el primero); autorizado retroactivamente por el usuario el 2026-09-25.

### Controles de Calidad

| Control                | Comando                         | Resultado               |
| :--------------------- | :------------------------------ | :---------------------- |
| Comprobación de rama   | `bun run check:task-branch`     | Pasó (`feature/mhb-41`) |
| Formato de código      | `bun run format:check`          | Pasó (0 archivos)       |
| Typecheck unificado    | `bun run typecheck`             | Pasó (0 errores)        |
| Suite de pruebas       | `bun run test`                  | Pasó (634 pass, 0 fail) |
| Linting completo       | `bun run lint`                  | Pasó (0 errores)        |
| Build y salida dist    | `bun run build`                 | Pasó (6 templates)      |
| Baseline dist local    | `git diff --exit-code -- dist/` | Pasó (0 diff)           |
| Validación email       | `bun run validate-email`        | Pasó (0 errores)        |
| Gate baseline dist     | `bun run check:dist-baseline`   | Pasó (coincidencia)     |
| Chequeo tamaño HTML    | `bun run check-size`            | Pasó (todos <= 102 KB)  |
| Adaptadores de agentes | `bun run agents:check`          | Pasó (7 targets)        |
| Diff de Git            | `git diff --check`              | Pasó (0 issues)         |

## Revisión de cierre (MHB-41)

- **Procedimiento:** checkout limpio de `feature/mhb-41` (commit [`823218b`](https://github.com/Frank-0511/vite-mhb-email/commit/823218bbde206fc103dd11f500ff213aad8d9e83)) y re-ejecución independiente de toda la suite de gates, sin asumir lo declarado por el implementador.
- **Gates re-ejecutados y resultado:** `bun install --frozen-lockfile` (sin cambios, 776 instalaciones), `check:task-branch`, `lint` (html/js/md/json/css, 0 errores), `typecheck` (0 errores, ambos `tsconfig`), `test` (634 pass, 0 fail, 82 archivos), `format:check` (0 archivos), `build` (6 templates, 0 errores de compatibilidad, 2 warnings no bloqueantes ya conocidos), `validate-email` (0 errores), `check:dist-baseline` (coincide con baseline), `check-size` (todos ≤ 102 KB), `agents:check` (7 targets), `git diff --check` (0 issues) y `git diff --exit-code -- dist/` (0 diff).
- **Auditoría de diff `master...HEAD`:** sin `eslint-disable`, `@ts-ignore`/`@ts-expect-error`, exclusiones de `tsconfig*` ni tests `skip`/`todo`; sin archivos `.js`/`.mjs` nuevos. Se detectaron cuatro desviaciones no documentadas al momento de la primera pasada (permisos en `ci.yml` y `audit.yml`, y cambios de paso en `send-mailtester.ts` y `script-transforms.ts`); el usuario las autorizó explícitamente el 2026-09-25 y quedaron registradas como D6–D7 en este documento.
- **Contrato de salida y variables ESP:** `git diff master...HEAD -- dist/` vacío; `{{ }}` y bloques Handlebars intactos; `check:dist-baseline` confirma coincidencia con el baseline.
- **Integridad de rutas en `PLAN.md`:** el ID no elimina ni renombra archivos referenciados por contratos pendientes; no aplica actualización de rutas.
- **Criterios de aceptación vs. evidencia:**
  - Baseline inicial coincide con `dist/` de `master` y CI verde → confirmado por `check:dist-baseline` y ejecuciones [`36099115433`](https://github.com/Frank-0511/vite-mhb-email/actions/runs/36099115433) / [`36099402152`](https://github.com/Frank-0511/vite-mhb-email/actions/runs/36099402152).
  - Fixtures de hash distinto y variable ESP perdida fallan con mensaje accionable → cubierto por `compare.test.ts` y `check.test.ts`, incluidos en los 634 tests verdes.
  - `ci.yml` ejecuta `git diff --exit-code -- dist/`, `validate-email`, `check:dist-baseline`, `check-size` y `check:inventory` tras `build`, y un `dist/` desincronizado rompe el pipeline → confirmado por lectura del workflow y por la ejecución roja [`36099267303`](https://github.com/Frank-0511/vite-mhb-email/actions/runs/36099267303) (revertida en `7a45b91`).
  - Límites de archivo/carpeta (≤ 250 líneas no-test, ≤ 400 test, ≤ 8 archivos por carpeta) → verificado con `wc -l` sobre `scripts/validators/dist-baseline/**`; 7 archivos fuente no-test en el directorio.
- **Rama y commit revisados:** `feature/mhb-41` @ `823218b`.
- **Desviaciones registradas:** D1–D7 (ver arriba), todas aprobadas por el usuario.
- **Veredicto:** Aprobado.

## Últimas entregas

- MHB-41: `Completada` el 2026-09-25; gate de contrato de salida (`dist/*.html` + variables ESP) y validadores de email en CI, con revisión técnica independiente aprobada (D1–D7).
- MHB-40: `Completada` el 2026-09-25; gobernanza de agentes, skills `task-review` y `release-management`, corrección de 5 contradicciones y sincronización de adaptadores en 7 targets.
- MHB-39: `Completada` el 2026-09-24; estandarización de 48 renombres `git mv` (cero prefijos redundantes), barrels `index.ts` puros, test de árbol `file-tree.test.ts`, linting con tipos en ESLint con 0 hallazgos y `asyncHandler` seguro.

## Ejecuciones delegadas relevantes

| Ámbito | Estado     | Propiedad             | Handoff                                                  |
| :----- | :--------- | :-------------------- | :------------------------------------------------------- |
| MHB-41 | Completada | Tooling y CI          | Revisión técnica independiente aprobada (`task-review`). |
| MHB-40 | Completada | Gobernanza y revisión | Revisión aprobada y fusionada a `master` (ver HIST).     |

## Decisiones y desviaciones vigentes

- **D1 (Aprobada 2026-09-25):** Autorizado tocar entrypoints CLI en `validate-email-html.ts` (código 1 si errores > 0) y `check-html-size.ts` (código 1 si tamaño > 102 KB). Ambos pasos bloquean en CI.
- **D2 (Aprobada 2026-09-25):** Entrada de MHB-41 en `CHANGELOG.md` bajo `[Unreleased]`.
- **D3 (Aprobada 2026-09-25):** Reemplazar «manual hasta que MHB-41 la automatice» en `docs/ai/` por `bun run check:dist-baseline`; ejecutar `agents:sync` y `agents:check`.
- **D4 (Aprobada 2026-09-25):** Push de rama `feature/mhb-41` a origin para spike paso 1 y validación manual paso 8 (commit rojo y revert).
- **D5 (Aprobada 2026-09-25):** Optimizar tiempo de `ci.yml` en MHB-41: jobs paralelos con check agregado `CI Pipeline`, `push` limitado a `master`, `concurrency` y caché de `node_modules`. El CI de ramas de feature corre vía PR.
- **D6 (Aprobada 2026-09-25):** `permissions: contents: read` en `ci.yml` y `audit.yml` (mínimo privilegio del `GITHUB_TOKEN`), pese a que `audit.yml` está fuera de la superficie autorizada de MHB-41.
- **D7 (Aprobada 2026-09-25):** Corrección de paso, fuera de la superficie autorizada de MHB-41, en `scripts/mail/send-mailtester.ts` (regex de dirección `mail-tester.com`) y `scripts/vite/services/transforms/script-transforms.ts` (bucle que elimina todos los bloques `<script props>`).
- **Directiva MD024 en Changelog:** Se añade directiva de archivo `markdownlint-configure-file { "MD024": { "siblings_only": true } }` en `CHANGELOG.md` para permitir subtítulos estándar de Keep a Changelog (`### Añadido`, etc.) entre versiones distintas.
- **Dependencia de desarrollo:** Autorizada `eslint-plugin-check-file@3.3.2` fijada exacta para forzar kebab-case y blocklist de helpers/utils.
- **Linting con tipos:** Configurado sobre `tsconfig.strict.json` en ESLint sin alterar los archivos `tsconfig*.json`.
- **Envoltorio async de middlewares:** Todo handler async en endpoints Vite se envuelve con `asyncHandler` en `scripts/vite/api/http.ts` para captura determinista de excepciones y respuesta JSON 500, verificando `res.headersSent`.
- **Pruebas de guards sintéticos:** En `eslint-guards.test.ts` se anula `parserOptions.project` para evaluar snippets en memoria mediante AST puro sin latencia ni dependencia de disco.
- **Barrels index.ts puros:** Todos los `index.ts` bajo `scripts/` y `src/` actúan exclusivamente como puntos de reexport (`export ... from`), verificados automáticamente por `file-tree.test.ts`.

## Handoff

- Próxima acción inmediata: iniciar MHB-45 (Protección de `master` y política de Dependabot), ahora desbloqueada por el cierre de MHB-41.
- Siguiente tarea del roadmap:
  - MHB-45: Protección de `master` y auto-merge de Dependabot restringido al pipeline no crítico.
