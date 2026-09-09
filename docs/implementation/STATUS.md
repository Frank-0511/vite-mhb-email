# Estado de implementación — EmailForge Toolkit

## Propósito y formato

Este es el tablero operativo, no el roadmap ni el registro de auditoría. Solo
resume el trabajo activo, su evidencia vigente, decisiones que lo condicionan y
el handoff. La evidencia cerrada está en [STATUS-HISTORY.md](STATUS-HISTORY.md),
el contrato en `PLAN.md` y el detalle reproducible en los commits y PRs.

## Resumen

| Campo                         | Valor                         |
| ----------------------------- | ----------------------------- |
| ID activo                     | Ninguno                       |
| Estado                        | Sin tarea en progreso         |
| Implementador                 | No aplica                     |
| Revisor o autoridad de cierre | Usuario (aceptación manual)   |
| Rama autorizada               | `feature/mhb-10`              |
| Última actualización          | 2026-09-09                    |
| Contrato estable              | `docs/implementation/PLAN.md` |

## Paquete activo

- No hay un ID iniciado. MHB-10, MHB-11 y MHB-12 fueron aceptadas por el
  usuario el 2026-09-09 tras su validación manual.

### Controles

| Control                       | Resultado | Nota                                                      |
| ----------------------------- | --------- | --------------------------------------------------------- |
| Revisión visual desktop/móvil | Verde     | Aceptación manual del usuario el 2026-09-09.              |
| Controles previos             | Verde     | Suite (415), typecheck, formato, lint, build y validador. |

### Riesgo y bloqueo

- No hay bloqueo técnico en los IDs recién cerrados.

## Últimas entregas

- MHB-10/MHB-11/MHB-12: `Completada` el 2026-09-09; templates password reset,
  receipt y newsletter aceptados manualmente por el usuario.
- MHB-09: `Completada` el 2026-09-09; catálogo dinámico, dashboard de todos
  los templates en disco y CLI/generador, con 412 pruebas verdes.
- MHB-08: `Completada`; descarga segura de HTML final y modal accesible;
  commit `1999aac`.
- MHB-07: `Completada`; diagnóstico seguro de render, integrado en `master`
  (`708d8d7`).
- Historial de entregas MHB-01 a MHB-06, MHB-22 y MHB-24:
  [STATUS-HISTORY.md](STATUS-HISTORY.md).

## Ejecuciones delegadas relevantes

| Ámbito               | Estado     | Propiedad                                  | Handoff                                      |
| -------------------- | ---------- | ------------------------------------------ | -------------------------------------------- |
| MHB-09               | Completada | Catálogo, dashboard, tests y documentación | Cierre autorizado el 2026-09-09.             |
| MHB-10/MHB-11/MHB-12 | Completada | Templates y pruebas de catálogo/ESP        | Aceptación manual del usuario el 2026-09-09. |

## Decisiones y desviaciones vigentes

- Los warnings `href="#"` conocidos pertenecen a MHB-21; se mantienen visibles
  y no bloquean el paquete activo.
- Las variables ESP `{{ }}` deben preservarse en el HTML final; `[[ page.* ]]`
  sigue reservado para Maizzle.
- No se publica versión, tag ni release sin autorización explícita.

## Handoff

- Próxima acción inmediata: definir y autorizar un ID independiente si se va a
  iniciar el upgrade de la UI web.
- Criterio de cierre: no aplica; MHB-10, MHB-11 y MHB-12 están completadas.
- Siguiente tarea del roadmap: MHB-13, `bloqueada` hasta completar MHB-19 y
  MHB-20 según `PLAN.md`.
