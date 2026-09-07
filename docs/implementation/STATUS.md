# Estado de implementación — EmailForge Toolkit

## Resumen

- ID activo: MHB-09
- Estado: En revisión
- Implementador: implementador actual
- Revisor o autoridad de cierre: revisor de email
- Última actualización: 2026-09-07
- Contrato estable: `docs/implementation/PLAN.md`

Este archivo no replica el roadmap. Al iniciar una tarea, registrar solo el ID
asignado, sus validaciones y el handoff. El implementador solo puede entregarlo
en `En revisión`; otra autoridad decide `Completada`.

## Entrega para revisión (MHB-09)

- Alcance: arquitectura de arquetipos bajo Atomic Design en `src/emails/partials/templates/` (`starter`, `welcome`, `password-reset`, `receipt`, `newsletter`) descubiertos dinámicamente en tiempo de ejecución por `scripts/generators/archetypes.js` (`@ts-check`), dashboard web en `scripts/vite/plugins/dashboard.js` mostrando todos los templates presentes en disco (`src/emails/templates/`), generador interactivo (`--list`, creación desde cero o con arquetipo poblando `index.html` y `data.json`), CLI interactivo (`askCreationMode`, `askSelectArchetype`), eliminación de utilidades redundantes (`template-catalog.js`), eliminación del directorio residual `welcome2` y actualización de documentación y tests.
- Dependencias: MHB-06 y MHB-08 `Completada`.
- Rama: `feature/mhb-09`.
- Hechos de entrega:
  1. Módulo de descubrimiento dinámico en `scripts/generators/archetypes.js` con tipado JSDoc estricto (`@ts-check`): sin listas estáticas ni arrays hardcodeados. Descubre dinámicamente arquetipos en disco mediante `getAvailableArchetypes(rootDir)` inspeccionando `src/emails/partials/templates/` y obtiene metadata vía `getArchetypeById(id, rootDir)`.
  2. Dashboard web en `scripts/vite/plugins/dashboard.js` y `src/web/features/home/index.html`: renderiza todos los templates presentes en `src/emails/templates/` (actualmente `welcome`, `example` y `user-created`). Se eliminó la constante `INTERNAL_FIXTURES` y el filtro que excluía `example` y `user-created` del catálogo y de `/api/template-sizes`. Cero tarjetas fantasma ni enlaces rotos para templates inexistentes.
  3. Cinco arquetipos de template creados bajo Atomic Design en `src/emails/partials/templates/`: `welcome` (onboarding), `password-reset` (transaccional de seguridad), `receipt` (recibo de compra con desglose de ítems y totales), `newsletter` (boletín con artículos y desuscripción) y `starter` (base modular limpia). Cada uno provisto de `index.html` (componente Maizzle email-safe con dark mode), `schema.json` (metadata y variables ESP) y `data.json` (datos de contexto iniciales).
  4. Generador (`scripts/generators/generate-email.js`) y CLI interactivo (`scripts/cli/actions.js`, `scripts/cli/helpers.js`): soporte para `--list`, pregunta interactiva "¿Cómo deseas crear el template? [1] Desde cero / [2] Basado en un template existente", listado dinámico de opciones descubiertas en disco y generación con populación de `index.html` y `data.json`.
  5. Limpieza de residuales y documentación: eliminación de `scripts/shared/template-catalog.js` redundante; directorio residual `src/emails/templates/welcome2` removido; ejemplo en `scripts/build/build-selective.js` actualizado a `welcome`; `README.md` documentando la arquitectura atómica y comandos CLI.
  6. Suite de pruebas con 412 pruebas en verde y cero fallos en 48 archivos (incluyendo `archetypes.test.js`, `dashboard.test.js` y `helpers.test.js` actualizados para reflejar que todos los templates en disco se listan sin exclusiones).
- Controles automáticos ejecutados:
  - `bun run check:task-branch` → Verde (`feature/mhb-09`).
  - `bun run lint` → Verde (HTMLHint con 24 archivos, ESLint, markdownlint, JSON, Stylelint sin errores).
  - `bun run typecheck` → Verde (`tsc --noEmit` sin errores).
  - `bun run test` → Verde (412 pass, 0 fail, 1084 expects en 48 archivos).
  - `bun run format:check` → Verde (Prettier verificado en todo el proyecto).
  - `bun run build` → Verde (3 templates compilados exitosamente).
  - `bun run validate-email` → Verde (0 errores, 3 warnings conocidos `link-targets`, 1 info `company`).
  - `git diff --check` → Verde (sin advertencias ni whitespace residual).
- Controles manuales y smoke ejecutados:
  - Descubrimiento dinámico comprobado: `bun scripts/generators/generate-email.js --list` descubre y lista los 5 arquetipos en disco.
  - Creación de template con arquetipo comprobada: genera `index.html` y `data.json` consistentes y listos para Maizzle.
  - Verificación del dashboard web: renderiza `welcome`, `example` y `user-created` con iframe interactivo y métricas de tamaño, sin tarjetas fantasma.
