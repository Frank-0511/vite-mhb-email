# Estado de implementación — EmailForge Toolkit

## Resumen

- ID activo: MHB-49
- Estado: En progreso (MHB-49, con la regla css-unsupported-props incluida en el alcance)
- Implementador: perfil tooling, bajo
- Revisor: revisor técnico de tooling (distinto del implementador)
- Rama: `feature/mhb-62`
- Última actualización: 2026-11-22
- Contrato activo: `docs/implementation/PLAN.md` (sección MHB-62)

## Paquete activo

- MHB-62: Actualización de dependencias sin saltos mayores (Fase D). Estado: `Completada` (2026-11-23), mergeada en `master` como #77 (squash `c277448`). Desviación aprobada: `lint-staged` 17.6.1 en vez de 17.6.2 (cuarentena de Yarn).
- MHB-61: Versión mínima de Node.js 24.22.3 (Fase D). Estado: `Completada` (2026-11-23), mergeada en `master` como #76 (squash `7e5bd1c`).
- Propiedad de archivos: `package.json`, `bun.lock`, `CHANGELOG.md`, `docs/implementation/PLAN.md`, `docs/implementation/STATUS.md`.
- Controles (Node `v24.22.3`, tras cada uno de los 3 commits de dependencias):
  - `bun install --frozen-lockfile`, `lint`, `typecheck`, `test`, `format:check`, `build`, `validate-email`, `check:dist-baseline`, `check-size`: Verde
  - `git diff --exit-code -- dist/`: Verde (idéntico)
  - `rg "eslint-disable|@ts-ignore|@ts-expect-error" scripts src`: 5 entradas, las mismas que en `origin/master`
  - `validate-contrast` (parte de `check:a11y`): Verde (26 OK)
  - `check:a11y` completo (contraste + axe-core): Verde con Chrome 157.0.8103.78, la versión que `puppeteer` 25.18.1 resuelve por defecto (0 errores)
- Hechos de la entrega:
  1. Herramientas de desarrollo actualizadas (incluye `stylelint` 18 y su config 41), sin cambios de configuración.
  2. `nodemailer`, `lucide`, `puppeteer` y `vite` actualizados.
  3. `postcss` y `autoprefixer` actualizados con `dist/` idéntico.
  4. `CHANGELOG.md` `[Unreleased]` documenta los tres grupos.
  5. Desviación del contrato (aprobada por el usuario): `lint-staged` queda en `17.6.1` en vez de `17.6.2`. Yarn 4.18.1 pone en cuarentena `17.6.2` (publicada el 2026-11-22) y rompe `Compat (yarn)` en CI.

## Baseline vigente

