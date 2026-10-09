# Historial de estado y revisiones de cierre — EmailForge Toolkit

Este documento almacena el histórico de revisiones de cierre, tablas de validación y detalles de tareas completadas para mantener `STATUS.md` conciso y operativo (< 160 líneas).

---

## MHB-43, MHB-34 y MHB-42 — Archivo de entrega y revisiones de cierre

- **Archivado:** 2026-10-08, al planificar MHB-36 (MHB-43 mergeada a `master`; `docs/superpowers/mhb-43.md` eliminado).

### Entrega de MHB-43

- MHB-43: Higiene de dependencias (Fase D).
- Alcance: retirar el CLI `maizzle`, `fs-extra` y `glob`; reclasificar dependencias por rol; alinear `@types/node` con `engines.node`.
- Hechos de la entrega (rama `feature/mhb-43`, último commit de código `5989f2b`):
  1. `build.ts` compila con `build()` programático de `@maizzle/framework` (async) y se retiran `maizzle`, `fs-extra` y `glob`; `dist/` idéntico al baseline también en checkout limpio con `--production`.
  2. `fs-extra` → `node:fs`/`node:fs/promises`; nuevo `readJsonFile`/`writeJsonFile` en `scripts/shared/io/json-file.ts` (con test); `glob` → `globSync` de `node:fs` con orden explícito (los directorios de componentes usan `readdirSync` recursivo porque Bun no expande `**/`).
  3. `@maizzle/framework`, `vite`, `tailwindcss`, `tailwindcss-preset-email`, `postcss`, `autoprefixer`, `puppeteer`, `nodemailer` y `@resvg/resvg-js` pasan a `dependencies`; `@types/node` fijado a `24.19.1`; README documenta Node `>=24`.
  4. `EMAIL_SOURCE_PATHS` (módulo hoja) reemplaza las dos listas duplicadas e incluye `maizzle.config.ts` y `tailwind.email.config.ts`; `paths.ts` y comentarios corregidos; `maizzle` retirado de Dependabot.
  5. `prepare` pasa a `husky || true` para que `bun install --production` no falle (necesario para la prueba de producción).
- Controles (todos Verde): `bun install --frozen-lockfile`, `lint`, `typecheck`, `test` (795), `format:check`, `build`, `validate-email`, `check:dist-baseline`, `check-size`, `check:inventory`, `agents:check`, `git diff --check`; prueba de producción en worktree limpio; `bun audit` sin cambios (67, igual que `master`); `bun run dev` responde 200 en `/`, `/api/data` y template; `export:screenshot welcome` y `cli` hasta el menú OK. Sin Browser pane.
- Inventario de dependencias (revisión manual): `maizzle`, `fs-extra`, `glob` eliminados (sin consumidor); runtime de build/dev en `dependencies` (`@maizzle/framework` build y preview, `vite` dev server, `tailwindcss`+`preset-email`+`postcss`+`autoprefixer` CSS, `puppeteer` export/a11y, `nodemailer` envío, `@resvg/resvg-js` iconos, `handlebars`, `lucide`); herramientas de calidad (`eslint*`, `typescript*`, `prettier`, `stylelint*`, `htmlhint`, `markdownlint-cli2`, `husky`, `lint-staged`, `axe-core`, `globals`, `@types/node`) en `devDependencies`.
- Riesgo residual: la salida de `globSync` nativo no está ordenada, por eso se ordena donde alimenta salida; el orden de carpetas de componentes pasa de glob a alfabético (sin impacto en `dist/`).
- Decisión del usuario (2026-10-08): se conserva el wrapper `maizzle.config.js` (Maizzle 5.5.0 solo descubre configuración `.js`/`.cjs`; lo consumen `selective-build.ts` y `paths.ts`). Allowlist de MHB-42 intacta.

### Revisión de cierre de MHB-34

