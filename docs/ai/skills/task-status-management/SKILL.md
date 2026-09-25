---
name: task-status-management
description: Actualizar docs/implementation/STATUS.md de EmailForge Toolkit durante una tarea autorizada. Usar al iniciar, entregar a revisión, registrar validaciones, bloqueos, desviaciones o handoff; no usar para cambiar el plan ni cerrar una tarea sin revisor.
---

# Estado e handoff

## Estructura operativa estable

- `STATUS.md` es un tablero operativo: mantenerlo normalmente por debajo de
  160 líneas. Debe contener, en este orden, propósito/formato, resumen,
  paquete activo, controles, riesgo/bloqueo, últimas entregas, ejecuciones
  relevantes, decisiones vigentes y handoff.
- Conservar como máximo cinco hechos por entrega activa y una línea por entrega
  cerrada reciente. Usar tablas para controles cuando reduzcan repetición.
- Mover revisiones largas, logs, tablas antiguas de validación y decisiones
  cerradas a `docs/implementation/STATUS-HISTORY.md`. Ese archivo es un índice
  de trazabilidad, no una copia del roadmap: resumir con ID, fecha, evidencia y
  enlace a commit/PR cuando exista.
- Si `STATUS.md` se acerca al límite, compactar antes de añadir una nueva
  entrega. Nunca eliminar un hecho vigente, una decisión aplicable, una
  evidencia de cierre o un bloqueo sin trasladarlo al historial o a su fuente
  canónica.

- Mantener `STATUS.md` breve: fase/ID, estado, implementador, revisor,
  validaciones, bloqueos, desviaciones y siguiente acción. No copiar logs,
  prompts, conversaciones, diffs extensos ni contenido del plan.
- Usar solo `Pendiente`, `En progreso`, `Bloqueada`, `En revisión`,
  `Completada`, `Descartada` u `Opcional`.
- Al comenzar, confirmar que ID y dependencias coinciden con el contrato y
  cambiar solo ese ID a `En progreso`.
- Al entregar, marcar `En revisión`, resumir hasta cinco hechos, registrar cada
  control como Verde/Fallido/No ejecutado y bloquear tareas dependientes cuando
  falte evidencia.
- No registrar `Completada`: esa decisión pertenece al revisor indicado.
- Registrar decisiones técnicas locales, no cambios de producto, IDs o
  aceptación; esos requieren actualizar el contrato de implementación.
- Toda exclusión de ESLint (`ignores`), directiva `eslint-disable`,
  `@ts-ignore`/`@ts-expect-error`, exclusión de `tsconfig*.json` o test
  `skip`/`todo` es una desviación obligatoria: debe registrarse explícitamente
  en `## Decisiones y desviaciones vigentes` con su justificación técnica; en
  caso contrario, la tarea queda bloqueada.
- Cada criterio de aceptación de un ID nuevo o ajustado debe asociarse a un
  comando o test que falle si no se cumple; lo no automatizable se declara
  explícitamente como revisión manual con su procedimiento de verificación.
- Al cerrar una tarea, agregar también una línea resumida de esa entrega en
  `## Últimas entregas`, conservando el formato y orden cronológico inverso de
  las líneas existentes. La sección detallada de la tarea no sustituye ese
  resumen.
- En `## Handoff`, separar siempre:
  - `Próxima acción inmediata`: revisión, merge, evidencia pendiente o bloqueo.
  - `Siguiente tarea del roadmap`: el primer ID posterior del `PLAN.md` cuyas
    dependencias estén satisfechas. Marcarlo como `desbloqueado` o
    `bloqueado`; no iniciarlo ni marcarlo `En progreso` sin asignación explícita.
- Antes de guardar el estado, comprobar que el ID cerrado aparece en
  `Últimas entregas`, `Ejecuciones delegadas`, su revisión de cierre y el
  handoff, y que el siguiente ID coincide con el orden/dependencias de
  `PLAN.md`. Si no puede determinarse, registrar la razón explícitamente.

Toda validación fallida o no ejecutada mantiene el ID bloqueado o en revisión y
debe indicar la acción segura siguiente.
