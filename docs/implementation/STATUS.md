# Estado de implementación — EmailForge Toolkit

## Propósito y formato

Este es el tablero operativo, no el roadmap ni el registro de auditoría. Solo
resume el trabajo activo, su evidencia vigente, decisiones que lo condicionan y
el handoff. La evidencia cerrada está en [STATUS-HISTORY.md](STATUS-HISTORY.md),
el contrato en `PLAN.md` y el detalle reproducible en los commits y PRs.

## Resumen

- ID activo: MHB-19
- Estado: `En revisión` — implementación entregada, pendiente revisor técnico
- Rama autorizada: `feature/mhb-19`
- Última actualización: 2026-09-18
- Contrato estable: `docs/implementation/PLAN.md`

## Paquete activo

- MHB-19 (`En revisión`, Fase C): unit tests de helpers y reglas.
  - Las 13 reglas de compatibilidad conservan su par positivo/negativo y suman
    casos borde por regla (límites inclusivos, mensajes distinguibles,
    exenciones y falsos positivos que no deben dispararse).
  - Siete helpers críticos sin cobertura propia la reciben: `paths`,
    `built-templates`, `component-folders`, `env`, `esp-frontmatter`,
    `esp-data-filter` y `email-rules/context`; `handlebars.test.js` se amplía a
    `applyHandlebars` y `getTemplateData`.
  - Evidencia: [TEST-INVENTORY.md](TEST-INVENTORY.md) con el mapa
    `regla → tests` y `helper → tests`, lo preexistente y lo excluido.
  - Solo se agregan tests, fixtures aislados y documentación; ningún cambio
    productivo. Sin porcentaje global de cobertura, por exclusión del contrato.
  - Implementador: esta sesión. Revisor pendiente: revisor técnico alto,
    distinto del implementador.

| Control                  | Resultado                                          |
| ------------------------ | -------------------------------------------------- |
| `bun run test`           | Verde — 477 pruebas / 51 archivos (antes 385 / 44) |
| `bun run typecheck`      | Verde                                              |
| `bun run lint`           | Verde                                              |
| `bun run format:check`   | Verde                                              |
| `bun run build`          | Verde — 2 warnings preexistentes, no bloquean      |
| `bun run validate-email` | Verde — 0 errores, 2 warnings preexistentes        |

### Riesgo y bloqueo

- Sin bloqueo. Riesgo residual detectado y no tratado por estar fuera del
  alcance de MHB-19: `readBuiltTemplate` (`scripts/shared/built-templates.js`)
  resuelve el nombre de archivo contra `dist/` sin pasar por `path-safety.js`,
  de modo que un `../` escaparía del directorio. Requiere ID propio; no se fijó
  ese comportamiento con un test para no consolidarlo.

Detalle de cierre de MHB-17, MHB-26 (incluida la desviación de proceso de push
directo a `master`) y controles completos: [STATUS-HISTORY.md](STATUS-HISTORY.md).

## Últimas entregas

- MHB-17: `Completada` el 2026-09-18; toggle render/código en preview
  (`#view-mode-render`/`#view-mode-source`), visor de código con escape seguro
  por `textContent`, persistencia en `sessionStorage`, barra superior
  responsiva de 2 filas (1260-1700px) y 1 fila (>1700px); 385 pruebas, 0
  violaciones `a11y-check`, 26/26 pares `lint:contrast`; commit `b8346f1` en
  `feature/mhb-17`; aceptación manual del usuario.
- Fix de íconos de biblioteca (fuera de MHB-17): `Completada` el 2026-09-18;
  cada categoría (Atoms/Molecules/Organisms/Templates) usa un único ícono
  compartido por todos sus componentes (`box`/`puzzle`/`component`/`file-text`),
  distinto del ícono de su propia categoría; corrige íconos de plantilla que no
  renderizaban por faltar en el registro de `createIcons` y una colisión entre
  categorías (Molecules/Organisms compartían `dna`); 385 pruebas, lint,
  typecheck, `validate-email` y `format:check` en verde; commit `528816b` en
  `feature/mhb-17`; desviación de alcance de MHB-17 aceptada manualmente por
  el usuario en chat, sin ID de `PLAN.md` asignado.
- MHB-27: `Completada` el 2026-09-11; corrección de 6 hallazgos reales de
  accesibilidad/contraste y estabilización de `a11y-check.js`; 0 violaciones
  y 26/26 pares WCAG en verde; commit `b6c8bea` en `feature/mhb-27`.
