# Estado de implementación — EmailForge Toolkit

## Propósito y formato

Este es el tablero operativo, no el roadmap ni el registro de auditoría. Solo
resume el trabajo activo, su evidencia vigente, decisiones que lo condicionan y
el handoff. La evidencia cerrada está en [STATUS-HISTORY.md](STATUS-HISTORY.md),
el contrato en `PLAN.md` y el detalle reproducible en los commits y PRs.

## Resumen

- ID activo: MHB-18
- Estado: En revisión
- Rama autorizada: `feature/mhb-18` (rebasada sobre `master` con MHB-19 ya
  integrada)
- Última actualización: 2026-09-18
- Contrato estable: `docs/implementation/PLAN.md`

## Paquete activo

- MHB-18 (`En revisión`): guía de componentes y matriz de compatibilidad
  documentada. Asignación explícita del orquestador (usuario) el 2026-09-18;
  dependencias MHB-10/MHB-11/MHB-12 `Completada`. Rama `feature/mhb-18`.
- Entregables: `docs/guides/COMPONENT-GUIDE.md` (estructura, `schema.json`,
  variantes, uso en templates, checklist y ejercicio), y
  `docs/guides/COMPATIBILITY-MATRIX.md` (niveles E0–E3, 13 reglas estáticas,
  matriz por cliente y protocolo para elevar a E3). `README.md` los enlaza y
  completa la tabla de reglas de 10 a 13 entradas.
- Ejercicio desde cero con el fixture descartable `atoms/note-callout` +
  template `mhb18-fixture`: descubrimiento automático, ambas variantes
  renderizadas y `dist/mhb18-fixture.html` con 0 errores/warnings/info y `{{ }}`
  intactas. Fixture y `dist` temporal eliminados; árbol sin residuos.
- Desviación de alcance aceptada por el usuario en chat: corregir los hallazgos
  en vez de documentarlos. (1) El preview traduce la cadena
  `<if>/<elseif>/<else>` a un único bloque Handlebars y soporta comparaciones,
  negación y `&&`/`||` con helpers propios en una instancia aislada. (2)
  `organisms/hero` reenvía `title`, `subtitle` y `button-text` a sus variantes.
  (3) El motor convierte `"false"`/`"true"` a booleanos, así que el idiom
  `props["x"] !== "false"` nunca era falso y `show-button="false"` no ocultaba
  el CTA: corregido en `hero/index`, `hero-v1`, `hero-v2` y en la guía, que lo
  documentaba mal. Tests hermanos nuevos; `dist/` no cambia.

### Controles

| Control                  | Resultado                                         |
| ------------------------ | ------------------------------------------------- |
| `bun run lint`           | Verde (HTML, JS, Markdown, JSON, CSS)             |
| `bun run format:check`   | Verde                                             |
| `bun run test`           | Verde — 493 pruebas, 0 fallos (478 antes del fix) |
| `bun run typecheck`      | Verde                                             |
| `bun run validate-email` | Verde — 6 archivos, 0 errores, 2 warnings, 1 info |
| `bun run build`          | Verde — `dist/` idéntico tras corregir `hero`     |

### Riesgo y bloqueo

- Sin bloqueo. La guía documenta comportamiento verificado el 2026-09-18; si
  cambia el renderer de preview o el catálogo, sus limitaciones deben revisarse
  junto al cambio.
- Riesgo residual abierto, heredado de MHB-19 y sin ID asignado:
  `readBuiltTemplate` (`scripts/shared/built-templates.js`) resuelve el nombre
  de archivo contra `dist/` sin pasar por `path-safety.js`, de modo que un
  `../` escaparía del directorio. No se fijó ese comportamiento con un test
  para no consolidarlo; requiere ID propio.

Detalle de cierre de MHB-17, MHB-26 (incluida la desviación de proceso de push
directo a `master`) y controles completos: [STATUS-HISTORY.md](STATUS-HISTORY.md).

## Últimas entregas

- MHB-19: `Completada` el 2026-09-18; cobertura unitaria de reglas y helpers
  críticos: casos borde por regla sobre los pares positivo/negativo, tests
  hermanos en `rules/<regla>.test.js`, guard que rompe la suite si una regla
  registrada queda sin par, y tests propios para siete helpers sin cobertura;
  inventario en [TEST-INVENTORY.md](TEST-INVENTORY.md); 478 pruebas / 61
  archivos (antes 385 / 44), lint, typecheck, build, `validate-email` y
  `format:check` en verde; commits `46a9800`, `fde39e6`, `1890a14` y `51e1f18`
  en `feature/mhb-19`; aceptación manual del usuario, sin merge.
