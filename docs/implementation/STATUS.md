# Estado de implementación — EmailForge Toolkit

## Resumen

- ID activo: MHB-47
- Estado: MHB-47 `En revisión`
- Implementador: Gemini Flash
- Revisor: Pendiente de asignación (revisión independiente requerida)
- Rama: `feature/mhb-47`
- Última actualización: 2026-09-29
- Contrato activo: `docs/implementation/PLAN.md`

## Paquete activo

- ID: MHB-47 — Contrato de integración ESP (manifiesto de variables, perfil SendGrid Dynamic y SendGrid Legacy)
- Estado: `En revisión` (entregado el 2026-09-29, rama `feature/mhb-47`)
- Hechos de la entrega:
  1. Perfiles ESP (`sendgrid` y `sendgrid-legacy`) en `scripts/shared/contracts/constants/esp-contract.ts` y tipos en `types/esp-contract.ts`.
  2. Reglas de validación `esp-syntax-profile` (ERROR) y `esp-legacy-compat` (WARNING) registradas en `validate-email`.
  3. Sanitización de datos de prueba (`exampleData`) con placeholder `<clave>` ante campos sensibles (`email`, `temp_password`, `*_name`, tokens).
  4. Generador determinista `dist/esp-manifest.json` y comando `esp:manifest` integrado en pipeline de build sin alterar los HTML de salida.
  5. Coherencia estricta manifiesto ↔ baseline integrada en `check:dist-baseline`.
- Controles: `bun install --frozen-lockfile` (Verde), `bun run format:check` (Verde), `bun run lint` (Verde), `bun run typecheck` (Verde), `bun run test` (Verde, 787 pass), `bun run build` (Verde, dist intacto), `bun run validate-email` (Verde, 0 errores), `bun run check-size` (Verde, <= 102 KB), `bun run check:dist-baseline` (Verde), `git diff --check` (Verde).
- Criterios de aceptación (sección 7):

| Criterio                                                                                       | Comando                                                                            | Resultado |
| :--------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------- | :-------: |
| El manifiesto existe para los seis templates y sus variables coinciden con baseline            | `bun run check:dist-baseline`                                                      |   Verde   |
| Fixture con `{{#if (eq a b)}}` en `dist/` hace fallar `validate-email`                         | `bun test scripts/validators/email-rules/rules/content/esp-syntax-profile.test.ts` |   Verde   |
| El manifiesto expone `legacy.tags` con formato `-variable-` para todas las `requiredVariables` | `bun test scripts/esp/manifest`                                                    |   Verde   |
| `esp-legacy-compat` marca un fixture con `{{#if a}}` y un fixture con colisión `-variable-`    | `bun test scripts/validators/email-rules/rules/content/esp-legacy-compat.test.ts`  |   Verde   |
| `check:dist-baseline` falla si el manifiesto no coincide con el baseline                       | `bun run check:dist-baseline` y `manifest-check.test.ts`                           |   Verde   |
| `dist/*.html` no cambia (`check:dist-baseline` verde para el HTML)                             | `bun run check:dist-baseline`                                                      |   Verde   |

- Análisis de mantenibilidad: 15 archivos fuente nuevos/modificados (todos ≤ 110 líneas; límite 250); 11 tests (todos ≤ 170 líneas; límite 400). Carpetas cumplen límite ≤ 8 archivos fuente (verificado por `file-tree.test.ts`). Reutilización de helpers centrales (`extractEspVariablesFromHtml`, `parseEspFrontmatter`, `getProjectPaths`).
- Desviaciones: Tipos de contrato ubicados en `scripts/shared/contracts/types/esp-contract.ts` para respetar el AST selector de ESLint de constants.
- Validación manual pendiente: El usuario confirma que `legacy.tags` y `legacy.convertible` sirven a su integración legacy real, además de la confirmación del consumo del manifiesto Dynamic desde su integración SendGrid externa (sin esa confirmación el revisor no puede cerrar el ID).
- Riesgos residuales:
  - SendGrid puede actualizar o ampliar helpers Handlebars en futuras versiones de su API; el perfil está acotado a la documentación estándar vigente.
  - No existe exportador que genere HTML con `-variable-`; solo se publica el mapeo en `dist/esp-manifest.json`.
  - No se modelan las etiquetas propias de legacy (`<%body%>`, `<%subject%>`, secciones).
  - El delimitador `-` es un supuesto por defecto, y la lista de bloques y helpers del perfil `sendgrid` está pendiente de contrastar con la documentación oficial vigente.