- MHB-26: `Completada` el 2026-09-11; validador de contraste WCAG y checker
  de accesibilidad (axe-core + Puppeteer) agregados como scripts dedicados;
  ambos detectan deuda real (contraste de `action-primary`, 9 violaciones
  axe-core en 3 reglas) documentada y no corregida en este ID; CI
  informativo; commit `1176564` en `master`, revisado post-hoc por
  desviación de proceso (sin PR previo).
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

| Ámbito                | Estado     | Propiedad                                     | Handoff                                          |
| --------------------- | ---------- | --------------------------------------------- | ------------------------------------------------ |
| MHB-17                | Completada | Toggle render/código en preview               | Aceptación manual del usuario el 2026-09-18.     |
| Fix íconos biblioteca | Completada | Ícono único por categoría en Library (sin ID) | Aceptación manual del usuario el 2026-09-18.     |
| MHB-27                | Completada | Corrección de hallazgos MHB-26 y `a11y-check` | Revisión independiente completada el 2026-09-11. |
| MHB-26                | Completada | Validadores de contraste y accesibilidad      | Revisión independiente post-hoc el 2026-09-11.   |
| MHB-21                | Completada | `logoUrl` en welcome, links de producto       | Aceptación manual del orquestador el 2026-09-11. |
| MHB-25                | Completada | Tokens Space Blue, skeletons de Library       | Aceptación manual del orquestador el 2026-09-11. |
| MHB-09                | Completada | Catálogo, dashboard, tests y documentación    | Cierre autorizado el 2026-09-09.                 |
| MHB-10/MHB-11/MHB-12  | Completada | Templates y pruebas de catálogo/ESP           | Aceptación manual del usuario el 2026-09-09.     |

## Decisiones y desviaciones vigentes

- MHB-17 cerró por aceptación manual del usuario en chat, sin un revisor
  UX/API distinto que confirmara `Completada` como establece el criterio de
  cierre original; queda documentado como desviación de proceso, sin bloquear
  el cierre (mismo patrón ya usado en MHB-21/MHB-25).
- Fix de íconos de biblioteca: se ejecutó dentro de `feature/mhb-17` sin ID
  propio en `PLAN.md`, a pedido explícito del usuario en chat (desviación de
  alcance de MHB-17 aceptada directamente en vez de detenerse a asignar ID).
  El campo `icon` de `schema.json` por componente queda sin usarse en el
  renderizado de la lista de biblioteca (se preserva por si otro consumidor lo
  necesita); el ícono real que se muestra por componente es fijo por
  categoría (`itemIcon` en `groupByType`).
- Excepción de fixture (MHB-21): `example` y `user-created` no son
  templates de producto y conservan `href="#"`; no requieren corrección para
  cerrar MHB-21.
- MHB-27 corrigió los hallazgos reales que MHB-26 dejó documentados (y
  descartó 5 de los 9 reportados como falsos positivos del propio script).
  `contrast-check`/`a11y-check` siguen en CI con `continue-on-error: true`;
  ahora que ambos corren en verde, un ID futuro puede evaluar si ese
  `continue-on-error` sigue siendo necesario.
- El par `action-primary` de `lint:contrast` sigue clasificado `role: "ui"`
  (umbral 3:1); WCAG 1.4.3 exige 4.5:1 para texto normal, y axe-core sí lo
  aplica así (por eso detectó el label del viewport activo en tema oscuro
  aun con `lint:contrast` en verde). Reclasificar ese par a `role: "text"`
  afectaría otros pares de la familia `action-primary`; queda fuera de
  alcance de MHB-27, documentado para decisión futura del orquestador.
- Las variables ESP `{{ }}` deben preservarse en el HTML final; `[[ page.* ]]`
  sigue reservado para Maizzle.
- No se publica versión, tag ni release sin autorización explícita.

## Handoff

- Próxima acción inmediata: revisar MHB-19 en `feature/mhb-19` (worktree
  `.claude/worktrees/mhb-19`). Revisor técnico alto distinto del implementador;
  confirmar que los casos prueban comportamiento observable y no detalles de
  implementación antes de `Completada`.
- Siguiente tarea del roadmap: MHB-20 (`desbloqueado`, Fase C: integración
  build, render, caché y exportación); MHB-18 sigue `desbloqueado` en Fase B y
  se trabaja en otra sesión. No iniciar ninguno sin asignación explícita del
  orquestador.
