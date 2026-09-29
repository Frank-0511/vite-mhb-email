# Estado de implementación — EmailForge Toolkit

## Resumen

- ID activo: MHB-46
- Último cierre: MHB-44 — Compatibilidad del HTML exportado con clientes reales (`Completada`, revisor independiente `task-review`, aprobado 2026-09-28, PR #56 mergeada a `master`)
- Rama: `feature/mhb-46`
- Última actualización: 2026-09-29
- Contrato activo: `docs/implementation/PLAN.md`

## Paquete activo — MHB-46

- ID: MHB-46 — Endurecimiento de la API local del servidor Vite
- Estado: `En progreso`
- Implementador: Gemini 3.8 Flash (High)
- Revisor: revisor técnico independiente (`task-review`)
- Superficie: `scripts/vite/api/**`, `scripts/vite/services/render/request-handler.ts`, `scripts/shared/contracts/constants/http-security.ts`, `docs/implementation/`

### Controles de MHB-46

| Control                 | Comando                         | Estado | Detalle                      |
| :---------------------- | :------------------------------ | :----: | :--------------------------- |
| Comprobación de rama    | `bun run check:task-branch`     | Verde  | Conforme en `feature/mhb-46` |
| Dependencias congeladas | `bun install --frozen-lockfile` | Verde  | Lockfile sincronizado        |

## Baseline vigente

- La release [v1.2.0](https://github.com/Frank-0511/vite-mhb-email/releases/tag/v1.2.0) es el baseline funcional publicado.
- La migración a TypeScript por capas (núcleo, CLI, servidor Vite y dashboard web) está completada y mergeada a `master`; la trazabilidad de los IDs cerrados vive en Git.
- Las variables ESP `{{ }}` se preservan en el HTML final; `[[ page.* ]]` queda reservado para Maizzle.

## Última entrega

- MHB-44 `Completada` — Compatibilidad del HTML exportado con clientes reales:
  - Reglas de validación: 6 reglas nuevas en `validate-email` (`css-color-format`, `css-relative-units`, `img-svg-source`, `img-host-allowlist`, `example-domains`, `style-block-size`) y fix del límite de 8 KB por `<style>` (`maizzle.config.js`: `removeInlinedSelectors: true`).
  - Colores HEX y medidas px: preset `tailwindcss-preset-email@1.4.2` en `tailwind.email.config.js` neutralizando diferencias de layout, más corrección de 3 `rem`/`tracking` manuales. Resultado en `dist/`: 0 `rgb(… /`, 0 `rem`/`em`, 0 bloques `<style>` > 8192 bytes, peso 123 KB → 42.8 KB.
  - Iconos PNG y atom `email-icon`: 12 iconos PNG @2x generados con fondo transparente en `src/emails/assets/icons/` con `README.md` (licencia ISC); atom `<x-email-icon>` creado y 12 `<img>` de Iconify reemplazadas en `main.html`, `welcome` y `user-created` respetando modo claro/oscuro (D2: jsDelivr, D3: Lucide `hand`).
  - Automatización y validación de iconos (ajuste de alcance acordado): comando `bun run generate:icons` (`scripts/icons/generate-icon.ts`) mediante `@resvg/resvg-js@2.6.2` con opción `--suffix v<N>`, validador de referencias `<x-email-icon>` en `src/emails/**/*.html` con convención ampliada `lucide-<icono>-<hex6>(-v<N>)?` y rechazo explícito de `.png`, y guard de no-sobrescritura con respaldo `master`/`origin/master` integrado con `.github/workflows/ci.yml`; 37 tests en `scripts/icons/` cubriendo fixtures de error, éxito, sufijos y respaldos git.
  - Contrato de salida y baseline: `bun run check:dist-baseline` confirmó 0 alteraciones en variables ESP `{{ }}` (solo hashes SHA-256 modificados); baseline actualizado con `bun run update:dist-baseline` y validado verde; `bun run validate-email` con 0 errores verificando HTML, iconos y guard.
  - Limpieza de artefactos: plan operativo y script generador temporal en `docs/superpowers/` eliminados; `docs/superpowers/` permanece vacía.

### Controles de salida de MHB-44

| Control                   | Comando                         | Estado | Detalle                                       |
| :------------------------ | :------------------------------ | :----: | :-------------------------------------------- |
| Dependencias congeladas   | `bun install --frozen-lockfile` | Verde  | Lockfile sincronizado                         |
| Formato Prettier          | `bun run format:check`          | Verde  | Conforme en todos los archivos                |
| Linting estricto          | `bun run lint`                  | Verde  | Cero errores o advertencias                   |
| Verificación de tipos     | `bun run typecheck`             | Verde  | Doble pasada (base + strict) limpia           |
| Suite de pruebas          | `bun run test`                  | Verde  | 700 tests en 91 archivos pasan                |
| Build determinista        | `bun run build`                 | Verde  | 6 plantillas compiladas en dist/              |
| Sin cambios dist/ sueltos | `git diff --exit-code -- dist/` | Verde  | dist/ sincronizado con build                  |
| Validación de email       | `bun run validate-email`        | Verde  | 0 errores (6 warnings residuales RFC 2606)    |
| Baseline de dist/         | `bun run check:dist-baseline`   | Verde  | dist/ coincide exactamente con baseline.json  |
| Límites de tamaño HTML    | `bun run check-size`            | Verde  | Todas las plantillas < 102 KB (total 42.8 KB) |
| Sincronización agentes    | `bun run agents:check`          | Verde  | 7 targets de adaptadores conformes            |
| Integridad Git diff       | `git diff --check`              | Verde  | Sin marcadores ni trailing whitespace         |

### Riesgos residuales documentados

1. **Advertencias de dominios de ejemplo / link-targets:** 6 advertencias residuales en `validate-email` asociadas a `https://example.com` y `href="#"` en la configuración base de las plantillas (fuera de alcance de MHB-44).
2. **Disponibilidad de URLs jsDelivr antes del merge:** Las URLs en jsDelivr apuntan a `@master` del repositorio público; hasta que la PR sea mergeada a `master`, responderán HTTP 404 en consultas de red externas (verificado localmente en disco). La fijación de la URL a etiquetas de release formales corresponde a MHB-15.

## Revisión de cierre

- Veredicto: **Aprobado** (2026-09-28), segunda revisión independiente tras corregir dos hallazgos bloqueantes de la primera.
- Rama y commit: `feature/mhb-44` @ `362c324`, árbol de trabajo limpio.
- Hallazgos previos resueltos y verificados: B1 (guard con respaldo `origin/master` y `git fetch origin master` en `ci.yml`, con tests de respaldo) y B2 (convención `lucide-<icono>-<hex6>(-v<N>)?` en `scripts/shared/contracts/constants/email-assets.ts`, `generate:icons --suffix`, `-vx` y `-v0` rechazados); O1 (trabajo commiteado), O2 (`.png` rechazado con mensaje explícito) y O3 (700 tests).
- Controles re-ejecutados por el revisor, todos en verde: `check:task-branch`, `lint`, `typecheck`, `test` (700 pass, 0 fail), `format:check`, `build`, `validate-email`, `check:dist-baseline`, `check-size`, `agents:check` y `git diff --check`.
- Auditoría del diff: sin `eslint-disable`, `@ts-ignore`, `skip`/`todo`, `any` ni `.js`/`.mjs` nuevos; `scripts/icons/` con 8 archivos y ninguno sobre 250 líneas (tests bajo 400); `rg` de `rgb(… /`, `rem` y `.svg` en `dist/` devuelve 0.
- Contrato de salida: variables ESP `{{ }}` preservadas en los 6 templates y baseline coincidente.
- Riesgo residual aceptado: las URLs de jsDelivr `@master` responden 404 hasta el merge de la PR.

## Últimas entregas

- MHB-44: `Completada` el 2026-09-28; compatibilidad del HTML exportado (colores HEX, unidades px, iconos PNG @2x vía jsDelivr, reglas de `validate-email`), con generador `generate:icons`, validador de referencias y guard de no-sobrescritura, y revisión técnica independiente aprobada.
- MHB-45: `Completada` el 2026-09-25; protección de `master` (checks requeridos `CI Pipeline` y `Accessibility & Contrast Audit`, `enforce_admins`, historial lineal), auto-merge de Dependabot restringido con exclusión de dependencias del pipeline de email y ecosistema `github-actions` añadido, con revisión técnica independiente aprobada (D1–D2, detalle en `STATUS-HISTORY.md`).
- MHB-41: `Completada` el 2026-09-25; gate de contrato de salida (`dist/*.html` + variables ESP) y validadores de email en CI, con revisión técnica independiente aprobada (D1–D7, detalle en `STATUS-HISTORY.md`).
- MHB-40: `Completada` el 2026-09-25; gobernanza de agentes, skills `task-review` y `release-management`, corrección de 5 contradicciones y sincronización de adaptadores en 7 targets.

## Ejecuciones delegadas relevantes

| Ámbito | Estado      | Propiedad               | Handoff                                                      |
| :----- | :---------- | :---------------------- | :----------------------------------------------------------- |
| MHB-46 | En progreso | Servidor Vite/seguridad | Implementación de guarda de rechazo cross-site en endpoints. |
| MHB-44 | Completada  | Email y compatibilidad  | Revisión técnica independiente aprobada (`task-review`).     |
| MHB-45 | Completada  | CI y seguridad          | Revisión técnica independiente aprobada (`task-review`).     |
| MHB-41 | Completada  | Tooling y CI            | Revisión técnica independiente aprobada (`task-review`).     |
| MHB-40 | Completada  | Gobernanza y revisión   | Revisión aprobada y fusionada a `master` (ver HIST).         |

## Decisiones y desviaciones vigentes

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

- Próxima acción inmediata: implementar tests primero y guarda común de escritura (Paso 1).
- Siguiente tarea del roadmap:
  - MHB-47 ("Contrato de integración ESP y perfil SendGrid") bloqueada hasta el cierre de MHB-46.