- Riesgo residual: los 3 warnings `link-targets` y el info `company` provienen de templates base asignados a MHB-21.
- Estado: `En revisión`.

## Entrega para revisión (MHB-08)

- Alcance: descarga segura en preview de `<template>.html` con HTML final desde `POST /api/copy-html`, utilidad `downloadHtml` pura e inyectable con `isSafeDownloadTemplateName`, bloqueo de concurrencia en modal para las cuatro acciones, mensajes de descarga y tests unitarios y de integración.
- Dependencias: MHB-07 `Completada` (integrada en `master` en `708d8d7`).
- Rama: `feature/mhb-08`.
- Hechos de entrega:
  1. Utilidad pura `downloadHtml` e `isSafeDownloadTemplateName` en `src/web/features/preview/html-download.js`: valida el nombre bajo `/^[a-z0-9-]+$/`, MIME `text/html;charset=utf-8`, empaqueta en Blob, dispara click en anchor temporal y revoca URL en bloque finally sin exponer contenido HTML en mensajes.
  2. Formateador `formatDownloadSuccessMessage` en `copy-html-formatters.js` que integra validación ESP cuando `build: true` y conserva el contrato de copia.
  3. Vista `renderModalState` en `copy-html-view.js` extendida con helper seguro `setActionButtonsDisabled` que bloquea concurrentemente ambos botones de acción y controles durante `loading` y los restaura en `idle`/`success`/`error`/`clipboard-error`.
  4. Controlador `createCopyHtmlModalController` en `copy-html-modal.js` extendido con método `performDownload(build)` que reusa `POST /api/copy-html` (`build: true` o `false`), ignora cualquier propiedad no confiable del cuerpo (`result.template`) y delega a `downloadHtmlFn`.
  5. Rediseño integral de UX del modal y disparador: botón superior renombrado a "Exportar HTML" (icono file-output y tooltip descriptivo), modal de alta jerarquía visual (estilo Linear/Raycast/Tailwind UI con radio 16px, hairline borders, elevación suave), segmented control accesible para seleccionar modo ("Copiar al portapapeles" vs "Descargar archivo .html"), botón cancelar convertido en "X" en la esquina superior derecha, y dos Action Cards dinámicas con badges ("Recomendado" y "Rápido"), descripciones contextuales claras y flecha interactiva con hover lift. Todo con bloqueo concurrente y actualización segura sin innerHTML.
- Controles automáticos ejecutados:
  - `bun run check:task-branch` → Verde (`feature/mhb-08`).
  - `bun run lint` → Verde (HTMLHint, ESLint, markdownlint, JSON, Stylelint sin errores).
  - `bun run typecheck` → Verde (`tsc --noEmit` sin errores).
  - `bun run test` → Verde (386 pass, 0 fail, 992 expects en 43 archivos).
  - `bun run format:check` → Verde (Prettier verificado en todo el proyecto).
  - `bun run build` → Verde (3 templates compilados exitosamente).
  - `bun run validate-email` → Verde (0 errores, 3 warnings conocidos `link-targets`, 1 info `company`).
  - `git diff --check` → Verde (sin advertencias ni whitespace residual).
- Controles manuales y smoke ejecutados:
  - Servidor Vite en ejecución y verificación de endpoints:
    1. Descarga con `build: true` solicita `/api/copy-html?template=welcome` y produce HTML final compilado (17257 bytes).
    2. Descarga con `build: false` coincide byte a byte con `dist/welcome.html` (17257 bytes).
    3. `downloadHtml` valida nombre seguro `welcome.html`, genera Blob URL y revoca en `finally`.
    4. Fallo recuperable ante template inexistente devuelve `success: false` sin archivo parcial ni bloqueo permanente.
- Riesgo residual: los 3 warnings `link-targets` y el info `company` provienen de templates base asignados a MHB-21.
- Estado: `Completada`.

## Revisión de cierre (MHB-08)

- Criterios de aceptación comprobados: descarga en preview de `<template>.html` equivalente al HTML compilado desde `POST /api/copy-html`, validación de nombre de template con `isSafeDownloadTemplateName`, utilidad pura `downloadHtml` con Blob URL temporal y revocación segura en bloque `finally`, bloqueo concurrente en modal/toolbar para las cuatro combinaciones de copia y descarga, y rediseño de UI de exportación con Action Cards accesibles y segmented control.
- Controles automáticos: `check:task-branch`, `lint`, `typecheck`, `test` (386 pass / 0 fail en 43 archivos), `format:check`, `build` y `validate-email` verdes.
- Controles manuales y smoke: endpoints `/api/copy-html?template=welcome` verificados con `build: true` y `build: false` coincidiendo byte a byte con `dist/welcome.html`, Blob URL generado y revocado limpiamente, y error recuperable ante template inexistente sin bloqueo persistente.
- Evidencia revisada: commit `1999aac` en rama `feature/mhb-08`.
- Decisión del revisor: `Completada` (2026-09-06), autorizada por el usuario tras validación de controles y smoke manual.

