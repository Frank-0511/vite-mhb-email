# Estado de implementación — EmailForge Toolkit

## Resumen

- ID activo: MHB-46
- Estado: `En revisión`
- Último cierre: MHB-44 — Compatibilidad del HTML exportado con clientes reales (`Completada`, revisor independiente `task-review`, aprobado 2026-09-28, PR #56 mergeada a `master`)
- Rama: `feature/mhb-46`
- Última actualización: 2026-09-29
- Contrato activo: `docs/implementation/PLAN.md`

## Paquete activo — MHB-46

- ID: MHB-46 — Endurecimiento de la API local del servidor Vite
- Estado: `En revisión`
- Implementador: Gemini 3.8 Flash (High)
- Revisor: revisor técnico independiente (`task-review`)
- Superficie: `scripts/vite/api/**`, `scripts/vite/services/render/request-handler.ts`, `scripts/shared/contracts/constants/http-security.ts`, `docs/implementation/`, `CHANGELOG.md`

### Endpoints de escritura protegidos

| #   | Endpoint                               | Archivo                                           | `requireJson` | Protección activa                                            |
| --- | :------------------------------------- | :------------------------------------------------ | :-----------: | :----------------------------------------------------------- |
| 1   | `POST /api/data?template=`             | `scripts/vite/api/data.ts`                        |     true      | `Content-Type: application/json` + `Origin`/`Sec-Fetch-Site` |
| 2   | `POST /api/cache/invalidate?template=` | `scripts/vite/api/cache.ts`                       |     false     | `Origin`/`Sec-Fetch-Site` (sin cuerpo)                       |
| 3   | `POST /api/cache/clean`                | `scripts/vite/api/cache.ts`                       |     false     | `Origin`/`Sec-Fetch-Site` (sin cuerpo)                       |
| 4   | `POST /api/copy-html?template=`        | `scripts/vite/api/copy-html.ts`                   |     true      | `Content-Type: application/json` + `Origin`/`Sec-Fetch-Site` |
| 5   | `POST /api/render?template=`           | `scripts/vite/services/render/request-handler.ts` |     true      | `Content-Type: application/json` + `Origin`/`Sec-Fetch-Site` |
| 6   | `POST /api/components/:name/render`    | `scripts/vite/api/components.ts`                  |     true      | `Content-Type: application/json` + `Origin`/`Sec-Fetch-Site` |

### Controles de salida de MHB-46

| Control                     | Comando                         | Estado | Detalle                                                                                      |
| :-------------------------- | :------------------------------ | :----: | :------------------------------------------------------------------------------------------- |
| Comprobación de rama        | `bun run check:task-branch`     | Verde  | Conforme en `feature/mhb-46`                                                                 |
| Dependencias congeladas     | `bun install --frozen-lockfile` | Verde  | Lockfile sincronizado                                                                        |
| Formato Prettier            | `bun run format:check`          | Verde  | Conforme en todo el proyecto                                                                 |
| Linting estricto            | `bun run lint`                  | Verde  | Cero errores o advertencias                                                                  |
| Verificación de tipos       | `bun run typecheck`             | Verde  | Doble pasada (base + strict) limpia                                                          |
| Suite de pruebas            | `bun run test`                  | Verde  | 723 tests en 92 archivos pasan (0 fail)                                                      |
| Build determinista          | `bun run build`                 | Verde  | 6 plantillas compiladas en dist/                                                             |
| Sin cambios dist/ sueltos   | `git diff --exit-code -- dist/` | Verde  | dist/ idéntico al baseline                                                                   |
| Validación de email         | `bun run validate-email`        | Verde  | 0 errores (6 warnings residuales RFC 2606)                                                   |
| Baseline de dist/           | `bun run check:dist-baseline`   | Verde  | dist/ coincide exactamente con baseline.json                                                 |
| Sincronización agentes      | `bun run agents:check`          | Verde  | 7 targets de adaptadores conformes                                                           |
| Integridad Git diff         | `git diff --check`              | Verde  | Sin marcadores ni trailing whitespace                                                        |
| Tests de rechazo cross-site | `bun test scripts/vite/api`     | Verde  | 18 unitarios en `http.test.ts` y 10 en `write-endpoints.test.ts`                             |
| Smoke real con curl         | Verificación HTTP en dev server | Verde  | HTTP 403 ante text/plain, evil origin y cross-site; HTTP 200 en legítimas; data.json intacto |

### Riesgos residuales documentados

1. **Exposición en redes compartidas con `--host`:** La guarda protege contra peticiones cross-site desde navegadores del usuario (`Origin`/`Sec-Fetch-Site`); no implementa autenticación por diseño al ser un servidor local de desarrollo. Si el usuario levanta `vite --host` en una red hostil, atacantes de la red local directa podrían interactuar con la API.
2. **Recorrido visual del dashboard:** Guardar datos, copiar HTML e invalidar caché en la interfaz web de preview queda registrado como revisión manual del usuario.

## Baseline vigente

- La release [v1.2.0](https://github.com/Frank-0511/vite-mhb-email/releases/tag/v1.2.0) es el baseline funcional publicado.
- La migración a TypeScript por capas (núcleo, CLI, servidor Vite y dashboard web) está completada y mergeada a `master`; la trazabilidad de los IDs cerrados vive en Git.
- Las variables ESP `{{ }}` se preservan en el HTML final; `[[ page.* ]]` queda reservado para Maizzle.

## Últimas entregas

- MHB-44: `Completada` el 2026-09-28; compatibilidad del HTML exportado (colores HEX, unidades px, iconos PNG @2x vía jsDelivr, reglas de `validate-email`), con generador `generate:icons`, validador de referencias y guard de no-sobrescritura, y revisión técnica independiente aprobada (detalle en `STATUS-HISTORY.md`).
- MHB-45: `Completada` el 2026-09-25; protección de `master` (checks requeridos `CI Pipeline` y `Accessibility & Contrast Audit`, `enforce_admins`, historial lineal), auto-merge de Dependabot restringido con exclusión de dependencias del pipeline de email y ecosistema `github-actions` añadido, con revisión técnica independiente aprobada (D1–D2, detalle en `STATUS-HISTORY.md`).
- MHB-41: `Completada` el 2026-09-25; gate de contrato de salida (`dist/*.html` + variables ESP) y validadores de email en CI, con revisión técnica independiente aprobada (D1–D7, detalle en `STATUS-HISTORY.md`).
- MHB-40: `Completada` el 2026-09-25; gobernanza de agentes, skills `task-review` y `release-management`, corrección de 5 contradicciones y sincronización de adaptadores en 7 targets.

## Ejecuciones delegadas relevantes

| Ámbito | Estado      | Propiedad               | Handoff                                                              |
| :----- | :---------- | :---------------------- | :------------------------------------------------------------------- |
| MHB-46 | En revisión | Servidor Vite/seguridad | Guarda común contra escrituras cross-site implementada y verificada. |
| MHB-44 | Completada  | Email y compatibilidad  | Revisión técnica independiente aprobada (`task-review`).             |
| MHB-45 | Completada  | CI y seguridad          | Revisión técnica independiente aprobada (`task-review`).             |
| MHB-41 | Completada  | Tooling y CI            | Revisión técnica independiente aprobada (`task-review`).             |
| MHB-40 | Completada  | Gobernanza y revisión   | Revisión aprobada y fusionada a `master` (ver HIST).                 |

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

- Próxima acción inmediata: revisión técnica independiente de MHB-46 siguiendo la skill `task-review`.
- Siguiente tarea del roadmap:
  - MHB-47 ("Contrato de integración ESP y perfil SendGrid") bloqueada hasta el cierre de MHB-46.
