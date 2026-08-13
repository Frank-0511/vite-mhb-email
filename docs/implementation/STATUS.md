# Estado de implementación — EmailForge Toolkit

## Resumen

- ID activo: ninguno
- Estado: `Completada` (MHB-02)
- Implementador: GPT-5.6 Luna (perfil seguridad/CLI)
- Revisor o autoridad de cierre: usuario (revisión manual independiente)
- Última actualización: 2026-08-13
- Contrato estable: `docs/implementation/PLAN.md`

Este archivo no replica el roadmap. Al iniciar una tarea, registrar solo el ID
asignado, sus validaciones y el handoff. El implementador solo puede entregarlo
en `En revisión`; otra autoridad decide `Completada`.

## Últimas entregas

- MHB-02 completado: procesos CLI/build sin shell, propagación de errores y
  regresiones Bun para argumentos, códigos y señales.
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

## Ejecuciones delegadas

| Ámbito | Modelo/esfuerzo reales | Estado     | Propiedad                                             | Handoff                                  |
| ------ | ---------------------- | ---------- | ----------------------------------------------------- | ---------------------------------------- |
| MHB-01 | gpt-5.6-terra / alto   | Completada | Guard, generador, exportador, build selectivo y tests | Usuario validó manualmente el resultado. |
| MHB-02 | GPT-5.6 Luna / alto    | Completada | Procesos CLI/build y regresiones Bun                  | Usuario validó suite, build y cierre.    |

## Revisión de cierre

- Criterios de aceptación comprobados: sin `shell` en rutas CLI/build helper,
  argumentos como array, propagación de códigos/errores/señales y regresiones Bun.
- Controles automáticos: lint, typecheck, formato y 40 pruebas verdes.
- Controles manuales: usuario confirmó build exitoso desde el CLI.
- Evidencia revisada: commit `6ba9a23` en `feature/mhb-02`.
- Decisión del revisor: `Completada` por el usuario.

## Decisiones técnicas locales

- El patrón permitido se conserva; el guard rechaza valores no string antes de construir rutas.
- Puppeteer reemplaza binarios globales para que `bun install` prepare el navegador de exportación.
- `buildIfNeeded` requiere un tick async antes de emitir en tests porque `await prompt()`
  precede al `spawn`; los tests de `run()` no necesitan ese flush.
- `execSync("maizzle build")` en build scripts quedó fuera de alcance de MHB-02.

## Desviaciones

- Los tres warnings `href="#"` existentes corresponden a MHB-21 y no bloquean MHB-02.
- La portabilidad del exportador fue ampliada por autorización explícita del usuario (MHB-01).

## Bloqueos

- Ninguno registrado.

## Handoff

- Rama y commit: `feature/mhb-02`, `6ba9a23`.
- Working tree: limpio tras el cierre de MHB-02.
- Próxima acción: seleccionar el siguiente ID cuyas dependencias estén satisfechas
  (MHB-03 o MHB-04).
