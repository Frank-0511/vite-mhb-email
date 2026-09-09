# Estado de implementación — EmailForge Toolkit

## Propósito y formato

Este es el tablero operativo, no el roadmap ni el registro de auditoría. Solo
resume el trabajo activo, su evidencia vigente, decisiones que lo condicionan y
el handoff. La evidencia cerrada está en [STATUS-HISTORY.md](STATUS-HISTORY.md),
el contrato en `PLAN.md` y el detalle reproducible en los commits y PRs.

## Resumen

| Campo                         | Valor                           |
| ----------------------------- | ------------------------------- |
| ID activo                     | MHB-10, MHB-11 y MHB-12         |
| Estado                        | En revisión                     |
| Implementador                 | Implementador actual            |
| Revisor o autoridad de cierre | Revisor de email/compatibilidad |
| Rama autorizada               | `feature/mhb-10`                |
| Última actualización          | 2026-09-09                      |
| Contrato estable              | `docs/implementation/PLAN.md`   |

## Paquete activo — MHB-10, MHB-11 y MHB-12

- Alcance: promover `password-reset`, `receipt` y `newsletter` de arquetipos a
  templates de producto compilables, con fixtures y pruebas de aceptación.
- Desviación autorizada: los tres IDs comparten `feature/mhb-10`, pero cada uno
  permanece `En revisión` hasta su aceptación independiente.
- Entregado: cada template tiene `index.html` y `data.json`, aparece en el
  dashboard y declara `logoUrl` para no heredar el enlace `#` del layout.
- Cobertura entregada: catálogo, tarjetas, tamaños y variables ESP críticas
  `reset_url`, `total_amount` y `unsubscribe_url`.

### Controles

| Control                       | Resultado    | Nota                                                       |
| ----------------------------- | ------------ | ---------------------------------------------------------- |
| `bun run check:task-branch`   | Verde        | Rama `feature/mhb-10`.                                     |
| Suite                         | Verde        | 415 pruebas.                                               |
| Typecheck, formato y lint     | Verde        | Ejecutados durante la entrega.                             |
| Build y `validate-email`      | Verde        | Cada HTML queda bajo 21 KB.                                |
| Warnings/INFO                 | Visible      | Tres warnings y un INFO pertenecen a templates anteriores. |
| Revisión visual desktop/móvil | No ejecutado | Requisito pendiente del revisor.                           |

### Riesgo y bloqueo

- No hay bloqueo técnico automático.
- La falta de aceptación visual y revisión independiente impide marcar los tres
  IDs como `Completada`.

## Últimas entregas

- MHB-10/MHB-11/MHB-12: `En revisión`; templates password reset, receipt y
  newsletter promovidos a producto; falta aceptación visual independiente.
- MHB-09: `Completada` el 2026-09-09; catálogo dinámico, dashboard de todos
  los templates en disco y CLI/generador, con 412 pruebas verdes.
- MHB-08: `Completada`; descarga segura de HTML final y modal accesible;
  commit `1999aac`.
- MHB-07: `Completada`; diagnóstico seguro de render, integrado en `master`
  (`708d8d7`).
- Historial de entregas MHB-01 a MHB-06, MHB-22 y MHB-24:
  [STATUS-HISTORY.md](STATUS-HISTORY.md).

## Ejecuciones delegadas relevantes

| Ámbito               | Estado      | Propiedad                                  | Handoff                                    |
| -------------------- | ----------- | ------------------------------------------ | ------------------------------------------ |
| MHB-09               | Completada  | Catálogo, dashboard, tests y documentación | Cierre autorizado el 2026-09-09.           |
| MHB-10/MHB-11/MHB-12 | En revisión | Templates y pruebas de catálogo/ESP        | Pendiente aceptación visual independiente. |

## Decisiones y desviaciones vigentes

- Los warnings `href="#"` conocidos pertenecen a MHB-21; se mantienen visibles
  y no bloquean el paquete activo.
- Las variables ESP `{{ }}` deben preservarse en el HTML final; `[[ page.* ]]`
  sigue reservado para Maizzle.
- No se publica versión, tag ni release sin autorización explícita.

## Handoff

- Próxima acción inmediata: el revisor de email/compatibilidad debe revisar el
  diff y aceptar visualmente los tres templates en desktop y móvil.
- Criterio de cierre: documentar esa aceptación y la revisión independiente;
  solo entonces otra autoridad puede cambiar cada ID a `Completada`.
- Siguiente tarea del roadmap: MHB-13, `bloqueada` hasta completar MHB-19 y
  MHB-20 según `PLAN.md`.
