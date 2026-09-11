# Estado de implementación — EmailForge Toolkit

## Propósito y formato

Este es el tablero operativo, no el roadmap ni el registro de auditoría. Solo
resume el trabajo activo, su evidencia vigente, decisiones que lo condicionan y
el handoff. La evidencia cerrada está en [STATUS-HISTORY.md](STATUS-HISTORY.md),
el contrato en `PLAN.md` y el detalle reproducible en los commits y PRs.

## Resumen

- ID activo: MHB-26
- Estado: En revisión
- Implementador: perfil habilitador técnico (medio)
- Revisor o autoridad de cierre: revisor técnico independiente
- Rama autorizada: `feature/mhb-26`
- Última actualización: 2026-09-11
- Contrato estable: `docs/implementation/PLAN.md`

## Paquete activo

- MHB-26 — Validación automatizada de accesibilidad y contraste: agrega
  `scripts/build/validate-contrast.js` (WCAG por tokens, sin navegador) y
  `scripts/build/a11y-check.js` (axe-core sobre el Puppeteer ya existente,
  vía un servidor Vite efímero), para no depender de revisión manual en el
  Browser pane.
- Ambos quedan como scripts dedicados (`bun run lint:contrast`,
  `bun run a11y-check`), fuera de la cadena de `bun run lint`/`bun run build`
  — igual que `validate-email` hoy — para no romper el pipeline con
  hallazgos ya existentes que este ID no corrige.
- Hallazgos reales detectados (documentados, no corregidos en este ID):
  `lint:contrast` — `action-primary` (texto sobre `accent-strong`) da
  2.90:1 en modo claro, bajo el mínimo AA de 3:1. `a11y-check` — 3 tipos de
  violación axe-core: `color-contrast` (Home dark, Library ambos temas),
  `scrollable-region-focusable` (Library y Preview) y `aria-required-parent`
  (tabs de Preview, ambos temas).
- CI: `contrast-check` y `a11y-check` agregados a `.github/workflows/ci.yml`
  con `continue-on-error: true` (decisión del orquestador) — visibles en
  logs, no bloquean el pipeline hasta que un ID posterior resuelva los
  hallazgos.
- Superficies tocadas: `scripts/build/validate-contrast.js` (+ test),
  `scripts/build/a11y-check.js`, `package.json` (scripts + `axe-core`
  devDependency), `.github/workflows/ci.yml`, `docs/ai/AGENTS.md` (nota de
  preferencia texto/markdown), `docs/implementation/`. Sin cambios en
  `design-tokens.css`, `DESIGN.md` ni componentes de `src/web/**`.

### Controles

| Control                    | Resultado | Nota                                                                    |
| -------------------------- | --------- | ----------------------------------------------------------------------- |
| `bun run lint:contrast`    | Rojo      | 1 error real (`action-primary` 2.90:1); fuera de alcance corregirlo.    |
| `bun run a11y-check`       | Rojo      | 9 violaciones reales (3 reglas axe-core); fuera de alcance corregirlas. |
| `bun run lint`             | Verde     | html/js/md/json/css sin errores (no incluye `lint:contrast`).           |
| `bun run typecheck`        | Verde     | Sin salida de `tsc --noEmit`.                                           |
| `bun run test`             | Verde     | 440 pruebas (428 previas + 12 nuevas), 0 fallos.                        |
| `bun run format:check`     | Verde     | Todos los archivos con estilo Prettier.                                 |
| `bun run agents:check`     | Verde     | 7 targets declarados, sin conflictos.                                   |
| Controles previos (MHB-21) | Verde     | Evidencia completa en STATUS-HISTORY.md.                                |

### Riesgo y bloqueo

- Ninguno vigente. Sin cambios de pipeline de email, APIs Vite, editor ni
  documento del iframe. El rojo en `lint:contrast`/`a11y-check` es esperado
  y documentado: son las herramientas detectando deuda preexistente, no una
  regresión introducida por MHB-26.

## Últimas entregas

- MHB-26: `En revisión` el 2026-09-11; validador de contraste WCAG y checker
  de accesibilidad (axe-core + Puppeteer) agregados como scripts dedicados;
  ambos detectan deuda real (contraste de `action-primary`, 3 violaciones
  a11y del dashboard) documentada y no corregida en este ID; CI informativo.
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

| Ámbito               | Estado      | Propiedad                                  | Handoff                                          |
| -------------------- | ----------- | ------------------------------------------ | ------------------------------------------------ |
| MHB-26               | En revisión | Validadores de contraste y accesibilidad   | Pendiente de revisor técnico independiente.      |
| MHB-21               | Completada  | `logoUrl` en welcome, links de producto    | Aceptación manual del orquestador el 2026-09-11. |
| MHB-25               | Completada  | Tokens Space Blue, skeletons de Library    | Aceptación manual del orquestador el 2026-09-11. |
| MHB-09               | Completada  | Catálogo, dashboard, tests y documentación | Cierre autorizado el 2026-09-09.                 |
| MHB-10/MHB-11/MHB-12 | Completada  | Templates y pruebas de catálogo/ESP        | Aceptación manual del usuario el 2026-09-09.     |

## Decisiones y desviaciones vigentes

- Excepción de fixture (MHB-21): `example` y `user-created` no son
  templates de producto y conservan `href="#"`; no requieren corrección para
  cerrar MHB-21.
- MHB-26 no corrige hallazgos de contraste/accesibilidad que sus propios
  validadores reporten; solo entrega la herramienta. Cualquier corrección de
  `design-tokens.css`/`DESIGN.md`/`src/web/**` queda para un ID posterior a
  decisión del orquestador.
- `contrast-check` y `a11y-check` corren en CI con `continue-on-error: true`
  hasta que ese ID de corrección exista; no se interpretan como aceptación
  de los hallazgos, solo como visibilidad sin bloqueo.
- Las variables ESP `{{ }}` deben preservarse en el HTML final; `[[ page.* ]]`
  sigue reservado para Maizzle.
- No se publica versión, tag ni release sin autorización explícita.

## Handoff

- Próxima acción inmediata: MHB-26 está `En revisión` en `feature/mhb-26`,
  sin commitear; falta revisión técnica independiente y decidir
  commit/PR/merge, y si se abre un ID de seguimiento para corregir los
  hallazgos de contraste/accesibilidad ya detectados.
- Criterio de cierre: pendiente de confirmación del revisor técnico
  independiente (diff, controles y ausencia de desviaciones); el rojo de
  `lint:contrast`/`a11y-check` es esperado y no bloquea el cierre, según el
  contrato del ID.
- Siguiente tarea del roadmap: no hay otro ID `Requerida` pendiente en
  `PLAN.md` tras MHB-21/MHB-25/MHB-26; solo queda MHB-23 (`Opcional`, ampliar
  biblioteca de componentes), `bloqueado` hasta asignación explícita del
  orquestador. Además, los hallazgos de contraste/accesibilidad de MHB-26
  quedan disponibles para un ID de corrección futuro, a decisión del
  orquestador.