## Baseline vigente

- La release [v1.2.0](https://github.com/Frank-0511/vite-mhb-email/releases/tag/v1.2.0) es el baseline funcional publicado.
- La migración a TypeScript por capas (núcleo, CLI, servidor Vite y dashboard web) está completada y mergeada a `master`; la trazabilidad de los IDs cerrados vive en Git.
- Las variables ESP `{{ }}` se preservan en el HTML final; `[[ page.* ]]` queda reservado para Maizzle.

## Últimas entregas

- MHB-46: `Completada` el 2026-09-29; guarda común `rejectUnsafeWrite` (403 ante `Origin`/`Sec-Fetch-Site` cross-site y `Content-Type` distinto de JSON) aplicada a los 6 endpoints de escritura de la API local, con revisión técnica independiente aprobada (detalle en `STATUS-HISTORY.md`).
- MHB-44: `Completada` el 2026-09-28; compatibilidad del HTML exportado (colores HEX, unidades px, iconos PNG @2x vía jsDelivr, reglas de `validate-email`), con generador `generate:icons`, validador de referencias y guard de no-sobrescritura, y revisión técnica independiente aprobada (detalle en `STATUS-HISTORY.md`).
- MHB-45: `Completada` el 2026-09-25; protección de `master` (checks requeridos `CI Pipeline` y `Accessibility & Contrast Audit`, `enforce_admins`, historial lineal), auto-merge de Dependabot restringido con exclusión de dependencias del pipeline de email y ecosistema `github-actions` añadido, con revisión técnica independiente aprobada (D1–D2, detalle en `STATUS-HISTORY.md`).
- MHB-41: `Completada` el 2026-09-25; gate de contrato de salida (`dist/*.html` + variables ESP) y validadores de email en CI, con revisión técnica independiente aprobada (D1–D7, detalle en `STATUS-HISTORY.md`).
- MHB-40: `Completada` el 2026-09-25; gobernanza de agentes, skills `task-review` y `release-management`, corrección de 5 contradicciones y sincronización de adaptadores en 7 targets.

## Ejecuciones delegadas relevantes

| Ámbito | Estado      | Propiedad               | Handoff                                                                               |
| :----- | :---------- | :---------------------- | :------------------------------------------------------------------------------------ |
| MHB-47 | En revisión | Contrato ESP / SendGrid | Revisión técnica independiente requerida (`task-review`) y validación manual externa. |
| MHB-46 | Completada  | Servidor Vite/seguridad | Revisión técnica independiente aprobada (`task-review`).                              |
| MHB-44 | Completada  | Email y compatibilidad  | Revisión técnica independiente aprobada (`task-review`).                              |
| MHB-45 | Completada  | CI y seguridad          | Revisión técnica independiente aprobada (`task-review`).                              |
| MHB-41 | Completada  | Tooling y CI            | Revisión técnica independiente aprobada (`task-review`).                              |
| MHB-40 | Completada  | Gobernanza y revisión   | Revisión aprobada y fusionada a `master` (ver HIST).                                  |

## Decisiones y desviaciones vigentes

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

- Próxima acción inmediata: revisión técnica independiente (`task-review`) de MHB-47 y validación manual del usuario de `dist/esp-manifest.json` en integración SendGrid externa.
- Siguiente tarea del roadmap:
  - MHB-42 ("Spike de loaders y decisión de excepciones JS"): bloqueada hasta completar y mergear MHB-47; no iniciar sin asignación explícita.
