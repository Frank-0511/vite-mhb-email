# Estado de implementación

## Resumen

- Proyecto: EmailForge Toolkit
- Fase actual: Fase 0 — Estabilización mínima publicable
- Tarea actual: F0-T6 — README, capturas, CHANGELOG y Release v1.1.0
- Estado: En revisión
- Última actualización: 2026-08-10

## Tareas completadas

### F0-T1 — Conectar runner de tests (`bun test`) ✅

Completada el 2026-06-29.

- `bun run test` descubre tests en `scripts/` y `src/web/`.
- `dist/` queda excluido mediante `bunfig.toml`.
- Se añadió un smoke test para `getProjectPaths`.

### F0-T2 — Gate de validación de compatibilidad en build ✅

Completada el 2026-06-29.

- El validador devuelve conteos por severidad.
- Los errores bloquean el build; las advertencias no lo bloquean.
- El comportamiento quedó cubierto por tests unitarios.

### F0-T3 — Typecheck con JSDoc + `tsconfig` (`checkJs`) ✅

Completada el 2026-06-30.

- Instalado `typescript@6.0.3` y `@types/node@26.0.1` como devDependencies.
- Creado `tsconfig.json` con `allowJs`, `checkJs`, `noEmit`, `module: nodenext`,
  `types: ["node"]`, `skipLibCheck: true`, alcance acotado a
  `scripts/shared/**` y `scripts/build/**` (excluye `*.test.js`).
- Añadido script `"typecheck": "tsc --noEmit"` en `package.json`.
- `bun run typecheck` pasa en verde; criterios de aceptación cumplidos.

### F0-T4 — Workflow de CI (GitHub Actions) ✅

Completada el 2026-06-30.

- Creado `.github/workflows/ci.yml` con job único `ci` (secuencial).
- Se activa en `push` y `pull_request` sobre cualquier rama.
- Pasos: checkout → `oven-sh/setup-bun@v2` (bun 1.2.2) → caché Bun por
  `bun.lockb` → `bun install --frozen-lockfile` → lint → typecheck → test →
  build.
- Sin dependencias nuevas en `package.json` ni `bunfig.toml`.

### F0-T5 — Limpieza de referencias a clone/challenge y artefactos ✅

Completada el 2026-06-30.

- `layout-tenpo.html` renombrado a `layout-alt.html`; contenido completamente
  genericado (logo, RRSS y texto legal reemplazados por variables `{{ }}` y
  `[[logoFooter]]`).
- URLs hardcodeadas de `images.tenpo.cl` en `supporting-section/index.html`
  reemplazadas por `{{ support_icon_url }}` y `{{ support_arrow_icon_url }}`.
- `package.json` `lint:md`: eliminado glob obsoleto `#analysis_results.md`.
- `dist/` se versiona intencionalmente como salida generada de los emails y no
  se incluye en `.gitignore` (R7 resuelto).
- `grep -ri "tenpo|challenge|curso|clone" src docs README.md` sin coincidencias
  relevantes; lint, build, typecheck, test y format:check en verde.

### F0-T6 — README, capturas, CHANGELOG y Release v1.1.0 ✅ (En revisión)

Implementación completada el 2026-07-01; integrada en `master` el 2026-08-10.

- README reescrito con badge de CI, sección problema/solución, arquitectura,
  capturas embebidas (dashboard, email desktop, email móvil), tabla de reglas de
  compatibilidad y referencia completa de scripts incluidos `test`/`typecheck`.
- `screenshots/`: `dashboard.png`, `email-welcome-desktop.png`,
  `email-welcome-mobile.png` generados y commiteados; `screenshots/` eliminado
  de `.gitignore`.
- `CHANGELOG.md` creado siguiendo Keep a Changelog para v1.1.0.
- `package.json` bumpeado de `1.0.0` a `1.1.0`.
- Cambios de `feature/f0-t6` integrados en `master` (HEAD
  `0d52a094a7332093396d53ec6696bffd58f2d15c`).
- Tag anotado `v1.1.0` publicado en `origin` sobre ese commit y GitHub Release
  publicado: <https://github.com/Frank-0511/vite-mhb-email/releases/tag/v1.1.0>.
- El CHANGELOG local y las notas remotas de v1.1.0 se reconciliaron con el
  contenido completo del tag, incluyendo iconos inline, branding y HTML
  generado.

## Tarea actual

### F0-T6 — README, capturas, CHANGELOG y Release v1.1.0

- Estado: En revisión.
- Pendiente de revisión humana del Release publicado y de aprobación del
  Checkpoint 0.