- Veredicto: Aprobado (revisor independiente, 2026-10-08). Rama `feature/mhb-34`, commit revisado `3dc07cd`.
- Controles re-ejecutados (todos Verde): `check:task-branch`, `bun install --frozen-lockfile`, `lint`, `typecheck`, `test`, `format:check`, `build`, `validate-email`, `lint:contrast`, `a11y-check`, `agents:check`, `check:inventory --require-zero`, `check:dist-baseline`, `check-size`, `git diff --check`.
- Diff `master...HEAD`: sin `eslint-disable`, `@ts-ignore`/`@ts-expect-error`, `any`, `@typedef`, skip/todo ni archivos `.js`/`.mjs` nuevos; `tsconfig.json` activa `strict`, `verbatimModuleSyntax` y `erasableSyntaxOnly` sin `allowJs`/`checkJs`; `tsconfig.strict.json` eliminado; sin cambios en `dist/`.
- Criterios: `rg --files -g '*.js' -g '*.mjs'` devuelve solo `eslint.config.js` y `maizzle.config.js`; `typecheck` es un único `tsc --noEmit`; `check:inventory --require-zero` finaliza en 0 y está en CI; límites de árbol validados por `file-tree.test.ts`; `CHANGELOG.md` actualizado.
- Desviaciones: ninguna. Validación manual de UI (Browser pane) no realizada por regla del proyecto; cobertura por gates deterministas.

### Revisión de cierre de MHB-42

- Veredicto: Aprobado (revisor independiente, 2026-10-01). Rama `feature/mhb-42`, commit `61078b9`.
- Controles re-ejecutados (todos Verde): `check:task-branch`, `lint`, `typecheck`, `test`, `format:check`, `build`, `validate-email`, `check:dist-baseline`, `check-size`, `agents:check`, `git diff --check`.
- Diff `master...HEAD`: solo `PLAN.md` y `STATUS.md`; sin `eslint-disable`, `@ts-*`, skip/todo ni cambios en `tsconfig*.json`, ESLint ni `dist/`.
- Criterios: allowlist cerrada, dimensionamiento (5 errores TS2339) y rutas de MHB-34/MHB-36 actualizadas en `PLAN.md`. Evidencia Node 24 (spike desechable eliminado) tomada del registro del implementador; no reproducible en el árbol actual.

### Revisión de cierre de MHB-43

- Veredicto: Aprobado (revisor independiente, 2026-10-08). Rama `feature/mhb-43`, commit revisado `dadf22a`.
- Controles re-ejecutados (todos Verde): `check:task-branch`, `lint`, `typecheck`, `test`, `format:check`, `build`, `validate-email`, `check:dist-baseline`, `check-size`, `agents:check`, `git diff --check`; además `bun install --frozen-lockfile --production` + `bun run build` + `check:dist-baseline` en worktree limpio.
- Diff `master...HEAD`: sin `eslint-disable`, `@ts-*`, `any`, skip/todo, cambios en `tsconfig*.json`/ESLint ni en `dist/`; sin `.js`/`.mjs` nuevos; `types/fs-extra.d.ts` eliminado.
- Criterios: sin `fs-extra`, `glob` ni CLI `maizzle` en `scripts`, `src` y `package.json` (solo queda como keyword); sin `tailwind.email.config.js` ni `"maizzle"` en `.github`; `maizzle-dev-server.ts` y `preview-cache.ts` consumen `EMAIL_SOURCE_PATHS` con test de existencia; `@types/node` 24.x = `engines.node >=24`; README documenta Node >=24.
- Observación: `bun audit` reporta `qs` (moderada) transitiva de `@maizzle/framework`, sin cambio de versión por este ID.
- Desviaciones: ninguna. Validación manual (Browser pane) no realizada por regla del proyecto.

---

## MHB-47 — Contrato de integración ESP (manifiesto, SendGrid Dynamic y Legacy)

- **Fecha de cierre:** 2026-10-01
- **Estado:** Completada
- **Implementador:** Gemini Flash (perfil email/ESP)
- **Revisor independiente:** `task-review`, aprobado 2026-10-01, rama `feature/mhb-47`, commit base de revisión `f25086d`
- **Contrato:** `docs/implementation/PLAN.md` (MHB-47)

### Revisión de cierre de MHB-47