## Revisión de cierre (MHB-07)

- Criterios de aceptación comprobados: diagnóstico estructurado y seguro ante fallos de render en `POST /api/render`, normalizador puro de errores, handler inyectable, cliente `RenderApiError` y vista accesible en preview.
- Controles: suite completa verde y merge a `master` confirmado en `708d8d7`.
- Decisión del revisor: `Completada` (2026-09-05).

## Últimas entregas

- MHB-08 completado: descarga segura de HTML final (`<template>.html`) desde `POST /api/copy-html`, utilidad `downloadHtml` e `isSafeDownloadTemplateName`, bloqueo concurrente en modal/toolbar, rediseño accesible de UI de exportación y suite con 386 pruebas verdes; commit `1999aac` en `feature/mhb-08`.
- MHB-07 completado: diagnóstico estructurado en `POST /api/render`, handler inyectable, cliente `RenderApiError` y vista accesible en preview; integrado en `master` (`708d8d7`).

- MHB-24 completada: modularización de components API, validador HTML, HMR
  preview, modal copy HTML y helper ESP; cierre autorizado tras revisión
  independiente, controles locales y smoke manual.
- MHB-06 completado: helper de variables ESP con composición de layouts y
  componentes alcanzables; faltantes como WARNING, sobrantes como INFO y
  `espVariables` en frontmatter como override intencional; integrado en
  preview, build completo y build selectivo sin bloquear la compilación.
- MHB-22 completado: licencia MIT materializada, README enlazado, metadata de
  autoría alineada y Fase A cerrada por el orquestador tras PR #13 mergeado;
  no se modifican versión, tag ni release.
- MHB-05 completado: 51 casos de guard/entrypoints + 2 casos de restauración del
  build selectivo; controles locales verdes y MR/PR asumido como mergeado.
- MHB-04 completado: CI por rutas, gate de formato, `verify` y alineación con
  Node 24; cierre confirmado tras CI remota verde.
- MHB-02 cerrado: procesos CLI/build sin shell, propagación de errores y
  regresiones Bun; cierre confirmado por el revisor.
- MHB-03 completado: documentación de release, línea base y revisión remota de
  `v1.1.0` confirmadas por el orquestador.
- MHB-01 completado: guard, alias Bun y exportación PNG portable con Puppeteer.

## MHB-04 completado

- Alcance: filtros de rutas, gate de formato y `verify` en
  `.github/workflows/ci.yml`; sin deploy, release, permisos ni artefactos.
- Dependencias: MHB-01, MHB-02 y MHB-03 `Completada`.
- Rama: `feature/mhb-04`, commit `cab72fd`.
- Entrega: matriz ruta→job, gate de formato, lint HTML alineado, partial hero
  corregido y alineación de proyecto/acciones con Node 24.
- Cierre: 2026-08-14 por el orquestador tras CI remota verde.

## MHB-05 completado

- Alcance: regresiones de seguridad de comandos y filesystem para los controles de
  MHB-01, MHB-02 y MHB-04; no rediseño del CLI ni soporte de shell.
- Dependencias: MHB-01, MHB-02 y MHB-04 `Completada`.
- Rama: `feature/mhb-05`.
- Entrega: tests de nombres inválidos, traversal, metacaracteres, códigos de
  salida y restauración del build selectivo; suite conectada al CI vía el job
  `verify` existente; ampliación autorizada de hooks y filtro CI para evitar que
  archivos staged no formateados pasen al commit.
- Hechos de entrega:
  1. `path-safety.test.js` cubre 17+ casos de nombres, traversal, separadores,
     metacaracteres de shell, tipos no string, `isPathInside` y códigos de salida
     exactos (`status === 1`) para los tres entrypoints y dos alias Bun.
  2. `build-selective.test.js` verifica restauración de `maizzle.config.js` y
     eliminación del backup tras fallos de `maizzle build` y de glob no
     encontrado, usando fixtures temporales y un `maizzle` falso en PATH.
  3. No se modificó el CLI, `maizzle.config.js` ni se añadieron dependencias.
  4. Por autorización del usuario, se formateó `vite-mhb-email.code-workspace` y se
     configuró `formatOnSave` y Prettier como formateador por defecto en el
     workspace para que el editor normalice al guardar.
  5. Por autorización del usuario, se amplió `lint-staged` en `package.json` con
     globs recursivos para `scripts/**/*.{js,mjs}`, `src/web/**/*.js`, configs JS,
     HTML de layouts/partials, Markdown, JSON, YAML y el workspace. Se conservan
     validadores existentes y no se añaden controles pesados en pre-commit.
  6. Por autorización del usuario, se agregó `*.code-workspace` al filtro `format`
     de `.github/workflows/ci.yml` y se protegió con `ci-route-matrix.test.js`.
  7. El diff toca `package.json`, `.github/workflows/ci.yml`,
     `scripts/shared/path-safety.test.js`, `scripts/ai/ci-route-matrix.test.js`,
     `scripts/build/build-selective.test.js`, `vite-mhb-email.code-workspace` y
     este `STATUS.md`.
