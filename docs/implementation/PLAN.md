# Plan de implementación — EmailForge Toolkit

Este documento contiene únicamente el trabajo pendiente. El baseline funcional
publicado es `v1.2.0`; los artefactos de Git conservan la trazabilidad previa.

## Objetivo vigente

Cerrar la puerta de calidad del producto con evidencia reproducible de
integración, tipos/rendimiento, accesibilidad en clientes reales y narrativa de
portafolio. Después se evaluarán las mejoras de evolución y mantenibilidad.

## Backlog activo

| ID     | Entregable                                     | Estado    | Dependencia vigente                               |
| ------ | ---------------------------------------------- | --------- | ------------------------------------------------- |
| MHB-20 | Integración build, render, caché y exportación | Pendiente | Prerequisitos funcionales satisfechos en `v1.2.0` |
| MHB-13 | Cobertura de tipos y rendimiento               | Pendiente | MHB-20                                            |
| MHB-14 | Evidencia de uso y compatibilidad              | Pendiente | Flujo de producto publicado                       |
| MHB-15 | Documentación, capturas y release posterior    | Pendiente | MHB-13 y MHB-14                                   |
| MHB-16 | Demo candidata pre-renderizada                 | Opcional  | MHB-13, MHB-14 y MHB-15                           |
| MHB-23 | Ampliar biblioteca de componentes              | Opcional  | MHB-20                                            |
| MHB-28 | Modularización de superficies web              | Pendiente | Baseline visual y validadores actuales            |

## MHB-20 — Integración build, render, caché y exportación

- **Objetivo:** comprobar el flujo extremo a extremo con temporales, sin
  depender de binarios PNG.
- **Precondiciones:** render seguro, catálogo de templates, templates de
  producto, preview y exportación HTML ya están publicados en `v1.2.0`.
- **Superficies:** tests de integración, build/render, caché, exportación y
  fixtures temporales.
- **Pasos:** integrar flatten, `{{ }}`, `[[ ]]`, gate, tema, `theme+dataHash`
  y exportación HTML en escenarios transaccional y marketing.
- **Aceptación:** los flujos producen el output esperado, respetan caché y no
  dejan artefactos fuera de temporales.
- **Validación y evidencia:** integración temporal, suite global y revisión del
  HTML final de un caso transaccional y otro marketing; registrar resultados de
  flatten, delimitadores, gate, caché y exportación.
- **Límites:** evitar binarios externos, infraestructura pesada de snapshots y
  cambios productivos.

## MHB-13 — Cobertura de tipos y rendimiento

Ampliar `checkJs` gradualmente y documentar mediciones repetibles, sin
migración global a TypeScript. La evidencia debe incluir Bun, Node, SO,
comandos, repeticiones, resultados y variabilidad. No se fija un budget de CI
ni se presentan métricas locales como rendimiento de producción.

## MHB-14 — Evidencia de uso y compatibilidad

Producir un checklist reproducible de accesibilidad y una matriz fechada para
Gmail, Outlook y Apple Mail. Cada prueba debe indicar fecha, cliente, criterio,
resultado, capturas seguras y limitaciones; un validador estático no sustituye
clientes reales ni certifica compatibilidad universal.

## MHB-15 — Documentación, capturas y release posterior

Alinear README, CHANGELOG, versión, tag, release y evidencia obtenida por los
controles activos. La evidencia debe vincular SHA, tag, URL de release,
capturas actuales y límites verificables. Ninguna publicación, tag o incremento
de versión se realiza sin autorización explícita del orquestador.

## Evolución y mantenibilidad

### MHB-16 — Demo candidata pre-renderizada

Opcional. Una demo solo lectura debe coincidir con el HTML compilado, pasar un
smoke de enlaces y documentar URL candidata, SHA desplegado y revisión en
desktop/móvil. Requiere autorización antes de proveedor, credenciales, coste o
publicación externa.

### MHB-23 — Ampliar biblioteca de componentes

Opcional. Cada componente adicional debe ser email-safe, incluir schema,
aparecer en `/library` y pasar build, validadores y pruebas aplicables. No se
convierte la biblioteca en un editor o builder.

### MHB-28 — Modularización de superficies web

Reducir superficies no-test de `src/web/**` a menos de 300 líneas, extraer la
lógica embebida de `preview.html`, consolidar skeletons y eliminar CSS o markup
huérfano sin modificar la salida de email. `a11y-check`, `lint:contrast`, suite,
build y recorrido dark/light deben conservar la equivalencia visual; `dist/`
queda idéntico byte a byte antes y después.

## Gates globales

- Todos los cambios: `bun run format:check` y `git diff --check`.
- Markdown: `bun run lint:md`.
- JavaScript/configuración: `bun run lint` y `bun run typecheck` según alcance.
- Templates/layouts/CSS/build: `bun run build` y `bun run validate-email`.
  ERROR bloquea; WARNING e INFO quedan visibles.
- UI/API: pruebas automatizadas más recorrido manual cuando la aceptación lo
  requiera.

## Política operativa

- Una tarea por rama `feature/<id-en-minusculas>` y PR directo a `master`.
- El implementador entrega `En revisión`; un revisor independiente confirma
  aceptación, diff y evidencia antes de `Completada`.
- `dist/` permanece versionado. Las variables ESP `{{ }}` deben preservarse y
  `[[ page.* ]]` sigue reservado para Maizzle.
- El orquestador conserva decisiones sobre versiones, releases, permisos,
  cambios destructivos y alcance transversal.
