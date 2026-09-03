# Estado de implementación — EmailForge Toolkit

## Resumen

- ID activo: MHB-06
- Estado: En progreso
- Implementador: pendiente de asignación
- Revisor o autoridad de cierre: revisor de seguridad/compatibilidad
- Última actualización: 2026-09-03
- Contrato estable: `docs/implementation/PLAN.md`

Este archivo no replica el roadmap. Al iniciar una tarea, registrar solo el ID
asignado, sus validaciones y el handoff. El implementador solo puede entregarlo
en `En revisión`; otra autoridad decide `Completada`.

## Últimas entregas

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

| Fecha      | ID     | Control                            | Resultado | Nota                                                                                      |
| ---------- | ------ | ---------------------------------- | --------- | ----------------------------------------------------------------------------------------- |
| 2026-08-10 | MHB-01 | Inventario de rutas                | Verde     | Tres rutas localizadas; implementación pendiente.                                         |
| 2026-08-10 | MHB-01 | Tabla y no escritura               | Verde     | 17 casos focalizados; traversal no crea ni muta rutas.                                    |
| 2026-08-10 | MHB-01 | Lint, typecheck, formato y suite   | Verde     | `bun run lint`, `bun run typecheck`, `bun run format:check` y 30 pruebas.                 |
| 2026-08-10 | MHB-01 | CLI manual válida                  | Verde     | El generador confirmó `welcome` existente sin escribir.                                   |
| 2026-08-10 | MHB-01 | Alias Bun de CLI                   | Verde     | `generate:email` y `export:screenshot` reenvían argumentos y rechazan traversal.          |
| 2026-08-10 | MHB-01 | Build y compatibilidad             | Verde     | Templates compilados; 0 errores y warnings de links no bloqueantes.                       |
| 2026-08-10 | MHB-01 | Exportación PNG portable           | Verde     | Puppeteer descargado por Bun completó una exportación PNG de prueba.                      |
| 2026-08-13 | MHB-02 | Inventario de procesos             | Verde     | Los dos `spawn` con `shell: true` fueron endurecidos; no quedan en CLI/build helper.      |
| 2026-08-13 | MHB-02 | Regresiones focalizadas            | Verde     | `bun test`: 40 pruebas verdes, incluidas 10 de procesos CLI/build helper.                 |
| 2026-08-13 | MHB-02 | Smoke de códigos y errores         | Verde     | Node confirmó propagación de código 7 y rechazo accionable ante `ENOENT`.                 |
| 2026-08-13 | MHB-02 | Lint, typecheck y formato          | Verde     | ESLint, TypeScript, HTMLHint, Markdownlint, JSON, Stylelint y Prettier locales.           |
| 2026-08-13 | MHB-02 | Build manual vía CLI               | Verde     | Usuario confirmó build exitoso desde el menú del CLI.                                     |
| 2026-08-13 | MHB-02 | Smoke focalizado tras fallo CI     | Verde     | Node verificó códigos, argumentos y ejecución sin shell con `spawn` inyectado.            |
| 2026-08-13 | MHB-02 | Bun suite tras ajuste CI           | Verde     | Usuario confirmó `bun run test` local en Bun 1.3.13.                                      |
| 2026-08-13 | MHB-03 | Tag, línea base y artefactos       | Verde     | Tag, relación de ancestro, CI, lockfile, `dist` y capturas comprobados localmente.        |
| 2026-08-13 | MHB-03 | Markdown, formato y diff           | Verde     | `lint:md`, `format:check` y `git diff --check` sin errores.                               |
| 2026-08-13 | MHB-03 | Release remota                     | Verde     | `v1.1.0` publicada, sin assets, no draft/prerelease; el tag apunta a `0d52a094`.          |
| 2026-08-13 | MHB-03 | Guard de rama                      | Verde     | Preflight, hook vía `sh` y 3 regresiones Bun verifican `feature/mhb-03`.                  |
| 2026-08-14 | MHB-04 | Rama y dependencias                | Verde     | `feature/mhb-04`, guard de tarea y dependencias MHB-01/MHB-02/MHB-03 confirmadas.         |
| 2026-08-14 | MHB-04 | Matriz y sintaxis CI               | Verde     | Test declarativo 4/4, YAML válido y `git diff --check` sin errores.                       |
| 2026-08-14 | MHB-04 | Formato, tipos y pruebas           | Verde     | `format:check`, `lint:js`, `lint:json`, `typecheck` y 47 pruebas verdes.                  |
| 2026-08-14 | MHB-04 | Lint/build completo                | Verde     | HTMLHint sin errores; build exitoso con 3 warnings `href="#"` conocidos y no bloqueantes. |
| 2026-08-14 | MHB-04 | Validación remota                  | Verde     | CI `31814207687`: acciones Node 24, detect, formato, lints y verify verdes.               |
| 2026-08-17 | MHB-05 | Rama y dependencias                | Verde     | `feature/mhb-05`, guard de tarea y dependencias MHB-01/MHB-02/MHB-04 confirmadas.         |
| 2026-08-17 | MHB-05 | Regresiones de nombres y rutas     | Verde     | 51 casos en `path-safety.test.js`: guard, `isPathInside`, entrypoints y alias Bun.        |
| 2026-08-17 | MHB-05 | Restauración build selectivo       | Verde     | 2 casos en `build-selective.test.js`: config y backup limpios tras ambos fallos.          |
| 2026-08-17 | MHB-05 | Lint, typecheck y tests            | Verde     | `lint`, `typecheck`, `test` y `build` locales verdes; 81 pruebas verdes.                  |
| 2026-08-17 | MHB-05 | Formato global del repositorio     | Verde     | `bun run format:check` pasa en todo el repositorio tras formatear `code-workspace`.       |
| 2026-08-17 | MHB-05 | Ampliación lint-staged y CI        | Verde     | `lint-staged --diff=HEAD` corre 12 globs; matriz CI detecta workspace; 0 errores.         |
| 2026-08-17 | MHB-05 | Validación email post-build        | Verde     | `validate-email` verde; 3 warnings `href="#"` conocidos y asignados a MHB-21.             |
| 2026-08-17 | MHB-22 | Licencia, enlace y metadata        | Verde     | `LICENSE` MIT, README y `package.json` coinciden con Frank Villanueva (2026).             |
| 2026-08-17 | MHB-22 | Gate completo de Fase A            | Verde     | Instalación congelada, lint, typecheck, 81 pruebas, build, validación email y formato.    |
| 2026-09-03 | MHB-22 | Revisión del orquestador           | Verde     | Titular/año sustentados por historial Git y metadata; PR #13 mergeado en `92f0c96`.       |
| 2026-09-03 | MHB-22 | Cierre de Fase A y decisión v1.1.1 | Verde     | MHB-01/MHB-02/MHB-03/MHB-04/MHB-22 `Completada`; `v1.1.1` no se publica sin autorización. |

