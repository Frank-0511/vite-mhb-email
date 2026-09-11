# Estado de implementación — EmailForge Toolkit

## Propósito y formato

Este es el tablero operativo, no el roadmap ni el registro de auditoría. Solo
resume el trabajo activo, su evidencia vigente, decisiones que lo condicionan y
el handoff. La evidencia cerrada está en [STATUS-HISTORY.md](STATUS-HISTORY.md),
el contrato en `PLAN.md` y el detalle reproducible en los commits y PRs.

## Resumen

- ID activo: Ninguno (MHB-25 cerrado)
- Estado: Completada (MHB-25)
- Implementador: UI/web (Tasks 1 a 5 + skeleton por categoría)
- Revisor o autoridad de cierre: Orquestador (aceptación manual)
- Rama autorizada: `feature/mhb-25`
- Última actualización: 2026-09-11
- Contrato estable: `docs/implementation/PLAN.md`

## Paquete activo

- No hay ID en progreso ni en revisión. MHB-25 quedó `Completada` el
  2026-09-11 por aceptación manual del orquestador; detalle de controles y
  evidencia por fase en [STATUS-HISTORY.md](STATUS-HISTORY.md).
- Deuda documentada al cierre: Library conserva un layout de dos columnas de
  ancho fijo sin colapso propio a 375px (fuera del alcance autorizado de
  MHB-25); no bloqueó el cierre, queda pendiente de decisión futura.
- MHB-10, MHB-11 y MHB-12 permanecen `Completada` tras la aceptación manual del
  usuario el 2026-09-09; no se reabre ninguno.

### Controles

| Control           | Resultado | Nota                                              |
| ----------------- | --------- | ------------------------------------------------- |
| Cierre MHB-25     | Verde     | Aceptación manual del orquestador el 2026-09-11.  |
| Controles previos | Verde     | Evidencia completa por fase en STATUS-HISTORY.md. |

### Riesgo y bloqueo

- Ninguno vigente. No hubo cambios de pipeline, APIs, editor ni documento del
  iframe en ninguna fase de MHB-25.

## Últimas entregas

- MHB-25: `Completada` el 2026-09-11; tokens Space Blue en Home/Preview/
  Library, skeleton de carga y skeleton por categoría atomic design;
  aceptación manual del orquestador.
- MHB-10/MHB-11/MHB-12: `Completada` el 2026-09-09; templates password reset,
  receipt y newsletter aceptados manualmente por el usuario.
- MHB-09: `Completada` el 2026-09-09; catálogo dinámico, dashboard de todos
  los templates en disco y CLI/generador, con 412 pruebas verdes.
- MHB-08: `Completada`; descarga segura de HTML final y modal accesible;
  commit `1999aac`.
- Historial de entregas MHB-01 a MHB-07, MHB-22 y MHB-24:
  [STATUS-HISTORY.md](STATUS-HISTORY.md).

## Ejecuciones delegadas relevantes

| Ámbito               | Estado     | Propiedad                                  | Handoff                                          |
| -------------------- | ---------- | ------------------------------------------ | ------------------------------------------------ |
| MHB-25               | Completada | Tokens Space Blue, skeletons de Library    | Aceptación manual del orquestador el 2026-09-11. |
| MHB-09               | Completada | Catálogo, dashboard, tests y documentación | Cierre autorizado el 2026-09-09.                 |
| MHB-10/MHB-11/MHB-12 | Completada | Templates y pruebas de catálogo/ESP        | Aceptación manual del usuario el 2026-09-09.     |

## Decisiones y desviaciones vigentes

- Los warnings `href="#"` conocidos pertenecen a MHB-21; se mantienen visibles
  y no bloquean el paquete activo.
- Las variables ESP `{{ }}` deben preservarse en el HTML final; `[[ page.* ]]`
  sigue reservado para Maizzle.
- No se publica versión, tag ni release sin autorización explícita.

## Handoff

- Próxima acción inmediata: los cambios de MHB-25 (incluida la ampliación de
  alcance del skeleton por categoría) están sin commitear en
  `feature/mhb-25`; confirmar con el orquestador si se commitea/mergea ahora.
- Criterio de cierre: cumplido; MHB-25 completo aceptado por el orquestador.
- Siguiente tarea del roadmap: no hay ID `Requerida` posterior a MHB-25 en
  `PLAN.md`; solo queda MHB-23 (`Opcional`, ampliar biblioteca de componentes),
  `bloqueado` hasta asignación explícita del orquestador.