- Estado: `Completada`.

## Validaciones

| Fecha      | ID     | Control                             | Resultado | Nota                                                                                                                                            |
| ---------- | ------ | ----------------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-10 | MHB-01 | Inventario de rutas                 | Verde     | Tres rutas localizadas; implementación pendiente.                                                                                               |
| 2026-08-10 | MHB-01 | Tabla y no escritura                | Verde     | 17 casos focalizados; traversal no crea ni muta rutas.                                                                                          |
| 2026-08-10 | MHB-01 | Lint, typecheck, formato y suite    | Verde     | `bun run lint`, `bun run typecheck`, `bun run format:check` y 30 pruebas.                                                                       |
| 2026-08-10 | MHB-01 | CLI manual válida                   | Verde     | El generador confirmó `welcome` existente sin escribir.                                                                                         |
| 2026-08-10 | MHB-01 | Alias Bun de CLI                    | Verde     | `generate:email` y `export:screenshot` reenvían argumentos y rechazan traversal.                                                                |
| 2026-08-10 | MHB-01 | Build y compatibilidad              | Verde     | Templates compilados; 0 errores y warnings de links no bloqueantes.                                                                             |
| 2026-08-10 | MHB-01 | Exportación PNG portable            | Verde     | Puppeteer descargado por Bun completó una exportación PNG de prueba.                                                                            |
| 2026-08-13 | MHB-02 | Inventario de procesos              | Verde     | Los dos `spawn` con `shell: true` fueron endurecidos; no quedan en CLI/build helper.                                                            |
| 2026-08-13 | MHB-02 | Regresiones focalizadas             | Verde     | `bun test`: 40 pruebas verdes, incluidas 10 de procesos CLI/build helper.                                                                       |
| 2026-08-13 | MHB-02 | Smoke de códigos y errores          | Verde     | Node confirmó propagación de código 7 y rechazo accionable ante `ENOENT`.                                                                       |
| 2026-08-13 | MHB-02 | Lint, typecheck y formato           | Verde     | ESLint, TypeScript, HTMLHint, Markdownlint, JSON, Stylelint y Prettier locales.                                                                 |
| 2026-08-13 | MHB-02 | Build manual vía CLI                | Verde     | Usuario confirmó build exitoso desde el menú del CLI.                                                                                           |
| 2026-08-13 | MHB-02 | Smoke focalizado tras fallo CI      | Verde     | Node verificó códigos, argumentos y ejecución sin shell con `spawn` inyectado.                                                                  |
| 2026-08-13 | MHB-02 | Bun suite tras ajuste CI            | Verde     | Usuario confirmó `bun run test` local en Bun 1.3.13.                                                                                            |
| 2026-08-13 | MHB-03 | Tag, línea base y artefactos        | Verde     | Tag, relación de ancestro, CI, lockfile, `dist` y capturas comprobados localmente.                                                              |
| 2026-08-13 | MHB-03 | Markdown, formato y diff            | Verde     | `lint:md`, `format:check` y `git diff --check` sin errores.                                                                                     |
| 2026-08-13 | MHB-03 | Release remota                      | Verde     | `v1.1.0` publicada, sin assets, no draft/prerelease; el tag apunta a `0d52a094`.                                                                |
| 2026-08-13 | MHB-03 | Guard de rama                       | Verde     | Preflight, hook vía `sh` y 3 regresiones Bun verifican `feature/mhb-03`.                                                                        |
| 2026-08-14 | MHB-04 | Rama y dependencias                 | Verde     | `feature/mhb-04`, guard de tarea y dependencias MHB-01/MHB-02/MHB-03 confirmadas.                                                               |
| 2026-08-14 | MHB-04 | Matriz y sintaxis CI                | Verde     | Test declarativo 4/4, YAML válido y `git diff --check` sin errores.                                                                             |
| 2026-08-14 | MHB-04 | Formato, tipos y pruebas            | Verde     | `format:check`, `lint:js`, `lint:json`, `typecheck` y 47 pruebas verdes.                                                                        |
| 2026-08-14 | MHB-04 | Lint/build completo                 | Verde     | HTMLHint sin errores; build exitoso con 3 warnings `href="#"` conocidos y no bloqueantes.                                                       |
| 2026-08-14 | MHB-04 | Validación remota                   | Verde     | CI `31814207687`: acciones Node 24, detect, formato, lints y verify verdes.                                                                     |
| 2026-08-17 | MHB-05 | Rama y dependencias                 | Verde     | `feature/mhb-05`, guard de tarea y dependencias MHB-01/MHB-02/MHB-04 confirmadas.                                                               |
| 2026-08-17 | MHB-05 | Regresiones de nombres y rutas      | Verde     | 51 casos en `path-safety.test.js`: guard, `isPathInside`, entrypoints y alias Bun.                                                              |
| 2026-08-17 | MHB-05 | Restauración build selectivo        | Verde     | 2 casos en `build-selective.test.js`: config y backup limpios tras ambos fallos.                                                                |
| 2026-08-17 | MHB-05 | Lint, typecheck y tests             | Verde     | `lint`, `typecheck`, `test` y `build` locales verdes; 81 pruebas verdes.                                                                        |
| 2026-08-17 | MHB-05 | Formato global del repositorio      | Verde     | `bun run format:check` pasa en todo el repositorio tras formatear `code-workspace`.                                                             |
| 2026-08-17 | MHB-05 | Ampliación lint-staged y CI         | Verde     | `lint-staged --diff=HEAD` corre 12 globs; matriz CI detecta workspace; 0 errores.                                                               |
| 2026-08-17 | MHB-05 | Validación email post-build         | Verde     | `validate-email` verde; 3 warnings `href="#"` conocidos y asignados a MHB-21.                                                                   |
| 2026-08-17 | MHB-22 | Licencia, enlace y metadata         | Verde     | `LICENSE` MIT, README y `package.json` coinciden con Frank Villanueva (2026).                                                                   |
| 2026-08-17 | MHB-22 | Gate completo de Fase A             | Verde     | Instalación congelada, lint, typecheck, 81 pruebas, build, validación email y formato.                                                          |
| 2026-09-03 | MHB-22 | Revisión del orquestador            | Verde     | Titular/año sustentados por historial Git y metadata; PR #13 mergeado en `92f0c96`.                                                             |
| 2026-09-03 | MHB-22 | Cierre de Fase A y decisión v1.1.1  | Verde     | MHB-01/MHB-02/MHB-03/MHB-04/MHB-22 `Completada`; `v1.1.1` no se publica sin autorización.                                                       |
| 2026-09-03 | MHB-06 | Helper esp-variables y suite        | Verde     | 23 casos nuevos (104 totales): coincidencia, faltante, sobrante, intencional, frontmatter ausente/mal formado, triple-stash y Maizzle.          |
| 2026-09-03 | MHB-06 | Integración en preview y build      | Verde     | `scripts/vite/api/render.js` loguea antes de compilar; `validate-email-html.js` añade regla `esp-variables` sin tocar severidades del gate.     |
| 2026-09-03 | MHB-06 | Lint, typecheck, format y build     | Verde     | ESLint, TypeScript, Prettier, `validate-email` y `bun run build` verdes; warnings/infos no bloquean (3 warnings + 7 infos en templates reales). |
| 2026-09-05 | MHB-07 | Suite, gates y smoke de render      | Verde     | 279 pruebas verdes, lint, typecheck, format:check, build, validate-email y ciclo 422/200 verificado.                                            |
| 2026-09-06 | MHB-08 | Suite, gates y rediseño exportación | Verde     | 386 pruebas verdes, lint, typecheck, format:check, build, validate-email y UX moderna de exportación verificado.                                |
| 2026-09-06 | MHB-09 | Catálogo, dashboard y gates         | Verde     | 428 pruebas verdes, lint, typecheck, format:check, build, validate-email y smoke sin enlaces rotos verificado.                                  |
| 2026-09-07 | MHB-09 | Corrección INTERNAL_FIXTURES        | Verde     | Se eliminó el filtro que excluía `example` y `user-created`; tests actualizados; 412 pass, 0 fail, 1084 expects en 48 archivos.                 |