## Ejecuciones delegadas

| Ámbito | Modelo/esfuerzo reales | Estado     | Propiedad                                             | Handoff                                                           |
| ------ | ---------------------- | ---------- | ----------------------------------------------------- | ----------------------------------------------------------------- |
| MHB-01 | gpt-5.6-terra / alto   | Completada | Guard, generador, exportador, build selectivo y tests | Usuario validó manualmente el resultado.                          |
| MHB-02 | GPT-5.6 Luna / alto    | Completada | Procesos CLI/build y regresiones Bun                  | Cierre formal 2026-08-13 por el revisor.                          |
| MHB-03 | GPT-5.6 Terra / medio  | Completada | Documentación de release y matriz de reconciliación   | Cierre formal 2026-08-13 por el orquestador.                      |
| MHB-04 | GPT-5.6 Luna / medio   | Completada | CI por rutas, formato, verify y Node 24               | Cierre formal 2026-08-14 por el orquestador.                      |
| MHB-05 | Kimi K2.7 Code / alto  | Completada | Tests de seguridad de comandos y filesystem           | Cierre asumido tras MR/PR mergeado por autorización del usuario.  |
| MHB-22 | Codex / bajo           | Completada | LICENSE, README, metadata y evidencia de Fase A       | Cierre formal 2026-09-03 por el orquestador tras PR #13 mergeado. |

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
- Decisión de release: `v1.1.1` no se publica automáticamente. Los cambios
  de MHB-22 son documentación/metadata sin impacto en runtime, build,
  compatibilidad ni uso de ESP, por lo que no justifican un tag ni release
  nuevos. Cualquier publicación queda sujeta a autorización explícita del
  orquestador y al contrato de MHB-03/MHB-15.
- Riesgo residual: el shell local usado para validaciones puede seguir en Node
  20.20.2; `.nvmrc` y CI exigen/verifican Node 24. No se modificaron tags,
  versión ni publicación.
- Próxima acción inmediata: diseñar el contrato operativo de MHB-06 sobre la
  rama `feature/mhb-06` recién creada, sin tocar código hasta acordar el
  diseño con el orquestador.
- Siguiente tarea del roadmap: MHB-06, desbloqueado por el cierre de Fase A;
  rama `feature/mhb-06` creada y marcada `En progreso`.
