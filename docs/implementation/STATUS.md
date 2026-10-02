# Estado de implementación — EmailForge Toolkit

## Resumen

- ID activo: ninguno
- Estado: MHB-42 `Completada` (2026-10-01)
- Implementador: Antigravity (perfil TypeScript/tooling)
- Revisor: `task-review` independiente (aprobado 2026-10-01)
- Rama: `feature/mhb-42`
- Última actualización: 2026-10-01
- Contrato activo: `docs/implementation/PLAN.md` (sección MHB-42)

## Paquete activo

- MHB-42: Spike de loaders de configuración y decisión de excepciones JS concluido.
- Hechos de entrega:
  1. Inventario de 22 archivos (1793 l.): 20 convertibles a `.ts` sin excepción (`postcss.config`, `tailwind.config`, `tailwind.email.config`, `selectors.js` y 16 módulos/tests en `scripts/ai/**`).
  2. Allowlist cerrada aprobada por el usuario: `eslint.config.js` (excepción obligatoria por `jiti >= 2.2.0` en ESLint 10.11) y `maizzle.config.js` (wrapper de 1 línea a `maizzle.config.ts`).
  3. Dimensionamiento estricto: `tsc --noEmit` arrojó solo 5 errores (TS2339 en `scripts/ai/`); decisión aprobada de mantener MHB-34 como ID único indiviso (umbral >150 errores no alcanzado).
  4. Linting con tipos: `parserOptions.project: ["./tsconfig.json"]` resuelve todos los archivos sin regresiones ni variación de tiempo (~4.0s); 42 guards de MHB-37 y 5 límites de `file-tree` verdes.
  5. Contratos de MHB-34 y MHB-36 actualizados en `PLAN.md`; saneamiento documental adicional en `PLAN.md` ajeno al spike (tabla «Backlog activo» depurada: retiradas MHB-44, MHB-46 y MHB-47 por completadas, y dependencias de MHB-42 y MHB-14 actualizadas a «Satisfecha»); `git diff master...HEAD` limitado a `docs/implementation/**`; sin cambios en dependencias ni `tsconfig*.json`.
- Controles de entrega (todos Verde): `check:task-branch`, `lint:md`, `format:check`, `git diff --check`, `check:dist-baseline`, `agents:check`. Evidencia Node 24 ejecutada bajo Node v24.21.0 en rama desechable: `selectors.ts` en `eslint` exit 0 con 47 tests de lint-guards verdes; error `jiti` reproducido en `eslint.config.ts` (confirma excepción JS en Node 24); `scripts/ai/**` con type stripping nativo exit 0 y 21 tests verdes; transformación CSS en Vite (length: 40361) y build/baseline idénticos con configs `.ts`; wrapper `maizzle.config.js` resuelve config sin flags.
- Riesgos residuales: ninguno; spike puramente documental en la rama entregable. `CHANGELOG.md` sin entrada declarada por ausencia de efecto observable.

## Revisión de cierre de MHB-42

- Veredicto: Aprobado (revisor independiente, 2026-10-01). Rama `feature/mhb-42`, commit `61078b9`.
- Controles re-ejecutados (todos Verde): `check:task-branch`, `lint`, `typecheck`, `test`, `format:check`, `build`, `validate-email`, `check:dist-baseline`, `check-size`, `agents:check`, `git diff --check`.
- Diff `master...HEAD`: solo `PLAN.md` y `STATUS.md`; sin `eslint-disable`, `@ts-*`, skip/todo ni cambios en `tsconfig*.json`, ESLint ni `dist/`.
- Criterios: allowlist cerrada, dimensionamiento (5 errores TS2339) y rutas de MHB-34/MHB-36 actualizadas en `PLAN.md`. Evidencia Node 24 (spike desechable eliminado) tomada del registro del implementador; no reproducible en el árbol actual.
- Pendiente antes de la PR: eliminar `docs/superpowers/mhb-42.md` y `docs/superpowers/mhb-42/` (temporales sin commitear).

## Baseline vigente

- La release [v1.2.0](https://github.com/Frank-0511/vite-mhb-email/releases/tag/v1.2.0) es el baseline funcional publicado.
- La migración a TypeScript por capas (núcleo, CLI, servidor Vite y dashboard web) está completada y mergeada a `master`; la trazabilidad de los IDs cerrados vive en Git.
- Las variables ESP `{{ }}` se preservan en el HTML final; `[[ page.* ]]` queda reservado para Maizzle.

## Últimas entregas

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
| MHB-47 | Completada | Contrato ESP / SendGrid | Revisión técnica independiente aprobada (`task-review`). |
| MHB-46 | Completada | Servidor Vite/seguridad | Revisión técnica independiente aprobada (`task-review`). |
| MHB-44 | Completada | Email y compatibilidad  | Revisión técnica independiente aprobada (`task-review`). |
| MHB-45 | Completada | CI y seguridad          | Revisión técnica independiente aprobada (`task-review`). |
| MHB-41 | Completada | Tooling y CI            | Revisión técnica independiente aprobada (`task-review`). |
| MHB-40 | Completada | Gobernanza y revisión   | Revisión aprobada y fusionada a `master` (ver HIST).     |

## Decisiones y desviaciones vigentes

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
- **Linting con tipos:** Configurado sobre `tsconfig.strict.json` en ESLint sin alterar los archivos `tsconfig*.json`.
- **Envoltorio async de middlewares:** Todo handler async en endpoints Vite se envuelve con `asyncHandler` en `scripts/vite/api/http.ts`.
- **Pruebas de guards sintéticos:** En `eslint-guards.test.ts` se anula `parserOptions.project` para evaluar snippets en memoria mediante AST puro.
- **Barrels index.ts puros:** Todos los `index.ts` bajo `scripts/` y `src/` actúan exclusivamente como puntos de reexport (`export ... from`).

## Handoff

- Próxima acción inmediata: abrir PR de `feature/mhb-42` a `master` (tras eliminar `docs/superpowers/mhb-42.md` y `docs/superpowers/mhb-42/`, temporales no commiteados).
- Siguiente tarea del roadmap:
  - MHB-34 ("Cierre total y modo estricto TypeScript"): `desbloqueado` una vez mergeado MHB-42; no iniciar sin asignación explícita.