## Ejecuciones delegadas

| Ámbito | Modelo/esfuerzo reales       | Estado      | Propiedad                                                                    | Handoff                                                                    |
| ------ | ---------------------------- | ----------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| MHB-01 | gpt-5.6-terra / alto         | Completada  | Guard, generador, exportador, build selectivo y tests                        | Usuario validó manualmente el resultado.                                   |
| MHB-02 | GPT-5.6 Luna / alto          | Completada  | Procesos CLI/build y regresiones Bun                                         | Cierre formal 2026-08-13 por el revisor.                                   |
| MHB-03 | GPT-5.6 Terra / medio        | Completada  | Documentación de release y matriz de reconciliación                          | Cierre formal 2026-08-13 por el orquestador.                               |
| MHB-04 | GPT-5.6 Luna / medio         | Completada  | CI por rutas, formato, verify y Node 24                                      | Cierre formal 2026-08-14 por el orquestador.                               |
| MHB-05 | Kimi K2.7 Code / alto        | Completada  | Tests de seguridad de comandos y filesystem                                  | Cierre asumido tras MR/PR mergeado por autorización del usuario.           |
| MHB-22 | Codex / bajo                 | Completada  | LICENSE, README, metadata y evidencia de Fase A                              | Cierre formal 2026-09-03 por el orquestador tras PR #13 mergeado.          |
| MHB-06 | Codex / alto                 | Completada  | Helper esp-variables, integración preview/build y suite                      | Cierre conciliado 2026-09-04 tras confirmación y merge del usuario.        |
| MHB-24 | Implementador actual / alto  | Completada  | Modularización componentes, validador, HMR, modal copy HTML y helper ESP     | Cierre autorizado por el usuario tras revisión independiente (2026-09-05). |
| MHB-07 | Implementador actual / alto  | Completada  | Handler 422, normalizador, render-api, vista accesible y tests               | Integrada en master (708d8d7).                                             |
| MHB-08 | Implementador actual / alto  | Completada  | Utilidad de descarga, bloqueo concurrente, rediseño UX modal/toolbar y tests | Cierre autorizado por el usuario tras verificación (2026-09-06).           |
| MHB-09 | Implementador actual / medio | En revisión | Catálogo canónico, dashboard sin scaffolds, tests y documentación            | Entregado para revisión independiente.                                     |

