# Historial de estado — EmailForge Toolkit

Este archivo conserva el contexto de entregas cerradas que no debe recargarse
en el tablero operativo. Para el estado vigente, consultar [STATUS.md](STATUS.md).
El contrato sigue siendo `PLAN.md`; commits, PRs y CI son la evidencia primaria.

## Índice de cierres

| ID                   | Estado     | Fecha      | Evidencia resumida                                                                                                                      |
| -------------------- | ---------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| MHB-01               | Completada | 2026-08-10 | Guard de rutas, aliases Bun y exportación PNG portable.                                                                                 |
| MHB-02               | Completada | 2026-08-13 | Procesos CLI/build sin shell; commit `6ba9a23`.                                                                                         |
| MHB-03               | Completada | 2026-08-13 | Línea base/release `v1.1.0`; tag `0d52a094`.                                                                                            |
| MHB-04               | Completada | 2026-08-14 | CI por rutas, formato y Node 24; CI remoto `31814207687`.                                                                               |
| MHB-05               | Completada | 2026-08-17 | Regresiones de seguridad y restauración de build; commit `b4e6216`.                                                                     |
| MHB-06               | Completada | 2026-09-04 | Variables ESP en preview/build; conciliación y merge autorizados.                                                                       |
| MHB-07               | Completada | 2026-09-05 | Diagnóstico de render; integrado en `708d8d7`.                                                                                          |
| MHB-08               | Completada | 2026-09-06 | Descarga HTML segura; commit `1999aac`.                                                                                                 |
| MHB-09               | Completada | 2026-09-09 | Catálogo dinámico y CLI/generador; 412 pruebas verdes.                                                                                  |
| MHB-10/MHB-11/MHB-12 | Completada | 2026-09-09 | Templates de producto; controles previos verdes y aceptación manual del usuario.                                                        |
| MHB-22               | Completada | 2026-09-03 | LICENSE/README/metadata; PR #13 mergeado en `92f0c96`.                                                                                  |
| MHB-24               | Completada | 2026-09-05 | Modularización de components API, validación, HMR y modal.                                                                              |
| MHB-25               | Completada | 2026-09-11 | Tokens Space Blue en Home/Preview/Library, skeleton de carga y skeleton por categoría atomic design; aceptación manual del orquestador. |

## Decisiones históricas que siguen aplicando

- La compatibilidad SendGrid Legacy con placeholders `-variable-` se conserva:
  preview/envío local sustituye solo si `data.json` aporta valor; el build final
  preserva los placeholders.
- Puppeteer reemplaza binarios globales para que `bun install` prepare la
  exportación PNG.
- Node 24 es el mínimo local y de CI; la política de Bun está alineada a
  `>=1.3.13`.
- Los controles previos a un cierre no autorizan un merge, tag, versión ni
  release. `v1.1.1` sigue sin publicación autorizada.
- El validador conserva que ERROR bloquea; WARNING e INFO quedan visibles.

## Validaciones históricas representativas

| ID     | Controles registrados                                                                                                                    | Límite o nota                                                                                                      |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| MHB-02 | Lint, typecheck, formato y 40 pruebas                                                                                                    | Build/suite manual confirmados en Bun 1.3.13.                                                                      |
| MHB-04 | Matriz CI, formato, lint, typecheck y build                                                                                              | CI remoto verde en Node 24.                                                                                        |
| MHB-05 | 81 pruebas, build y `validate-email`                                                                                                     | Warnings de links asignados a MHB-21.                                                                              |
| MHB-06 | 106 pruebas, lint, typecheck, build y validador                                                                                          | `company` permanece INFO legítimo.                                                                                 |
| MHB-08 | 386 pruebas, build y validador                                                                                                           | Smoke de descarga y Blob URL verificados.                                                                          |
| MHB-09 | 412 pruebas, lint, typecheck, build y validador                                                                                          | Corrección de `INTERNAL_FIXTURES` incluida.                                                                        |
| MHB-24 | 241 pruebas, lint, typecheck, build y validador                                                                                          | Conservó contratos públicos.                                                                                       |
| MHB-25 | Lint (js/css/html/md), typecheck, format:check y pruebas focalizadas por fase (Home, Preview, Library, skeleton, skeleton por categoría) | Layout de Library sin colapso propio a 375px queda como deuda documentada, fuera de alcance; no bloqueó el cierre. |

## Recuperación de detalle

- Para una decisión, revisión o validación concreta, consultar primero el
  commit/PR indicado arriba y `git log -- docs/implementation/STATUS.md`.
- No reabrir una tarea cerrada solo para reponer narrativa histórica en
  `STATUS.md`; añadir evidencia nueva al historial cuando cambie su relevancia.
