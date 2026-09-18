# Estado de implementación — EmailForge Toolkit

## Propósito y formato

Este es el tablero operativo, no el roadmap ni el registro de auditoría. Solo
resume el trabajo activo, su evidencia vigente, decisiones que lo condicionan y
el handoff. La evidencia cerrada está en [STATUS-HISTORY.md](STATUS-HISTORY.md),
el contrato en `PLAN.md` y el detalle reproducible en los commits y PRs.

## Resumen

- ID activo: MHB-17
- Estado: En revisión
- Implementador: perfil UX/API (medio)
- Revisor o autoridad de cierre: revisor UX/API
- Rama autorizada: `feature/mhb-17`
- Última actualización: 2026-09-12
- Contrato estable: `docs/implementation/PLAN.md`

## Paquete activo

- MHB-17 — Alternar render y código fuente: implementado control interactivo
  en `#topbar-controls` (`#view-mode-render` y `#view-mode-source`) y visor de
  código fuente (`#preview-source-container`) en `#preview-frame`. El código HTML
  se escapa de forma segura vía `textContent` sin ejecutar scripts. La
  alternancia reutiliza el HTML en memoria sin recompilación redundante y persiste
  en `sessionStorage` (`preview-view-mode`). Barra superior responsiva compacta de
  2 filas para 1260px-1700px y 1 fila para >1700px, con selector de modo solo icono
  en anchos ≤1400px y texto completo en >1400px. En modo código HTML, el visor
  ocupa el 90% del espacio disponible y aísla las reglas de medida (600px, 375px, custom)
  y sus controles exclusivamente a la vista previa. Suite completa con 385 pruebas
  en verde (11 pruebas unitarias para MHB-17) y 0 violaciones en `a11y-check`.

### Controles

| Control                     | Resultado | Nota                                                       |
| --------------------------- | --------- | ---------------------------------------------------------- |
| `bun run lint:contrast`     | Verde     | 26/26 pares OK en temas light y dark.                      |
| `bun run a11y-check`        | Verde     | 0 violaciones en las 6 rutas/temas auditadas con axe-core. |
| `bun run lint`              | Verde     | html/js/md/json/css sin errores.                           |
| `bun run typecheck`         | Verde     | Sin salida de `tsc --noEmit`.                              |
| `bun run test`              | Verde     | 385 pruebas verdes (11 nuevas para MHB-17).                |
| `bun run format:check`      | Verde     | Estilo Prettier verificado en todos los archivos.          |
| `bun run agents:check`      | Verde     | 7 targets declarados sin conflictos.                       |
| `bun run check:task-branch` | Verde     | Rama `feature/mhb-17` verificada.                          |

### Riesgo y bloqueo

- Ninguno vigente. La alternancia no modifica contratos públicos de API ni
  pipeline de Maizzle/Handlebars. Accesible para teclado y lectores de pantalla.

Detalle de cierre de MHB-26 (incluida la desviación de proceso de push
directo a `master`): [STATUS-HISTORY.md](STATUS-HISTORY.md).

## Últimas entregas

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
| Fix íconos biblioteca | Completada | Ícono único por categoría en Library (sin ID) | Aceptación manual del usuario el 2026-09-18.     |
| MHB-27                | Completada | Corrección de hallazgos MHB-26 y `a11y-check` | Revisión independiente completada el 2026-09-11. |
| MHB-26                | Completada | Validadores de contraste y accesibilidad      | Revisión independiente post-hoc el 2026-09-11.   |
| MHB-21                | Completada | `logoUrl` en welcome, links de producto       | Aceptación manual del orquestador el 2026-09-11. |
| MHB-25                | Completada | Tokens Space Blue, skeletons de Library       | Aceptación manual del orquestador el 2026-09-11. |
| MHB-09                | Completada | Catálogo, dashboard, tests y documentación    | Cierre autorizado el 2026-09-09.                 |
| MHB-10/MHB-11/MHB-12  | Completada | Templates y pruebas de catálogo/ESP           | Aceptación manual del usuario el 2026-09-09.     |

## Decisiones y desviaciones vigentes

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

- Próxima acción inmediata: Revisión independiente de MHB-17 en `feature/mhb-17`
  (toggle en topbar de preview, distribución responsiva compacta de 2 filas en
  1260px-1700px y 1 fila en >1700px, vista pre/code escapada, persistencia en
  `sessionStorage`, suite de tests unitarios y validación a11y/contraste).
- Criterio de cierre: Aceptado por revisor UX/API independiente (toggle
  funcional render/código sin re-render redundante, sanitización por
  textContent/escape seguro, persistencia de sesión, tests automatizados verdes
  y sin regresiones en CI).
- Siguiente tarea del roadmap: MHB-18 (`desbloqueado`, Fase B: guía de
  componentes y matriz documentada); no iniciar sin asignación explícita
  del orquestador.