## Revisión de cierre (MHB-02)

- Criterios de aceptación comprobados: sin `shell` en rutas CLI/build helper,
  argumentos como array, propagación de códigos/errores/señales y regresiones Bun.
- Controles automáticos: lint, typecheck, formato y 40 pruebas verdes.
- Controles manuales: usuario confirmó build y suite en Bun 1.3.13.
- Evidencia revisada: commit `6ba9a23` en `feature/mhb-02`.
- Decisión del revisor: `Completada` (2026-08-13).

## Revisión de cierre (MHB-03)

- Criterios de aceptación comprobados: línea base reconciliada, documentación
  de release consistente y ausencia de publicación no autorizada.
- Controles automáticos: Markdownlint, Prettier y `git diff --check` verdes.
- Control remoto: `v1.1.0` publicada, sin assets, no draft/prerelease y con tag
  apuntando al commit `0d52a094`.
- Evidencia revisada: `RELEASE_BASELINE.md`, `README.md` y release remota de
  `v1.1.0`.
- Decisión del revisor: `Completada` (2026-08-13).

## Revisión de cierre (MHB-05)

- Criterios de aceptación comprobados: traversal, nombres inválidos, códigos de
  salida, aliases Bun y restauración de configuración ante fallos; CI ejecuta
  los casos mediante el job `verify`.
- Controles automáticos: `check:task-branch`, lint, typecheck, formato, 81
  pruebas, build y `validate-email` verdes; warnings `href="#"` conocidos y
  asignados a MHB-21.
- Evidencia revisada: commit `b4e6216` en `feature/mhb-05`, diff contra
  `origin/master` y validaciones registradas en este estado.
- Control remoto: MR/PR de `feature/mhb-05` hacia `master`, considerado
  mergeado por autorización explícita del usuario.
- Decisión del revisor: `Completada` (2026-08-17).

## Entrega para revisión (MHB-22)

- Bloque histórico: la entrega original quedó registrada en el commit
  `36cf384` y en el diff de PR #13. La revisión de cierre y la decisión
  posterior aparecen en la siguiente sección.

## Entrega para revisión (MHB-24)

- Alcance: modularización de components API (`components.js`,
  `component-catalog.js`, `component-preview-renderer.js`), validador HTML
  (`email-validation/`), preview HMR (`preview-hmr.js`), modal copy HTML
  (`copy-html-modal.js`) y helper ESP (`esp-variables.js`), conservando contratos
  públicos y compatibilidad de email.
- Dependencias: MHB-05 y MHB-06 `Completada`.
- Rama: `feature/mhb-24`.
- Hechos de entrega:
  1. API de componentes desacoplada en catálogo, renderizador y router HTTP;
     endurecimiento y validación previa de `componentName` y `variant` con error
     estructurado antes de acceder a filesystem.
  2. Validador HTML organizado por módulos de regla en `email-validation/rules/`
     con fachada CLI idéntica; regla `esp-variables` conserva severidades
     WARNING (faltante) e INFO (sobrante) y el gate mantiene que solo ERROR
     bloquea.
  3. Lógica HMR del preview desacoplada en `preview-hmr.js`, encapsulando
     decisiones de refresco y fuentes compartidas sin tocar la UI principal.
  4. Modal de copiar HTML modularizado con formateo puro, manejo seguro de
     portapapeles y renderizado DOM reactivo sin `innerHTML`.
  5. Helper ESP extrae `filterDataKeys` puro, exporta `ESP_SEVERITY` inmutable y
     conserva la firma y orden alfabético de `validateEspVariables`.
- Controles automáticos ejecutados:
  - `bun run check:task-branch` → Verde (`feature/mhb-24`).
  - `bun run lint` → Verde (HTMLHint, ESLint, markdownlint, JSON, Stylelint sin
    errores).
  - `bun run typecheck` → Verde (`tsc --noEmit` sin errores).
  - `bun run test` → Verde (241 pass, 0 fail, 600 expects en 28 archivos).
  - `bun run format:check` → Verde (Prettier en todo el proyecto).
  - `git diff --check` → Verde (sin advertencias ni whitespace residual).
  - `bun run build` → Verde (3 templates compilados exitosamente).
  - `bun run validate-email` → Verde (0 errores, 3 warnings conocidos
    `link-targets`, 1 info `company`).