- **Veredicto:** Aprobado. Sin hallazgos bloqueantes.
- **Controles reproducidos (todos Verde):** `check:task-branch`, `lint`, `typecheck`, `test` (787 pass / 0 fail), `format:check`, `build`, `validate-email`, `check:dist-baseline`, `check-size`, `agents:check`, `git diff --check`.
- **Auditoría del diff:** sin `eslint-disable`, `@ts-ignore`/`@ts-expect-error`, `skip`/`todo`, `any`, `@typedef`, cambios en `ignores`, `tsconfig*.json` ni `file-tree.test.ts`; sin `.js`/`.mjs` nuevos; ningún archivo supera límites; `scripts/esp/manifest` (5 fuentes) y `syntax` (2) respetan el máximo por carpeta. Único cambio en `dist/`: el nuevo `esp-manifest.json`; los `dist/*.html` no cambian.
- **Criterios:** manifiesto para los seis templates y coherencia con baseline (`check:dist-baseline`, `manifest-check.test.ts`); `{{#if (eq a b)}}` produce ERROR (`esp-syntax-profile.test.ts`); `legacy.tags` `-variable-` (`scripts/esp/manifest`); `esp-legacy-compat` marca `{{#if a}}` y colisión (`esp-legacy-compat.test.ts`); HTML intacto.
- **Seguridad:** `exampleData` sanea claves sensibles (`email`, `password`, `token`, `*_name`); sin datos personales ni tokens en `dist/esp-manifest.json`. `PLAN.md` actualizado en la misma entrega y `CHANGELOG.md` con entrada.
- **Revisión manual:** el cierre se registra por instrucción explícita del usuario en el chat (2026-10-01); el consumo real del manifiesto desde su integración SendGrid externa no pudo ser verificado por el revisor.
- **Riesgos residuales:** la allowlist de helpers/bloques del perfil `sendgrid` y el delimitador `-` de legacy siguen basados en la documentación vigente y no se contrastaron con SendGrid real; no se modelan `<%body%>`, `<%subject%>` ni secciones legacy.

---

## MHB-46 — Endurecimiento de la API local del servidor Vite

- **Fecha de cierre:** 2026-09-29
- **Estado:** Completada
- **Implementador:** Perfil servidor Vite/seguridad
- **Revisor independiente:** `task-review`, aprobado 2026-09-29, rama `feature/mhb-46`, commit base de revisión `d51fee9`
- **Contrato:** `docs/implementation/PLAN.md` (MHB-46)

### Revisión de cierre de MHB-46

- **Veredicto:** Aprobado. Sin hallazgos bloqueantes.
- **Controles reproducidos (todos Verde):** `check:task-branch`, `lint`, `typecheck`, `test`, `format:check`, `build`, `validate-email`, `check:dist-baseline`, `check-size`, `agents:check`, `git diff --check`; `bun test scripts/vite/api` 30 pass / 0 fail.
- **Auditoría del diff:** sin `eslint-disable`, `@ts-ignore`, `skip`/`todo`, cambios en `ignores` ni `tsconfig*.json`; sin archivos `.js`/`.mjs` nuevos; `dist/` sin cambios; ningún archivo supera límites.
- **Criterios:** `text/plain` u `Origin`/`Sec-Fetch-Site` externo → 403 en cada uno de los 6 endpoints (`write-endpoints.test.ts`, `http.test.ts`); frontend envía `application/json` en `postJSON`/`postText`/render y la invalidación de caché no envía cuerpo (`requireJson: false`).
- **Revisión manual:** recorrido visual del dashboard (guardar datos, copiar HTML, invalidar caché) queda al usuario; el smoke con curl del implementador y los helpers del frontend lo respaldan.
- **Riesgo residual:** sin autenticación; con `vite --host` en red hostil la API sigue accesible por peticiones no-navegador.