## Validaciones

| Comando                | Estado | Resultado resumido                                 |
| ---------------------- | ------ | -------------------------------------------------- |
| `bun run lint`         | Verde  | 0 errores (2026-08-10)                             |
| `bun run typecheck`    | Verde  | 0 errores; alcance: scripts/shared + scripts/build |
| `bun run test`         | Verde  | 13 tests aprobados (2026-08-10)                    |
| `bun run build`        | Verde  | CI en `master`: 3 templates, 0 errores, 3 warnings |
| `bun run format:check` | Verde  | formato correcto (2026-08-10)                      |

## Decisiones persistentes

- El proyecto mantiene JavaScript ESM con JSDoc; no se hará una migración global
  a TypeScript.
- El typecheck inicial se limita a `scripts/shared/**` y `scripts/build/**`;
  se ampliará en F2-T1.
- `typescript@6.0.3` y `@types/node@26.0.1` son devDependencies (versiones
  exactas, sin `^`); `skipLibCheck: true` evita ruido de tipos en dependencias
  de terceros.
- `tsconfig.json` excluye `*.test.js` (evaluados por `bun test`) y `dist/`.
- `dist/` permanece excluido del descubrimiento de tests.
- Los errores de compatibilidad bloquean el build; las advertencias no.
- `validateEmailHtml()` admite `distDirOverride` para aislar tests.
- El CI detecta cambios por ruta y ejecuta jobs condicionales de lint; el job
  `verify` ejecuta `typecheck → test → build` para cambios de código.
- La caché de Bun usa `bun.lock` (texto) como clave para invalidar ante
  cambios de dependencias.
- `dist/` se versiona intencionalmente para conservar el HTML final generado;
  no se incluye en `.gitignore`.
- `screenshots/` se commitea al repositorio (las capturas son artefactos de
  documentación, no de build); `.gitignore` actualizado para excluir solo
  `.temp-screenshots/`.

## Desviaciones

- F0-T2 validó el predicado del gate mediante tests unitarios en lugar de un
  test de integración que ejecute el proceso completo.
- El flag `--allow-warnings` previsto en F0-T2 no se implementó porque las
  advertencias ya son no bloqueantes por defecto.
- F0-T3 requirió instalar `@types/node` (además de `typescript`) para resolver
  `process`, `console` y módulos `node:*`; no era una dependencia bloqueante
  conocida, pero es correcta y mínima.
- F0-T4: el CI no incluye pasos de deployment ni release (fuera de alcance
  según PLAN.md; se posterga a F3/F0-T6 manual).
- F0-T4: la verificación de estado verde en GitHub Actions requiere un push
  real al repositorio remoto; no es ejecutable en local.
- F0-T5: `layout-tenpo.html` no era referenciado por ningún template ni
  script en producción; el renombrado a `layout-alt.html` no requirió
  actualizar imports externos.
- F0-T5: las URLs hardcodeadas de `images.tenpo.cl` en `supporting-section`
  se reemplazaron por variables ESP `{{ }}` en lugar de eliminar el partial,
  ya que el partial tiene valor estructural para futuros templates.
- F0-T6: las capturas del email compilado se generaron con `wkhtmltoimage`
  sobre el HTML real de `dist/`. `dashboard.png` se regeneró como captura real
  (Vite dev server + Chrome headless vía `puppeteer-core`, apuntando al
  ejecutable de Chrome de Windows) tras confirmar que el subagente de
  navegador inicial no pudo conectar por CDP dentro de WSL.
- F0-T6: tag `v1.1.0` y GitHub Release publicados el 2026-08-10. El Release
  conserva las notas de `CHANGELOG.md` y apunta al commit de `master`.
- F0-T6: el tag público se conserva en `0d52a09`; la corrección posterior
  documenta su alcance completo en lugar de reescribir la referencia publicada.

## Bloqueos

- Ninguno.

## Handoff

- F0-T6 marcada como `En revisión`.
- Verificado: cambios de F0-T6 integrados en `master`, checks locales en verde,
  CI exitoso del commit `0d52a094a7332093396d53ec6696bffd58f2d15c`, tag remoto
  `v1.1.0` y GitHub Release publicado.
- Pendiente de integrar: commit documental de trazabilidad; las notas
  corregidas del Release y la metadata remota (description/topics) ya fueron
  publicadas y verificadas.
- Acción pendiente del usuario: revisar el Release y aprobar o rechazar el
  Checkpoint 0. No iniciar F1-T1 sin esa aprobación explícita.