- Controles manuales y smoke ejecutados:
  - Catálogo de componentes enumera los 3 componentes existentes; renderiza
    variante `v1` de `hero` con HTML completo.
  - Rechazo controlado de identificadores con traversal (`../bad`) y scripts.
  - Templates reales procesados sin falsos positivos de variables ESP faltantes.
  - Formateo de validación y control de estados del modal copy HTML verificados.
- Riesgo residual: los tres warnings `link-targets` y el INFO `company` se
  mantienen visibles y no bloquean el build; su tratamiento corresponde a
  MHB-21 o contenido futuro, no a esta modularización.
- Decisión del revisor: `Completada` (2026-09-05), autorizada por el usuario
  después de la revisión independiente, los controles locales y el smoke manual.

## Entrega para revisión (MHB-06)

- Bloque histórico: la entrega original quedó registrada con helper
  `scripts/email/esp-variables.js`, adaptador `scripts/email/esp-sources.js`,
  integración en `scripts/vite/api/render.js`,
  `scripts/build/validate-email-html.js`,
  `scripts/vite/services/selective-build.js` y exposición segura del resumen
  en `src/web/features/preview/`. La conciliación de cierre aparece en la
  sección "Revisión de cierre (MHB-06)".

## Revisión de cierre (MHB-22)

- Criterios de aceptación comprobados: `LICENSE` con MIT, titular Frank
  Villanueva y año 2026 coherentes con `package.json` y README; historial Git
  de 2026 con `frank05111996@gmail.com` y perfil GitHub `Frank-0511`
  sustentan la autoría.
- Controles automáticos: instalación congelada, lint, typecheck, 81 pruebas,
  build, `validate-email`, formato y `git diff --check` verdes en Bun
  `1.3.13` (`bf2e2cecf`).
- Control remoto: PR #13 mergeado a `master` (fast-forward) en `92f0c96`
  con CI verde; la rama `feature/mhb-22` se eliminó local y remotamente.
- Decisión técnica: el mínimo de Bun pasa de `>=1.0.0` a `>=1.3.13`,
  alineado con `packageManager` y CI; no se modifican versión, tag ni
  release publicada de `v1.1.0`.
- Riesgo residual: tres warnings `href="#"` de templates existentes
  pertenecen a MHB-21; no se ocultan ni bloquean MHB-22.
- Decisión del revisor: `Completada` (2026-09-03); Fase A cerrada con MHB-01,
  MHB-02, MHB-03, MHB-04 y MHB-22 `Completada`.
- Decisión de release: `v1.1.1` no se publica automáticamente; los cambios
  son documentación/metadata sin impacto en runtime, build, compatibilidad
  ni uso de ESP, por lo que no justifican un tag ni release nuevos. Cualquier
  release queda sujeta a autorización explícita del orquestador y al
  contrato de MHB-03/MHB-15.

## Revisión de cierre (MHB-06)

- Criterios de aceptación comprobados: faltantes como WARNING y sobrantes como
  INFO sin falsos positivos; `espVariables` en frontmatter reconocido como
  override intencional; helper puro sin DOM y composición segura de layouts y
  componentes alcanzables; integración no intrusiva en preview, build
  completo y build selectivo; HTML final conserva `{{ }}`.
- Controles automáticos: `bun run check:task-branch`, `bun run lint`,
  `bun run typecheck`, `bun test` (106 pass / 0 fail), `bun run validate-email`,
  `bun run build` y `bun run format:check` verdes; `git diff --check` sin
  warnings; 25 casos nuevos en `scripts/email/esp-variables.test.js`.
- Controles manuales: smoke de preview sobre `welcome`, `example` y
  `user-created`; build selectivo de `welcome` con `success: true` y resumen
  de validación emitido antes de compilar.
- Evidencia revisada: `feature/mhb-06` con helper `scripts/email/esp-variables.js`,
  adaptador `scripts/email/esp-sources.js`, integración en
  `scripts/vite/api/render.js`, `scripts/build/validate-email-html.js` y
  `scripts/vite/services/selective-build.js`, además de la exposición
  segura del resumen en `src/web/features/preview/`.
- Riesgo residual: `company` en `welcome` permanece como INFO legítimo;
  decidir si eliminarlo o incorporarlo es una decisión de contenido fuera
  del ID y queda registrada en MHB-09/MHB-21 si corresponde.
- Decisión del revisor: conciliada como `Completada` (2026-09-04) por
  confirmación y merge a `master` autorizados por el usuario; el ID no se
  reabre y la rama `feature/mhb-06` se considera mergeada.

## Revisión de cierre (MHB-04)

- Criterios de aceptación comprobados: cambios en workflow, layouts, templates,
  HTML/JS web, scripts, configuración y dependencias activan lint/verify
  aplicables; formato entra en CI; jobs omitidos quedan justificados por la
  matriz ruta→job.
- Controles automáticos: sintaxis YAML, test declarativo de matriz (4/4),
  `format:check`, lint JS/JSON, typecheck, 47 pruebas, HTMLHint y build local.
