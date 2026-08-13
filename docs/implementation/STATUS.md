# Estado de implementación — EmailForge Toolkit

## Resumen

- ID activo: MHB-03
- Estado: `Completada`
- Implementador: GPT-5.6 Terra (documentación/release, esfuerzo medio)
- Revisor o autoridad de cierre: usuario (orquestador)
- Última actualización: 2026-08-13
- Contrato estable: `docs/implementation/PLAN.md`

Este archivo no replica el roadmap. Al iniciar una tarea, registrar solo el ID
asignado, sus validaciones y el handoff. El implementador solo puede entregarlo
en `En revisión`; otra autoridad decide `Completada`.

## Últimas entregas

- MHB-02 cerrado: procesos CLI/build sin shell, propagación de errores y
  regresiones Bun; cierre confirmado por el revisor.
- MHB-03 completado: documentación de release, línea base y revisión remota de
  `v1.1.0` confirmadas por el orquestador.
- MHB-01 completado: guard, alias Bun y exportación PNG portable con Puppeteer.

## Validaciones

| Fecha      | ID     | Control                          | Resultado | Nota                                                                                 |
| ---------- | ------ | -------------------------------- | --------- | ------------------------------------------------------------------------------------ |
| 2026-08-10 | MHB-01 | Inventario de rutas              | Verde     | Tres rutas localizadas; implementación pendiente.                                    |
| 2026-08-10 | MHB-01 | Tabla y no escritura             | Verde     | 17 casos focalizados; traversal no crea ni muta rutas.                               |
| 2026-08-10 | MHB-01 | Lint, typecheck, formato y suite | Verde     | `bun run lint`, `bun run typecheck`, `bun run format:check` y 30 pruebas.            |
| 2026-08-10 | MHB-01 | CLI manual válida                | Verde     | El generador confirmó `welcome` existente sin escribir.                              |
| 2026-08-10 | MHB-01 | Alias Bun de CLI                 | Verde     | `generate:email` y `export:screenshot` reenvían argumentos y rechazan traversal.     |
| 2026-08-10 | MHB-01 | Build y compatibilidad           | Verde     | Templates compilados; 0 errores y warnings de links no bloqueantes.                  |
| 2026-08-10 | MHB-01 | Exportación PNG portable         | Verde     | Puppeteer descargado por Bun completó una exportación PNG de prueba.                 |
| 2026-08-13 | MHB-02 | Inventario de procesos           | Verde     | Los dos `spawn` con `shell: true` fueron endurecidos; no quedan en CLI/build helper. |
| 2026-08-13 | MHB-02 | Regresiones focalizadas          | Verde     | `bun test`: 40 pruebas verdes, incluidas 10 de procesos CLI/build helper.            |
| 2026-08-13 | MHB-02 | Smoke de códigos y errores       | Verde     | Node confirmó propagación de código 7 y rechazo accionable ante `ENOENT`.            |
| 2026-08-13 | MHB-02 | Lint, typecheck y formato        | Verde     | ESLint, TypeScript, HTMLHint, Markdownlint, JSON, Stylelint y Prettier locales.      |
| 2026-08-13 | MHB-02 | Build manual vía CLI             | Verde     | Usuario confirmó build exitoso desde el menú del CLI.                                |
| 2026-08-13 | MHB-02 | Smoke focalizado tras fallo CI   | Verde     | Node verificó códigos, argumentos y ejecución sin shell con `spawn` inyectado.       |
| 2026-08-13 | MHB-02 | Bun suite tras ajuste CI         | Verde     | Usuario confirmó `bun run test` local en Bun 1.3.13.                                 |
| 2026-08-13 | MHB-03 | Tag, línea base y artefactos     | Verde     | Tag, relación de ancestro, CI, lockfile, `dist` y capturas comprobados localmente.   |
| 2026-08-13 | MHB-03 | Markdown, formato y diff         | Verde     | `lint:md`, `format:check` y `git diff --check` sin errores.                          |
| 2026-08-13 | MHB-03 | Release remota                   | Verde     | `v1.1.0` publicada, sin assets, no draft/prerelease; el tag apunta a `0d52a094`.     |
| 2026-08-13 | MHB-03 | Guard de rama                    | Verde     | Preflight, hook vía `sh` y 3 regresiones Bun verifican `feature/mhb-03`.             |

## Ejecuciones delegadas

| Ámbito | Modelo/esfuerzo reales | Estado     | Propiedad                                             | Handoff                                      |
| ------ | ---------------------- | ---------- | ----------------------------------------------------- | -------------------------------------------- |
| MHB-01 | gpt-5.6-terra / alto   | Completada | Guard, generador, exportador, build selectivo y tests | Usuario validó manualmente el resultado.     |
| MHB-02 | GPT-5.6 Luna / alto    | Completada | Procesos CLI/build y regresiones Bun                  | Cierre formal 2026-08-13 por el revisor.     |
| MHB-03 | GPT-5.6 Terra / medio  | Completada | Documentación de release y matriz de reconciliación   | Cierre formal 2026-08-13 por el orquestador. |

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

## Bloqueos

- Ninguno registrado.

## Handoff

- MHB-02: `Completada`; rama `feature/mhb-02`, commit `6ba9a23`.
- MHB-03: `Completada`; matriz en `RELEASE_BASELINE.md`, CHANGELOG actualizado,
  README enlazado y guard de rama autorizado; no se movieron tags, versión ni
  notas remotas.
- Riesgo residual: ninguno en la revisión remota; no se modificaron tags,
  versión ni publicación.
- Próxima acción: ninguna para MHB-03; esperar la asignación del siguiente ID.