- La release [v1.2.0](https://github.com/Frank-0511/vite-mhb-email/releases/tag/v1.2.0) es el baseline funcional publicado; la release `v1.3.0` está publicada (tag `v1.3.0` en `81d2b7c`, 2026-11-21).
- La migración a TypeScript por capas (núcleo, CLI, servidor Vite y dashboard web) está completada y mergeada a `master`; la trazabilidad de los IDs cerrados vive en Git.
- Las variables ESP `{{ }}` se preservan en el HTML final; `[[ page.* ]]` queda reservado para Maizzle.

## Últimas entregas

- MHB-15: `Completada` el 2026-11-21; release `v1.3.0` preparada y verificada, contrato de salida para integradores documentado en CHANGELOG, trazabilidad en `RELEASE_BASELINE.md` y checklist Go/No-Go aprobado.
- MHB-14: `Completada` el 2026-10-09; checklist de accesibilidad (12 criterios), matriz fechada E3, guard `evidence-matrix`, regla `title-present` y `<title>` descriptivo en 6 templates; pruebas en clientes de correo trasladadas a MHB-51.
- MHB-36: `Completada` el 2026-10-09; compatibilidad con Bun, npm, Yarn 4 y pnpm (Vitest, detección de package manager, CI Node 24 con matriz, `PR Guard`, scripts 30 → 18), `dist/` idéntico en el carril congelado y revisión técnica independiente aprobada.
- MHB-43: `Completada` el 2026-10-08; dependencias sin `maizzle`, `fs-extra` ni `glob`, build con API programática de Maizzle, reclasificación a `dependencies`, `@types/node` 24.x y fuentes vigiladas del preview unificadas, con `dist/` idéntico y revisión técnica independiente aprobada.
- MHB-34: `Completada` el 2026-10-08; cierre total y modo estricto TypeScript (20 archivos migrados, allowlist JS de 2 archivos, `tsconfig.strict.json` eliminado, `check:inventory --require-zero` en CI), `dist/` idéntico y revisión técnica independiente aprobada.
- MHB-42: `Completada` el 2026-10-01; spike de loaders con allowlist cerrada (`eslint.config.js`, `maizzle.config.js`) y MHB-34 indiviso; solo `docs/implementation/**`; revisión técnica independiente aprobada.
- MHB-47: `Completada` el 2026-10-01; manifiesto `dist/esp-manifest.json` con perfiles SendGrid Dynamic y Legacy, reglas `esp-syntax-profile` (ERROR) y `esp-legacy-compat` (WARNING), sanitización de `exampleData` y coherencia manifiesto↔baseline en `check:dist-baseline`, con revisión técnica independiente aprobada (detalle en `STATUS-HISTORY.md`).
- MHB-46: `Completada` el 2026-09-29; guarda común `rejectUnsafeWrite` (403 ante `Origin`/`Sec-Fetch-Site` cross-site y `Content-Type` distinto de JSON) aplicada a los 6 endpoints de escritura de la API local, con revisión técnica independiente aprobada (detalle en `STATUS-HISTORY.md`).
- MHB-44: `Completada` el 2026-09-28; compatibilidad del HTML exportado (colores HEX, unidades px, iconos PNG @2x vía jsDelivr, reglas de `validate-email`), con generador `generate:icons`, validador de referencias y guard de no-sobrescritura, y revisión técnica independiente aprobada (detalle en `STATUS-HISTORY.md`).
- MHB-45: `Completada` el 2026-09-25; protección de `master` (checks requeridos `CI Pipeline` y `Accessibility & Contrast Audit`, `enforce_admins`, historial lineal), auto-merge de Dependabot restringido con exclusión de dependencias del pipeline de email y ecosistema `github-actions` añadido, con revisión técnica independiente aprobada (D1–D2, detalle en `STATUS-HISTORY.md`).
- MHB-41: `Completada` el 2026-09-25; gate de contrato de salida (`dist/*.html` + variables ESP) y validadores de email en CI, con revisión técnica independiente aprobada (D1–D7, detalle en `STATUS-HISTORY.md`).
- MHB-40: `Completada` el 2026-09-25; gobernanza de agentes, skills `task-review` y `release-management`, corrección de 5 contradicciones y sincronización de adaptadores en 7 targets.

## Ejecuciones delegadas relevantes

| Ámbito | Estado     | Propiedad               | Handoff                                                  |
| :----- | :--------- | :---------------------- | :------------------------------------------------------- |
| MHB-36 | Completada | Tooling, CI y docs      | Revisión técnica independiente aprobada (`task-review`). |
| MHB-43 | Completada | Dependencias y build    | Revisión técnica independiente aprobada (`task-review`). |
| MHB-47 | Completada | Contrato ESP / SendGrid | Revisión técnica independiente aprobada (`task-review`). |
| MHB-46 | Completada | Servidor Vite/seguridad | Revisión técnica independiente aprobada (`task-review`). |
| MHB-44 | Completada | Email y compatibilidad  | Revisión técnica independiente aprobada (`task-review`). |
| MHB-45 | Completada | CI y seguridad          | Revisión técnica independiente aprobada (`task-review`). |
| MHB-41 | Completada | Tooling y CI            | Revisión técnica independiente aprobada (`task-review`). |
| MHB-40 | Completada | Gobernanza y revisión   | Revisión aprobada y fusionada a `master` (ver HIST).     |

## Decisiones y desviaciones vigentes

- **MHB-14 — Traslado de pruebas en clientes a etapa final (aprobado por el usuario, 2026-10-09):** la ejecución manual en Gmail, Outlook y Apple Mail pasa a MHB-51 (Fase G), ejecutada al final de todas las etapas. `PLAN.md` actualizado. Consecuencia: `v1.3.0` ya no espera evidencia en clientes; MHB-15 depende solo de MHB-14.

- **MHB-36 — Decisiones de planificación (aprobadas por el usuario, 2026-10-08):** (1) ID único, una rama y una PR, un commit por fase y un subagente nuevo por fase; (2) lockfiles: cada quien decide el suyo; el repo versiona solo `bun.lock` (manager del mantenedor), ignora `package-lock.json`, `yarn.lock` y `pnpm-lock.yaml`, y la CI valida yarn, npm y pnpm instalando desde cero; `.yarnrc.yml` solo con `nodeLinker: node-modules`; sin campo `packageManager`; (3) sin variable `.env`: el manager se detecta por `npm_config_user_agent` con `npm` por defecto; (4) Windows no soportado, se documenta en `README.md`; (5) la CI conserva `oven-sh/setup-bun` solo para la instalación congelada del carril principal (ajusta el criterio «sin `setup-bun`» del contrato original).
- **MHB-36 — Ampliación de alcance acordada (2026-10-09):** política de PR externas.
  - Workflow `pr-guard.yml` (`pull_request_target`, sin checkout): rechaza lockfiles ajenos y cambios en `.github/` desde forks.
  - `CONTRIBUTING.md` con esa política (criterio 10).
  - Tras el merge, `PR Guard` pasa a check requerido, con autorización del usuario.
  - Ya aplicado en GitHub: los workflows de PR externas requieren aprobación (`all_external_contributors`).
  - Descartado `CODEOWNERS` con revisión obligatoria, porque bloquearía el auto-merge de Dependabot.
- **MHB-36 — Ampliación de alcance acordada (2026-10-09):** simplificación de scripts de `package.json` (commit `6fb62bc`), pedida por el usuario.
  - Se retiran `test:watch`, `build-selective` (ahora `build <template>`), `generate:email`, `export:screenshot`, `lint:*` (incluidos en `lint`), `lint:contrast` y `a11y-check` (unificados en `check:a11y`), `check:inventory`, `esp:manifest` y `benchmark`; migración en `CHANGELOG.md`.
  - SemVer: se decide que la API pública son los comandos de `CLAUDE.md`; la release sigue siendo `v1.3.0` (`PLAN.md`, línea de versión decidida).
  - Verde tras el cambio con bun: `lint`, `typecheck`, `test`, `build`, `check:dist-baseline`, `format:check`, `agents:check`. No ejecutado: `check:a11y` (requiere navegador) y la verificación multi-manager, previa a este commit (la matriz de CI usa scripts sin cambios).
- **MHB-36 — Desviación de baseline en carril sin lockfile (aprobada por el usuario, 2026-10-09):**
  - Causa raíz: `@maizzle/framework@5.5.0` tiene rangos `^` en dependencias de minificación (`html-crush`, `email-comb`, `string-strip-html`) que sin lockfile resuelven parches más recientes de npm, cambiando espaciado y saltos de línea en `dist/` sin alterar variables ESP ni contratos.
  - Opción elegida (Opción 4): `check:dist-baseline` es gate estricto solo en el carril congelado con `bun.lock`; la matriz npm/yarn/pnpm valida build, validate-email, check-size, typecheck y test sin exigir hash SHA-256 idéntico al baseline.
  - Opciones descartadas: se descartó fijar transitivas en `package.json` vía overrides/resolutions (opción 1), versionar lockfiles ajenos en Git (opción 2) y ejecutar `bun update`/actualizar baseline (opción 3), para no acoplar el repositorio a dependencias transitivas ni alterar versiones de dependencias existentes.
- **Reestructuración de fases y releases (aprobada por el usuario, 2026-10-08):** cada fase cierra con su propio ID de release. Fase C = MHB-14 + MHB-15 (`v1.3.0`, con todo lo mergeado desde `v1.2.0`); Fase D = MHB-43, MHB-36, MHB-48 (si se cumple su disparador) + MHB-49 (`v1.4.0`); Fase E = MHB-38 + MHB-50 (versión a decidir al congelar); Fase F = MHB-16 y MHB-23, en paralelo desde `v1.3.0`. Se retiran de `PLAN.md` los contratos completados (MHB-44, MHB-46, MHB-47, MHB-42 y MHB-34). MHB-43 puede ejecutarse en paralelo con MHB-14; si se mergea antes del congelamiento de MHB-15, entra en `v1.3.0`.
- **MHB-42 — Allowlist cerrada de excepciones JS aprobada (2026-10-01):** `eslint.config.js` como excepción de terceros obligatoria (ESLint 10.11.0 requiere `jiti >= 2.2.0`; repo tiene `jiti@1.21.7`) y `maizzle.config.js` como wrapper de 1 línea (`export { default } from "./maizzle.config.ts";`) para soportar `maizzle build` estándar en `@maizzle/framework@5.5.0`. Los 20 archivos restantes son 100% convertibles a `.ts` sin excepciones.
- **MHB-42 — Decisión de división de MHB-34 aprobada (2026-10-01):** MHB-34 se mantiene como ID único indiviso (conteo estricto combinado: 5 errores TS2339 en `scripts/ai/`, 0 errores en otras carpetas; umbral >150 errores no alcanzado).
- **MHB-42 — Depuración de Backlog activo en PLAN.md (2026-10-01):** Cambio documental adicional ajeno al spike en PLAN.md: depuración de la tabla «Backlog activo» retirando las tareas ya completadas (MHB-44, MHB-46 y MHB-47) y actualizando la dependencia de MHB-42 y MHB-14 a «Satisfecha».
- **MHB-47 — Ampliación de alcance acordada (2026-09-29):** Soporte de SendGrid Legacy (etiquetas -variable-) además de Dynamic Templates. La fuente de verdad sigue siendo {{ }}; legacy se resuelve mediante el campo legacy del manifiesto y la regla esp-legacy-compat (WARNING). Delimitador por defecto: "-".
- **MHB-46 — Ajuste de alcance acordado (2026-09-29):** Inclusión de `scripts/vite/services/render/request-handler.ts` (y tests), endpoint 6 (`POST /api/components/:name/render`) en superficies autorizadas, y `requireJson: false` para endpoints de caché (`/api/cache/invalidate`, `/api/cache/clean`) por ausencia de cuerpo en el frontend.
- **D1 — Preset para email (aprobada 2026-09-25, MHB-44):** Adopción de `tailwindcss-preset-email@1.4.2` para forzar salida de colores en HEX y medidas en px, neutralizando discrepancias de layout en `tailwind.email.config.js`.
- **D2 — Hosting de iconos PNG (aprobada 2026-09-28, MHB-44):** Alojar los PNG optimizados en `src/emails/assets/icons/` servidos a través de jsDelivr sobre el propio repositorio público en GitHub.
- **D3 — Icono de saludo unificado (aprobada 2026-09-28, MHB-44):** Sustitución del icono `mdi:hand-wave` por Lucide `hand` en el saludo de `welcome`, unificando todos los iconos bajo el paquete `lucide` (licencia ISC) y evitando licencias externas adicionales.
- **MHB-44 — Ampliación de alcance acordada (2026-09-25):** Regla `style-block-size` (ERROR) en `validate-email` para respetar el límite de 8 KB por bloque `<style>` de Gmail y reactivación de `css.inline.removeInlinedSelectors: true` en `maizzle.config.js`.
- **MHB-44 — Ajuste de alcance acordado (2026-09-28):** Automatizar generación de iconos PNG con `@resvg/resvg-js@2.6.2` (`bun run generate:icons`) con opción `--suffix v<N>`, validación de referencias de `<x-email-icon>` (convención ampliada y rechazo explícito de `.png`), guard de no-sobrescritura con respaldo `master`/`origin/master` e integración en `.github/workflows/ci.yml` (superficie autorizada añadida) y `validate-email` sin alterar atom, hosting ni baseline.

- **Protección de `master` (aprobada 2026-09-25, MHB-45):** Checks requeridos `CI Pipeline` y `Accessibility & Contrast Audit`, rama actualizada (`strict`), PR obligatorio con 0 aprobaciones (mantenedor único), `enforce_admins`, historial lineal, sin force-push ni borrado.
- **Auto-merge de Dependabot (aprobado 2026-09-25, MHB-45):** Fusión con `--rebase`; dependencias del pipeline de email siempre en revisión manual.
- **Directiva MD024 en Changelog:** Directiva `markdownlint-configure-file { "MD024": { "siblings_only": true } }` en `CHANGELOG.md`.
- **Dependencia de desarrollo:** Autorizada `eslint-plugin-check-file@3.3.2` fijada exacta para forzar kebab-case y blocklist de helpers/utils.
- **Linting con tipos (MHB-34):** Reapuntado directamente a `tsconfig.json` en ESLint con `parserOptions.project`, retirando `tsconfig.strict.json` al unificar el modo estricto en el archivo principal.
- **Envoltorio async de middlewares:** Todo handler async en endpoints Vite se envuelve con `asyncHandler` en `scripts/vite/api/http.ts`.
- **Pruebas de guards sintéticos:** En `eslint-guards.test.ts` se anula `parserOptions.project` para evaluar snippets en memoria mediante AST puro.
- **Barrels index.ts puros:** Todos los `index.ts` bajo `scripts/` y `src/` actúan exclusivamente como puntos de reexport (`export ... from`).

## Revisión de cierre — MHB-15

- Veredicto: **Aprobado** (2026-11-21), rama `feature/mhb-15`, base commit `bb21bd1` más este cierre.
- Controles re-ejecutados en árbol limpio (todos Verde, rc=0): `check:task-branch`, `lint`, `typecheck`, `test` (106 archivos, 820 tests), `format:check`, `build`, `validate-email`, `check:dist-baseline`, `check-size` (43.01 KB), `agents:check`, `git diff --check`.
- Auditoría del diff `master...HEAD`: sin `eslint-disable`, `@ts-*`, skip/todo, `.js`/`.mjs` nuevos, cambios en `ignores`/`tsconfig*.json` ni en `file-tree.test.ts`. `package.json` incrementa a `1.3.0`; `CHANGELOG.md` incorpora la release `[1.3.0]` y sección «Contrato de salida para integradores»; `README.md` y `RELEASE_BASELINE.md` actualizados.
- Observaciones y riesgos residuales:
  1. El control de contrato en `check:dist-baseline` compara contra `baseline.json` (actualizado justificadamente en MHB-44 y MHB-14); la comparación histórica frente a `v1.2.0` se verificó analítica y manualmente, no mediante un script automatizado contra el tag.
  2. Las afirmaciones de colores HEX, medidas px y CDN de iconos se auditaron a nivel macro mediante las reglas de `validate-email`, tests unitarios y hash de baseline, sin revisión manual exhaustiva elemento por elemento ni en el changelog.
  3. Clientes de correo reales sin verificar hasta la etapa final en MHB-51.

## Handoff

- Próxima acción inmediata: ninguna pendiente en MHB-61 ni MHB-62; la siguiente acción la decide el usuario.
- Siguiente tarea del roadmap (no iniciar sin asignación explícita):
  - MHB-49 (Fase D): Release `v1.4.0` (tras MHB-15, MHB-36, MHB-61 y MHB-62). En preparación con alcance congelado, que incluye `css-unsupported-props`; pendiente de merge, tag y release.
  - MHB-48 (Fase D): actualización TypeScript 7 (bloqueada por disparador externo).
  - MHB-16 / MHB-23 (Fase F): demo/arquetipos opcionales, desbloqueados tras `v1.3.0`.
  - MHB-51 (Fase G): verificación manual final en clientes de correo tras las releases de roadmap.
