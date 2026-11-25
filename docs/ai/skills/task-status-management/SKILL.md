---
name: task-status-management
description: Actualizar docs/implementation/STATUS.md de EmailForge Toolkit durante una tarea autorizada. Usar al iniciar, entregar a revisión, registrar validaciones, bloqueos, desviaciones o handoff; no usar para cambiar el plan ni cerrar una tarea sin revisor.
---

# Estado e handoff

## Estructura operativa estable

- `STATUS.md` es un tablero operativo: mantenerlo normalmente por debajo de
  160 líneas. Debe contener, en este orden, propósito/formato, resumen,
  paquete activo, controles, riesgo/bloqueo, ejecuciones relevantes, decisiones
  vigentes y handoff.
- Conservar como máximo cinco hechos por entrega activa. Usar tablas para
  controles cuando reduzcan repetición.
- `STATUS.md` no conserva historial. Lo cerrado se resume en `CHANGELOG.md` y
  queda en Git (ID, fecha, resultado y enlace a commit/PR cuando exista). Las
  revisiones largas, logs y tablas antiguas de validación se retiran del
  tablero; su trazabilidad es `CHANGELOG.md` o Git, nunca otro archivo de estado.
- Si `STATUS.md` se acerca al límite, compactar antes de añadir una nueva
  entrega. Nunca eliminar un hecho vigente, una decisión aplicable, un
  resultado de cierre o un bloqueo sin trasladarlo a su fuente canónica:
  `CHANGELOG.md` para los cierres y Git para commits y PR.

- Mantener `STATUS.md` breve: fase/ID, estado, implementador, revisor,
  validaciones, bloqueos, desviaciones y siguiente acción. No copiar logs,
  prompts, conversaciones, diffs extensos ni la definición completa de la tarea.
- Usar solo `Pendiente`, `En progreso`, `Bloqueada`, `En revisión`,
  `Completada`, `Descartada` u `Opcional`.
- Toda tarea (ID) tiene su definición en `docs/implementation/PLAN.md`: objetivo,
  superficies autorizadas, dependencias y criterios de aceptación. `STATUS.md`
  refleja su estado; no es su fuente de definición.
- Al comenzar, confirmar que el ID y sus dependencias coinciden con su
  definición en `docs/implementation/PLAN.md` y cambiar solo ese ID a
  `En progreso`.
- Al entregar, marcar `En revisión`, resumir hasta cinco hechos, registrar cada
  control como Verde/Fallido/No ejecutado y bloquear tareas dependientes cuando
  falte un resultado de control.
- No registrar `Completada`: esa decisión pertenece al revisor indicado.
- Registrar decisiones técnicas locales, no cambios de producto, IDs o
  aceptación; esos requieren actualizar la definición del ID en
  `docs/implementation/PLAN.md` (objetivo, superficies, dependencias o criterios
  de aceptación).
- Toda exclusión de ESLint (`ignores`), directiva `eslint-disable`,
  `@ts-ignore`/`@ts-expect-error`, exclusión de `tsconfig*.json` o test
  `skip`/`todo` es una desviación obligatoria: debe registrarse explícitamente
  en `## Decisiones y desviaciones vigentes` con su justificación técnica; en
  caso contrario, la tarea queda bloqueada.
- Cada criterio de aceptación de un ID nuevo o ajustado debe asociarse a un
  comando o test que falle si no se cumple; lo no automatizable se declara
  explícitamente como revisión manual con su procedimiento de verificación.
- Al cerrar una tarea, su resumen (ID, fecha, resultado y enlace a commit/PR)
  va a `CHANGELOG.md`, no a `STATUS.md`. El tablero solo muestra el estado
  vigente; la sección detallada de la tarea tampoco se conserva como historial.
- En `## Handoff`, separar siempre:
  - `Próxima acción inmediata`: revisión, merge, control pendiente o bloqueo.
  - `Siguiente tarea del roadmap`: el primer ID posterior en
    `docs/implementation/PLAN.md` cuyas dependencias estén satisfechas. Marcarlo
    como `desbloqueado` o `bloqueado` según sus dependencias; no iniciarlo ni
    marcarlo `En progreso` sin asignación explícita del orquestador. Si no queda
    ningún ID pendiente, registrar `ninguna` y dejar la decisión al usuario.
- Antes de guardar el estado, comprobar que el ID cerrado tiene su resumen en
  `CHANGELOG.md`, que aparece en `Ejecuciones delegadas` si aplica y en el
  handoff, y que la siguiente tarea del roadmap coincide con el orden y las
  dependencias de `docs/implementation/PLAN.md`. Si no puede determinarse,
  registrar la razón explícitamente.

Toda validación fallida o no ejecutada mantiene el ID bloqueado o en revisión y
debe indicar la acción segura siguiente.