- MHB-17: `Completada` el 2026-09-18; toggle render/código en preview con
  escape por `textContent`, persistencia en `sessionStorage` y barra superior
  responsiva; 385 pruebas, `a11y-check` y `lint:contrast` en verde; commit
  `b8346f1` en `feature/mhb-17`; aceptación manual del usuario.
- Fix de íconos de biblioteca (desviación aceptada dentro de MHB-17, sin ID
  propio): `Completada` el 2026-09-18; un ícono por categoría atomic design,
  commit `528816b`; detalle en [STATUS-HISTORY.md](STATUS-HISTORY.md).
- MHB-27: `Completada` el 2026-09-11; corrección de 6 hallazgos reales de
  accesibilidad/contraste y estabilización de `a11y-check.js`; 0 violaciones
  y 26/26 pares WCAG en verde; commit `b6c8bea` en `feature/mhb-27`.
- Historial de entregas anteriores (MHB-01 a MHB-12, MHB-21, MHB-22, MHB-24,
  MHB-25 y MHB-26): [STATUS-HISTORY.md](STATUS-HISTORY.md).

## Ejecuciones delegadas relevantes

| Ámbito                | Estado      | Propiedad                                      | Handoff                                           |
| --------------------- | ----------- | ---------------------------------------------- | ------------------------------------------------- |
| MHB-18                | En revisión | Guía de componentes y matriz de compatibilidad | Pendiente de revisor que siga la guía desde cero. |
| MHB-19                | Completada  | Unit tests de reglas y helpers críticos        | Aceptación manual del usuario el 2026-09-18.      |
| MHB-17                | Completada  | Toggle render/código en preview                | Aceptación manual del usuario el 2026-09-18.      |
| Fix íconos biblioteca | Completada  | Ícono único por categoría en Library (sin ID)  | Aceptación manual del usuario el 2026-09-18.      |
| MHB-27                | Completada  | Corrección de hallazgos MHB-26 y `a11y-check`  | Revisión independiente completada el 2026-09-11.  |
| MHB-26                | Completada  | Validadores de contraste y accesibilidad       | Revisión independiente post-hoc el 2026-09-11.    |
| MHB-21                | Completada  | `logoUrl` en welcome, links de producto        | Aceptación manual del orquestador el 2026-09-11.  |
| MHB-25                | Completada  | Tokens Space Blue, skeletons de Library        | Aceptación manual del orquestador el 2026-09-11.  |
| MHB-09                | Completada  | Catálogo, dashboard, tests y documentación     | Cierre autorizado el 2026-09-09.                  |
| MHB-10/MHB-11/MHB-12  | Completada  | Templates y pruebas de catálogo/ESP            | Aceptación manual del usuario el 2026-09-09.      |

## Decisiones y desviaciones vigentes

- MHB-19 cerró por aceptación manual del usuario en chat, sin el revisor
  técnico alto e independiente que pide el contrato; misma desviación de
  proceso ya documentada para MHB-17/MHB-21/MHB-25, sin bloquear el cierre.
  Desvíos de alcance aceptados dentro de ese ID: silenciar la salida esperada
  de cuatro tests (`render-api`, `cli/helpers`, `export/renderers`,
  `render-request-handler`) e ignorar `.claude/worktrees/` en `.gitignore`,
  fuera del bloque gestionado por `agents:sync`.
- MHB-18 incluye una desviación de alcance aceptada por el usuario en chat:
  corregir en la misma rama los tres hallazgos del preview y de `hero` en lugar
  de dejarlos documentados para un ID futuro. El alcance tocado son
  `component-preview-transforms.js`, `component-preview-renderer.js` y el
  componente `hero`, con tests hermanos nuevos; no cambia el contrato de la API
  de componentes, el pipeline de build ni `dist/`.
- Una condición fuera de la gramática traducible (llamadas a función, aritmética)
  se evalúa como falsa en el preview en vez de romper el render. Es una decisión
  de degradación consciente: el build sí la evalúa con normalidad.
- `README.md` conserva imprecisiones fuera del alcance de MHB-18: el árbol de
  arquitectura ubica `key-value-card` en `organisms` (está en `molecules`) y el
  catálogo marca `password-reset`, `receipt` y `newsletter` como "En roadmap"
  pese a estar `Completada`. Corresponden a la reconciliación documental de
  MHB-15.
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

- Próxima acción inmediata: revisar MHB-18 en `feature/mhb-18`. El revisor debe
  ser distinto del implementador y crear un componente siguiendo solo
  `docs/guides/COMPONENT-GUIDE.md`, sin contexto adicional del repositorio.
- Siguiente tarea del roadmap: MHB-20 (`desbloqueado`, Fase C: integración
  build, render, caché y exportación; dependencias MHB-07, MHB-10, MHB-11 y
  MHB-12 `Completada`); no iniciar sin asignación explícita del orquestador.