| #   | Endpoint                               | Archivo                                           | `requireJson` |
| --- | :------------------------------------- | :------------------------------------------------ | :-----------: |
| 1   | `POST /api/data?template=`             | `scripts/vite/api/data.ts`                        |     true      |
| 2   | `POST /api/cache/invalidate?template=` | `scripts/vite/api/cache.ts`                       |     false     |
| 3   | `POST /api/cache/clean`                | `scripts/vite/api/cache.ts`                       |     false     |
| 4   | `POST /api/copy-html?template=`        | `scripts/vite/api/copy-html.ts`                   |     true      |
| 5   | `POST /api/render?template=`           | `scripts/vite/services/render/request-handler.ts` |     true      |
| 6   | `POST /api/components/:name/render`    | `scripts/vite/api/components.ts`                  |     true      |

---

## MHB-44 — Compatibilidad del HTML exportado con clientes reales

- **Fecha de cierre:** 2026-09-28
- **Estado:** Completada
- **Implementador:** Perfil email/compatibilidad
- **Revisor independiente:** Revisor independiente (`task-review`, aprobado 2026-09-28, commit `362c324`, PR #56)
- **Rama:** `feature/mhb-44`
- **Contrato:** `docs/implementation/PLAN.md` (MHB-44)

### Hechos de implementación (MHB-44)

1. Reglas de validación: 6 reglas nuevas en `validate-email` (`css-color-format`, `css-relative-units`, `img-svg-source`, `img-host-allowlist`, `example-domains`, `style-block-size`) y fix del límite de 8 KB por `<style>` (`maizzle.config.js`: `removeInlinedSelectors: true`).
2. Colores HEX y medidas px: preset `tailwindcss-preset-email@1.4.2` en `tailwind.email.config.js` neutralizando diferencias de layout, más corrección de 3 `rem`/`tracking` manuales. Resultado en `dist/`: 0 `rgb(… /`, 0 `rem`/`em`, 0 bloques `<style>` > 8192 bytes, peso 123 KB → 42.8 KB.
3. Iconos PNG y atom `email-icon`: 12 iconos PNG @2x generados con fondo transparente en `src/emails/assets/icons/` con `README.md` (licencia ISC); atom `<x-email-icon>` creado y 12 `<img>` de Iconify reemplazadas en `main.html`, `welcome` y `user-created` respetando modo claro/oscuro (D2: jsDelivr, D3: Lucide `hand`).
4. Automatización y validación de iconos (ajuste de alcance acordado): comando `bun run generate:icons` (`scripts/icons/generate-icon.ts`) mediante `@resvg/resvg-js@2.6.2` con opción `--suffix v<N>`, validador de referencias `<x-email-icon>` en `src/emails/**/*.html` con convención ampliada `lucide-<icono>-<hex6>(-v<N>)?` y rechazo explícito de `.png`, y guard de no-sobrescritura con respaldo `master`/`origin/master` integrado con `.github/workflows/ci.yml`; 37 tests en `scripts/icons/` cubriendo fixtures de error, éxito, sufijos y respaldos git.
5. Contrato de salida y baseline: `bun run check:dist-baseline` confirmó 0 alteraciones en variables ESP `{{ }}` (solo hashes SHA-256 modificados); baseline actualizado con `bun run update:dist-baseline` y validado verde; `bun run validate-email` con 0 errores verificando HTML, iconos y guard.
6. Limpieza de artefactos: plan operativo y script generador temporal en `docs/superpowers/` eliminados; `docs/superpowers/` permanece vacía.

### Controles de calidad (MHB-44)

Todos los controles pasaron en checkout limpio de `feature/mhb-44`: `bun install --frozen-lockfile`, `format:check`, `lint`, `typecheck`, `test` (700 tests en 91 archivos), `build`, `validate-email`, `check:dist-baseline`, `check-size` y `agents:check`.

### Revisión de cierre (MHB-44)

- **Procedimiento:** `task-review` sobre checkout de `feature/mhb-44` @ `362c324`.
- **Veredicto:** Aprobado (2026-09-28), segunda revisión independiente tras resolver B1 y B2.

---

## MHB-45 — Protección de `master` y política de Dependabot

- **Fecha de cierre:** 2026-09-25
- **Estado:** Completada
- **Implementador:** Perfil CI/seguridad
- **Revisor independiente:** Orquestador (checkout limpio de `feature/mhb-45` @ `1b9be53`)
- **Rama:** `feature/mhb-45`
- **Contrato:** `docs/implementation/PLAN.md` (MHB-45)

### Hechos de implementación (MHB-45)

1. Protección aplicada a `master` vía GitHub API: checks requeridos estrictos (`CI Pipeline`, `Accessibility & Contrast Audit`), `enforce_admins: true`, `required_linear_history: true`, PR obligatorio (0 aprobaciones, mantenedor único), sin force-push ni borrado.
2. Auto-merge de Dependabot restringido en `.github/workflows/dependabot-automerge.yml`: clasificación previa por `MANUAL_REVIEW_DEPS`, fusión con `--rebase`, sin paso de aprobación automática, exclusión obligatoria de dependencias del pipeline de email (`@maizzle/*`, `maizzle`, `tailwindcss`, `postcss`, `autoprefixer`, `juice`, `handlebars`).
3. `.github/dependabot.yml` con ecosistema `github-actions` (semanal) y grupos `dev-dependencies`/`actions` (minor/patch), excluyendo paquetes críticos del agrupamiento.
4. Bloqueo comprobado en GitHub real con PR desechable #45 (`test/mhb-45-red-check`): `CI Pipeline` FAILURE y `mergeStateStatus: BLOCKED`; PR cerrado y rama remota borrada (D2).
5. `CHANGELOG.md` actualizado bajo `[Unreleased]` (D1).

### Controles de calidad (MHB-45)

Todos los controles pasaron en checkout limpio de `feature/mhb-45`: `check:task-branch`, `lint` (html/js/md/json/css), `typecheck` (tsc + tsc estricto), `test` (634 pass, 0 fail), `format:check`, `build` (6 templates), `validate-email` (0 errores, 2 warnings preexistentes de MHB-44), `check:dist-baseline` (`dist/` coincide, sin diff), `check-size` (todos bajo 102 KB), `agents:check` (7 targets) y `git diff --check` (limpio).

### Desviaciones aprobadas (MHB-45)

- D1: entrada de MHB-45 en `CHANGELOG.md` bajo `[Unreleased]`.
- D2: push de rama desechable `test/mhb-45-red-check` y PR #45 con check rojo intencional contra `master`, cerrado y borrado tras la evidencia.

### Revisión de cierre (MHB-45)

- **Procedimiento:** `task-review` sobre checkout de `feature/mhb-45` @ `1b9be53`, re-ejecutando la suite completa de gates sin asumir lo declarado en `STATUS.md`.
- **Auditoría de diff `master...HEAD`:** sin `eslint-disable`, `@ts-ignore`/`@ts-expect-error`, exclusiones de `tsconfig*`, tests `skip`/`todo` ni archivos `.js`/`.mjs` nuevos; superficies tocadas coinciden con las autorizadas (`.github/dependabot.yml`, `.github/workflows/dependabot-automerge.yml`, `CHANGELOG.md`, `docs/implementation/STATUS.md`/`STATUS-HISTORY.md`); actualización menor de la tabla de estado en `PLAN.md` para reflejar cierres previos (MHB-40/41), sin cambio de contrato.
- **Contrato de salida:** sin diff en `dist/`; `check:dist-baseline` en coincidencia exacta; variables ESP `{{ }}` intactas.
- **Verificación independiente en GitHub:** `gh api .../branches/master/protection` confirma `CI Pipeline` y `Accessibility & Contrast Audit` como checks requeridos, `enforce_admins: true`, `required_linear_history: true`, 0 aprobaciones requeridas, sin force-push ni borrado — coincide con lo declarado. PR #45 confirmado `CLOSED`, `mergeStateStatus: BLOCKED`, check `CI Pipeline` en `FAILURE`; rama remota `test/mhb-45-red-check` confirmada eliminada (404).
- **Limpieza:** `docs/superpowers/mhb-45-proteccion-master.md` (artefacto auxiliar temporal) eliminado al confirmar el cierre, conforme a la invariante de `AGENTS.md`.
- **Veredicto:** Aprobado.

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
