# Estado de implementación — EmailForge Toolkit

## Resumen

- ID activo: MHB-36
- Estado: En progreso
- Implementador: perfil tooling/infraestructura, medio-alto (orquestador + subagentes por fase)
- Revisor: revisor técnico independiente
- Rama: `feature/mhb-36`
- Última actualización: 2026-10-09
- Contrato activo: `docs/implementation/PLAN.md` (sección MHB-36)

## Paquete activo

- MHB-36: Compatibilidad multi-package-manager (Fase D). Estado: `En progreso`, desbloqueada (MHB-43 mergeada).
- Plan ejecutable: `docs/superpowers/mhb-36.md` (temporal; un subagente nuevo por fase, un commit por fase).
- Línea base: Node v24.21.0 (v22.23.1 default), Bun 1.3.13, Yarn 1.22.22 / 4.18.1, pnpm 10.18.3 / 12.10.1, npm 11.19.0 / 10.9.8.
- Suite inicial: 795 pass, 0 fail, 103 files (`bun test`).
- Build inicial y dist baseline: verde (`bun run build && bun run check:dist-baseline`).
- Decisiones de planificación: ver «Decisiones y desviaciones vigentes» (MHB-36, 2026-10-08).

## Baseline vigente

- La release [v1.2.0](https://github.com/Frank-0511/vite-mhb-email/releases/tag/v1.2.0) es el baseline funcional publicado.
- La migración a TypeScript por capas (núcleo, CLI, servidor Vite y dashboard web) está completada y mergeada a `master`; la trazabilidad de los IDs cerrados vive en Git.
- Las variables ESP `{{ }}` se preservan en el HTML final; `[[ page.* ]]` queda reservado para Maizzle.

## Últimas entregas

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
| MHB-43 | Completada | Dependencias y build    | Revisión técnica independiente aprobada (`task-review`). |
| MHB-47 | Completada | Contrato ESP / SendGrid | Revisión técnica independiente aprobada (`task-review`). |
| MHB-46 | Completada | Servidor Vite/seguridad | Revisión técnica independiente aprobada (`task-review`). |
| MHB-44 | Completada | Email y compatibilidad  | Revisión técnica independiente aprobada (`task-review`). |
| MHB-45 | Completada | CI y seguridad          | Revisión técnica independiente aprobada (`task-review`). |
| MHB-41 | Completada | Tooling y CI            | Revisión técnica independiente aprobada (`task-review`). |
| MHB-40 | Completada | Gobernanza y revisión   | Revisión aprobada y fusionada a `master` (ver HIST).     |

## Decisiones y desviaciones vigentes

- **MHB-36 — Decisiones de planificación (aprobadas por el usuario, 2026-10-08):** (1) ID único, una rama y una PR, un commit por fase y un subagente nuevo por fase; (2) lockfiles: cada quien decide el suyo; el repo versiona solo `bun.lock` (manager del mantenedor), ignora `package-lock.json`, `yarn.lock` y `pnpm-lock.yaml`, y la CI valida yarn, npm y pnpm instalando desde cero; `.yarnrc.yml` solo con `nodeLinker: node-modules`; sin campo `packageManager`; (3) sin variable `.env`: el manager se detecta por `npm_config_user_agent` con `npm` por defecto; (4) Windows no soportado, se documenta en `README.md`; (5) la CI conserva `oven-sh/setup-bun` solo para la instalación congelada del carril principal (ajusta el criterio «sin `setup-bun`» del contrato original).
- **MHB-36 — Ampliación de alcance acordada (2026-10-09):** política de PR externas.
  - Workflow `pr-guard.yml` (`pull_request_target`, sin checkout): rechaza lockfiles ajenos y cambios en `.github/` desde forks.
  - `CONTRIBUTING.md` con esa política (criterio 10).
  - Tras el merge, `PR Guard` pasa a check requerido, con autorización del usuario.
  - Ya aplicado en GitHub: los workflows de PR externas requieren aprobación (`all_external_contributors`).
  - Descartado `CODEOWNERS` con revisión obligatoria, porque bloquearía el auto-merge de Dependabot.
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

## Handoff

- MHB-34 (PR #65) y MHB-43 mergeadas a `master`; `docs/superpowers/mhb-43.md` eliminado.
- Próxima acción inmediata: asignar MHB-36 y ejecutar `docs/superpowers/mhb-36.md` desde la fase F0 en `feature/mhb-36`.
- Siguientes tareas del roadmap (no iniciar sin asignación explícita):
  - MHB-36 (Fase D): desbloqueada; planificada.
  - MHB-14 (Fase C): desbloqueada; requiere acceso del usuario a Gmail, Outlook y Apple Mail. Su cierre habilita MHB-15 (`v1.3.0`).