- Control remoto: [CI 31814207687](https://github.com/Frank-0511/vite-mhb-email/actions/runs/31814207687)
  verde en `8512fb2` con acciones Node 24, detect, formato, lints y verify.
- Evidencia revisada: `.github/workflows/ci.yml`, `package.json`, README,
  partial hero, test de matriz y run remoto.
- Decisión del revisor: `Completada` (2026-08-14).

## Decisiones técnicas locales

- El patrón permitido se conserva; el guard rechaza valores no string antes de construir rutas.
- La compatibilidad SendGrid Legacy con placeholders `-variable-` se mantiene permanentemente: solo se
  sustituyen en preview y envío local cuando `data.json` aporta el valor, mientras que el
  build final los preserva. No se autoriza retirarla ni renombrarla sin migración explícita
  y comprobada de todos los consumidores.
- Puppeteer reemplaza binarios globales para que `bun install` prepare el navegador de exportación.
- `buildIfNeeded` requiere un tick async antes de emitir en tests porque `await prompt()`
  precede al `spawn`; los tests de `run()` no necesitan ese flush.
- Los tests de procesos inyectan `spawn` para evitar interferencia entre mocks
  globales de módulos cuando Bun ejecuta archivos en paralelo.
- `execSync("maizzle build")` en build scripts quedó fuera de alcance de MHB-02.

## Desviaciones

- Los tres warnings `href="#"` existentes corresponden a MHB-21 y no bloquean MHB-02.
- La portabilidad del exportador fue ampliada por autorización explícita del usuario (MHB-01).
- El usuario autorizó añadir el guard de rama para evitar cambios MHB en `master`.
- MHB-04 amplía `lint:html` a layouts, partials y HTML web; por autorización del
  usuario, `showButton` se normalizó a `show-button` en el partial hero.
- Por autorización del usuario, Node.js 24 queda como requisito local mínimo y
  las acciones CI se actualizan a majors compatibles.
- Por autorización del usuario, se formateó `vite-mhb-email.code-workspace` y se
  configuró `formatOnSave` en el workspace para que el editor normalice al guardar.
- Por autorización del usuario, se amplió `lint-staged` y el filtro `format` de CI
  para cubrir archivos staged de layout/partial HTML, web JS, scripts `.mjs`,
  configs, YAML, Markdown recursivo, JSON recursivo y el workspace; no se añadieron
  controles pesados (typecheck/test/build) en pre-commit.

## Bloqueos

- Ninguno.

## Handoff

- MHB-04: `Completada`; rama `feature/mhb-04`, commit `cab72fd`; PR mergeado a
  `master`.
- MHB-02: `Completada`; rama `feature/mhb-02`, commit `6ba9a23`.
- MHB-03: `Completada`; matriz en `RELEASE_BASELINE.md`, CHANGELOG actualizado,
  README enlazado y guard de rama autorizado; no se movieron tags, versión ni
  notas remotas.
- MHB-05: `Completada`; rama `feature/mhb-05`, commit `b4e6216`; MR/PR
  considerado mergeado a `master` por autorización del usuario.
- MHB-22: `Completada`; rama `feature/mhb-22`, commit `36cf384`; PR #13
  mergeado a `master` en `92f0c96`. Fase A cerrada con MHB-01, MHB-02,
  MHB-03, MHB-04 y MHB-22 `Completada`.
- MHB-06: `Completada` por conciliación 2026-09-04; el usuario confirmó el
  cierre y merge a `master`. La rama `feature/mhb-06` se considera mergeada
  y el ID no se reabre.
- Decisión de release: `v1.1.1` no se publica automáticamente. Los cambios
  de MHB-22 son documentación/metadata sin impacto en runtime, build,
  compatibilidad ni uso de ESP, por lo que no justifican un tag ni release
  nuevos. Cualquier publicación queda sujeta a autorización explícita del
  orquestador y al contrato de MHB-03/MHB-15.
- Riesgo residual: el shell local usado para validaciones puede seguir en Node
  20.20.2; `.nvmrc` y CI exigen/verifican Node 24. No se modificaron tags,
  versión ni publicación.
- MHB-24: `Completada` por autorización del usuario tras revisión independiente;
  la rama `feature/mhb-24` queda preservada hasta que se decida merge o PR.
- MHB-07: `Completada`; integrada en `master` en `708d8d7`.
- MHB-08: `Completada`; rama `feature/mhb-08`, commit `1999aac`; cierre autorizado por el usuario tras validación de controles y smoke manual.
- MHB-09: `En revisión`; rama `feature/mhb-09`; catálogo dinámico en disco, dashboard sin exclusiones (todos los templates en `src/emails/templates/` visibles), corrección de `INTERNAL_FIXTURES` eliminada, 5 arquetipos atómicos en partials/templates leídos dinámicamente, soporte en generador/CLI y 412 pruebas verdes.
- Próxima acción inmediata: revisión independiente de email para confirmar aceptación y cierre de MHB-09.
- Siguiente tarea del roadmap: MHB-10 (bloqueada; depende de MHB-06 y MHB-09).
