# Estado de implementación — EmailForge Toolkit

## Propósito y formato

Este es el tablero operativo, no el roadmap ni el registro de auditoría. Solo
resume el trabajo activo, su evidencia vigente, decisiones que lo condicionan y
el handoff. La evidencia cerrada está en [STATUS-HISTORY.md](STATUS-HISTORY.md),
el contrato en `PLAN.md` y el detalle reproducible en los commits y PRs.

## Resumen

- ID activo: MHB-21
- Estado: Completada
- Implementador: perfil email/producto (medio)
- Revisor o autoridad de cierre: aceptación manual del orquestador
- Rama autorizada: `feature/mhb-21`
- Última actualización: 2026-09-11
- Contrato estable: `docs/implementation/PLAN.md`

## Paquete activo

- MHB-21 — Resolver links placeholder: los cuatro templates de producto
  (welcome, password-reset, receipt, newsletter) ya no generan warnings
  `link-targets` de `href="#"`.
- Causa raíz: `src/emails/layouts/main.html` usa
  `href="[[ page.logoUrl || '#' ]]"`; welcome no declaraba `logoUrl` en su
  front matter (los otros tres ya lo hacían). Se agregó
  `logoUrl: "https://example.com"` a `welcome/index.html`, igual que en los
  demás templates de producto.
- Excepción documentada (fuera de catálogo de producto, MHB-09): `example` y
  `user-created` son fixtures internos de desarrollo/prueba, no forman parte
  de los cuatro casos de producto y conservan `href="#"` sin bloquear el
  cierre.
- Superficies tocadas: `src/emails/templates/welcome/index.html` y
  `dist/welcome.html` (rebuild). Sin cambios de pipeline, validador ni
  catálogo.

### Controles

| Control                    | Resultado | Nota                                                                        |
| -------------------------- | --------- | --------------------------------------------------------------------------- |
| `bun run build`            | Verde     | 6 archivos, 0 errores, 2 warnings (example/user-created, fuera de alcance). |
| `bun run validate-email`   | Verde     | welcome/password-reset/receipt/newsletter sin warnings de `link-targets`.   |
| `bun run lint`             | Verde     | html/js/md/json/css sin errores.                                            |
| `bun run typecheck`        | Verde     | Sin salida de `tsc --noEmit`.                                               |
| `bun run test`             | Verde     | 428 pruebas, 0 fallos.                                                      |
| `bun run format:check`     | Verde     | Todos los archivos con estilo Prettier.                                     |
| Controles previos (MHB-25) | Verde     | Evidencia completa por fase en STATUS-HISTORY.md.                           |

### Riesgo y bloqueo

- Ninguno vigente. Sin cambios de pipeline, APIs, editor ni documento del
  iframe. No se usaron URLs de marca, legal ni producción (se mantuvo
  `https://example.com`, mismo patrón que password-reset/receipt/newsletter).

## Últimas entregas

- MHB-21: `Completada` el 2026-09-11; `logoUrl` agregado a `welcome` elimina
  el warning `href="#"` de los cuatro templates de producto; example/
  user-created quedan como excepción documentada de fixture; aceptación
  manual del orquestador.
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
| MHB-21               | Completada | `logoUrl` en welcome, links de producto    | Aceptación manual del orquestador el 2026-09-11. |
| MHB-25               | Completada | Tokens Space Blue, skeletons de Library    | Aceptación manual del orquestador el 2026-09-11. |
| MHB-09               | Completada | Catálogo, dashboard, tests y documentación | Cierre autorizado el 2026-09-09.                 |
| MHB-10/MHB-11/MHB-12 | Completada | Templates y pruebas de catálogo/ESP        | Aceptación manual del usuario el 2026-09-09.     |

## Decisiones y desviaciones vigentes

- Excepción de fixture (MHB-21): `example` y `user-created` no son
  templates de producto y conservan `href="#"`; no requieren corrección para
  cerrar MHB-21.
- Las variables ESP `{{ }}` deben preservarse en el HTML final; `[[ page.* ]]`
  sigue reservado para Maizzle.
- No se publica versión, tag ni release sin autorización explícita.

## Handoff

- Próxima acción inmediata: MHB-21 está `Completada` en `feature/mhb-21`,
  sin commitear; decidir commit/PR/merge.
- Criterio de cierre: cumplido por aceptación manual del orquestador (diff,
  controles verdes y ausencia de desviaciones).
- Siguiente tarea del roadmap: no hay otro ID `Requerida` pendiente en
  `PLAN.md` tras MHB-21/MHB-25; solo queda MHB-23 (`Opcional`, ampliar
  biblioteca de componentes), `bloqueado` hasta asignación explícita del
  orquestador.
