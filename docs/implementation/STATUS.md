# Estado de implementación — EmailForge Toolkit

## Resumen

- ID activo: MHB-34
- Estado: Completada
- Implementador: Antigravity (perfil TypeScript/tooling transversal)
- Revisor: revisor técnico final independiente
- Rama: `feature/mhb-34`
- Última actualización: 2026-10-08
- Contrato activo: `docs/implementation/PLAN.md` (sección MHB-34)

## Paquete activo

- MHB-34: Cierre total y modo estricto TypeScript.
- Alcance: migración de 20 archivos propios restantes (.js/.mjs) a TypeScript, modo estricto único (`strict`, `verbatimModuleSyntax`, `erasableSyntaxOnly`) sin `tsconfig.strict.json` ni `allowJs`/`checkJs`, allowlist cerrada (`eslint.config.js` y wrapper `maizzle.config.js`), gate de inventario `--require-zero`, saneamiento de tooling AI y cumplimiento de límites de árbol.
- Estado: Completada (revisión independiente aprobada el 2026-10-08).
- Hechos de la entrega:
  1. 20 archivos propios (.js/.mjs) migrados a .ts estricto; solo `eslint.config.js` y wrapper `maizzle.config.js` permanecen como JS (allowlist cerrada de MHB-42).
  2. Configuraciones raíz (`postcss`, `tailwind`, `tailwind.email`, `maizzle`) tipadas y directivas `@config` actualizadas en CSS.
  3. `scripts/ai/**` y `check-task-branch` migrados a .ts con type stripping nativo de Node 24, 5 TS2339 corregidos con `isEnoent`, y comandos actualizados en `package.json`.
  4. Modo estricto único unificado en `tsconfig.json` (`strict`, `verbatimModuleSyntax`, `erasableSyntaxOnly`); eliminados `tsconfig.strict.json` y `allowJs`/`checkJs`.
  5. Gate `check:inventory --require-zero` bloqueante activo (exit 0; 2 JS allowlist, 303 TS); matriz de gates completa en Verde y `dist/` 100% idéntico.
- Controles ejecutados (todos Verde): `check:task-branch`, `frozen-install`, `lint`, `typecheck`, `test` (790 pass), `format:check`, `build`, `validate-email`, `lint:contrast`, `a11y-check`, `agents:check`, `check:inventory`, `check:dist-baseline`, `check-size`, `git diff --check`.
- Verificación manual declarada: inspección de salidas CLI en comandos de agentes e inventario; interacción de dashboard web reservada a petición expresa (Browser pane no abierto).
- Desviaciones: ninguna.
- Riesgos residuales: ninguno.

## Revisión de cierre de MHB-34

- Veredicto: Aprobado (revisor independiente, 2026-10-08). Rama `feature/mhb-34`, commit revisado `3dc07cd`.
- Controles re-ejecutados (todos Verde): `check:task-branch`, `bun install --frozen-lockfile`, `lint`, `typecheck`, `test`, `format:check`, `build`, `validate-email`, `lint:contrast`, `a11y-check`, `agents:check`, `check:inventory --require-zero`, `check:dist-baseline`, `check-size`, `git diff --check`.
- Diff `master...HEAD`: sin `eslint-disable`, `@ts-ignore`/`@ts-expect-error`, `any`, `@typedef`, skip/todo ni archivos `.js`/`.mjs` nuevos; `tsconfig.json` activa `strict`, `verbatimModuleSyntax` y `erasableSyntaxOnly` sin `allowJs`/`checkJs`; `tsconfig.strict.json` eliminado; sin cambios en `dist/`.
- Criterios: `rg --files -g '*.js' -g '*.mjs'` devuelve solo `eslint.config.js` y `maizzle.config.js`; `typecheck` es un único `tsc --noEmit`; `check:inventory --require-zero` finaliza en 0 y está en CI; límites de árbol validados por `file-tree.test.ts`; `CHANGELOG.md` actualizado.
- Desviaciones: ninguna. Validación manual de UI (Browser pane) no realizada por regla del proyecto; cobertura por gates deterministas.

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
- **Linting con tipos (MHB-34):** Reapuntado directamente a `tsconfig.json` en ESLint con `parserOptions.project`, retirando `tsconfig.strict.json` al unificar el modo estricto en el archivo principal.
- **Envoltorio async de middlewares:** Todo handler async en endpoints Vite se envuelve con `asyncHandler` en `scripts/vite/api/http.ts`.
- **Pruebas de guards sintéticos:** En `eslint-guards.test.ts` se anula `parserOptions.project` para evaluar snippets en memoria mediante AST puro.
- **Barrels index.ts puros:** Todos los `index.ts` bajo `scripts/` y `src/` actúan exclusivamente como puntos de reexport (`export ... from`).

## Handoff

- Próxima acción inmediata: abrir la PR de `feature/mhb-34` a `master` y mergear; no iniciar otro ID sin asignación.
- Siguiente tarea del roadmap:
  - MHB-43 ("Retirar dependencias huérfanas y CLI maizzle heredado"): `desbloqueado` una vez mergeado MHB-34; no iniciar sin asignación explícita.
