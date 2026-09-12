# Estado de implementación — EmailForge Toolkit

## Propósito y formato

Este es el tablero operativo, no el roadmap ni el registro de auditoría. Solo
resume el trabajo activo, su evidencia vigente, decisiones que lo condicionan y
el handoff. La evidencia cerrada está en [STATUS-HISTORY.md](STATUS-HISTORY.md),
el contrato en `PLAN.md` y el detalle reproducible en los commits y PRs.

## Resumen

- ID activo: ninguno
- Estado: Completada
- Implementador: perfil habilitador técnico (medio)
- Revisor o autoridad de cierre: revisor técnico independiente (confirmado)
- Rama autorizada: `feature/mhb-27`
- Última actualización: 2026-09-11
- Contrato estable: `docs/implementation/PLAN.md`

## Paquete activo

- MHB-27 — Corregir hallazgos de MHB-26 y estabilizar `a11y-check`: la causa
  real de las 9 violaciones no era una carrera con el optimizador de Vite
  (hipótesis inicial descartada), sino `a11y-check.js` pasando un `root`
  explícito a `createServer()` que pisaba el `root: "src/web"` de
  `vite.config.js`, más `waitUntil: "networkidle0"` incompatible con las
  conexiones abiertas de `/preview`. Corregido eso, 5 de los 9 hallazgos
  originales resultaron falsos positivos y aparecieron 2 nuevos reales; el
  `meta-viewport` reportado en un diagnóstico intermedio tampoco era real
  (una página de error de Chrome, no la app). Quedan 6 hallazgos reales,
  corregidos: par `action-primary` (token `text-on-accent`), scroll sin
  foco en Library, tabs sin `tablist` en Preview, y 2 de contraste
  (`#sync-status` y el label del viewport activo en tema oscuro). Ver
  contrato completo y diagnóstico en `PLAN.md`.

### Controles

| Control                     | Resultado | Nota                                                          |
| --------------------------- | --------- | ------------------------------------------------------------- |
| `bun run lint:contrast`     | Verde     | 26/26 pares OK (3 corridas consecutivas).                     |
| `bun run a11y-check`        | Verde     | 0 violaciones en las 6 rutas/temas (3 corridas consecutivas). |
| `bun run lint`              | Verde     | html/js/md/json/css sin errores.                              |
| `bun run typecheck`         | Verde     | Sin salida de `tsc --noEmit`.                                 |
| `bun run test`              | Verde     | 440 pruebas, 0 fallos (sin cambios de cobertura).             |
| `bun run format:check`      | Verde     | Todos los archivos con estilo Prettier.                       |
| `bun run agents:check`      | Verde     | 7 targets declarados, sin conflictos.                         |
| `bun run check:task-branch` | Verde     | Rama `feature/mhb-27` verificada.                             |

### Riesgo y bloqueo

- Ninguno vigente. Cambios acotados a los 6 hallazgos reales diagnosticados;
  sin cambios de pipeline de email, APIs Vite ni contrato de `components.js`.
  El único cambio con impacto visual es el label del botón de viewport activo
  en tema oscuro (fondo más oscuro, texto blanco legible); el resto es
  invisible (tokens ya usados, o fixes de accesibilidad sin efecto visual).

Detalle de cierre de MHB-26 (incluida la desviación de proceso de push
directo a `master`): [STATUS-HISTORY.md](STATUS-HISTORY.md).

## Últimas entregas

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

| Ámbito               | Estado     | Propiedad                                     | Handoff                                          |
| -------------------- | ---------- | --------------------------------------------- | ------------------------------------------------ |
| MHB-27               | Completada | Corrección de hallazgos MHB-26 y `a11y-check` | Revisión independiente completada el 2026-09-11. |
| MHB-26               | Completada | Validadores de contraste y accesibilidad      | Revisión independiente post-hoc el 2026-09-11.   |
| MHB-21               | Completada | `logoUrl` en welcome, links de producto       | Aceptación manual del orquestador el 2026-09-11. |
| MHB-25               | Completada | Tokens Space Blue, skeletons de Library       | Aceptación manual del orquestador el 2026-09-11. |
| MHB-09               | Completada | Catálogo, dashboard, tests y documentación    | Cierre autorizado el 2026-09-09.                 |
| MHB-10/MHB-11/MHB-12 | Completada | Templates y pruebas de catálogo/ESP           | Aceptación manual del usuario el 2026-09-09.     |

## Decisiones y desviaciones vigentes

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

- Próxima acción inmediata: Crear Pull Request desde `feature/mhb-27` hacia
  `master`, validar CI y mergear.
- Criterio de cierre: Aceptado por revisor independiente (0 violaciones
  axe-core en 6 rutas/temas, 26/26 pares de contraste OK, suite y diff
  limpio sin cambios de API ni pipeline).
- Siguiente tarea del roadmap: MHB-17 (`desbloqueado`, Fase B: alternar vista
  renderizada y código fuente escapado en preview); no iniciar sin
  asignación explícita del orquestador.
