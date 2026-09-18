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

- **Objetivo observable:** comprobar el flujo extremo a extremo con temporales, sin depender de binarios PNG.
- **Superficies autorizadas:** tests de integración, build/render, caché, exportación y fixtures temporales.
- **Dependencias y precondiciones:** render seguro, catálogo de templates, templates de producto, preview y exportación HTML publicados en `v1.2.0`; los datos y output de prueba se mantienen aislados.
- **Pasos técnicos:** integrar flatten, `{{ }}`, `[[ ]]`, gate, tema, `theme+dataHash` y exportación HTML en escenarios transaccional y marketing.
- **Criterios de aceptación:** los flujos producen el output esperado, respetan caché y no dejan artefactos fuera de temporales.
- **Validación automática:** integración temporal de build/render/caché/exportación y suite global.
- **Validación manual:** revisar el HTML final de un caso transaccional y otro marketing.
- **Evidencia requerida:** resultados de flatten, delimitadores, gate, caché y exportación.
- **Riesgos y reversión:** pruebas lentas/frágiles o dependencia de binarios; usar temporales, evitar PNG y revertir fixtures/tests aislados.
- **Exclusiones específicas:** no reemplazar pruebas visuales reales ni crear infraestructura pesada de snapshots.
- **Implementador:** perfil de pruebas/integración, alto.
- **Revisor independiente:** revisor técnico alto.
- **Condición de escalamiento:** tests que requieran binarios externos o modifiquen comportamiento de producción.

## MHB-13 — Cobertura de tipos y rendimiento

- **Objetivo observable:** ampliar `checkJs` gradualmente y documentar mediciones repetibles.
- **Superficies autorizadas:** configuración de typecheck, scripts relevantes, tests/medición y documentación técnica.
- **Dependencias y precondiciones:** MHB-20 completada y cobertura unitaria existente; conservar compatibilidad JavaScript sin migración global.
- **Pasos técnicos:** seleccionar scripts de mayor riesgo, corregir tipos progresivamente y medir con Bun, Node, SO y método declarados.
- **Criterios de aceptación:** `checkJs` cubre scripts relevantes sin migración global y las mediciones son repetibles y contextualizadas.
- **Validación automática:** typecheck ampliado, suite y script de medición reproducible.
- **Validación manual:** revisar entorno, repeticiones y variabilidad.
- **Evidencia requerida:** tabla Bun/Node/SO, comandos, repeticiones y resultados.
- **Riesgos y reversión:** scope creep a TypeScript o métricas engañosas; limitar archivos y conservar baseline.
- **Exclusiones específicas:** no fijar budget CI ni migrar todo a TypeScript.
- **Implementador:** perfil de tipos/rendimiento, alto.
- **Revisor independiente:** revisor técnico.
- **Condición de escalamiento:** exigir migración global, presupuesto CI o métricas de producción.

## MHB-14 — Evidencia de uso y compatibilidad

- **Objetivo observable:** producir checklist reproducible de accesibilidad y matriz fechada de clientes reales.
- **Superficies autorizadas:** protocolo/checklist, capturas, matriz documental y templates de producto.
- **Dependencias y precondiciones:** el flujo de producto publicado permanece disponible y se dispone de los clientes/dispositivos declarados.
- **Pasos técnicos:** definir criterios de teclado/lector, ejecutar protocolo en Gmail, Outlook y Apple Mail, y registrar límites.
- **Criterios de aceptación:** cada prueba tiene fecha, cliente, criterio, resultado y evidencia; no se sustituyen clientes reales por un validador estático.
- **Validación automática:** validadores disponibles y lint de matriz, sin presentarlos como prueba real.
- **Validación manual:** teclado, lector y clientes de correo según protocolo.
- **Evidencia requerida:** matriz por cliente/criterio, capturas sin secretos y limitaciones.
- **Riesgos y reversión:** afirmar cobertura no realizada o filtrar datos; usar cuentas/fixtures seguros y marcar no verificado.
- **Exclusiones específicas:** no certificar accesibilidad ni compatibilidad universal.
- **Implementador:** perfil de evidencia/compatibilidad, alto.
- **Revisor independiente:** orquestador o revisor con acceso a clientes.
- **Condición de escalamiento:** falta acceso a cliente/dispositivo o aparecen datos sensibles.

## MHB-15 — Documentación, capturas y release posterior

- **Objetivo observable:** dejar README, CHANGELOG, versión, tag y release posterior coherentes y sustentados.
- **Superficies autorizadas:** README, CHANGELOG, versión/package metadata, capturas, notas de release y documentación relacionada.
- **Dependencias y precondiciones:** MHB-13, MHB-14 y una decisión explícita antes de publicar o etiquetar; preservar el baseline publicado.
- **Pasos técnicos:** reconciliar narrativa/evidencia, actualizar versión y changelog del alcance real, preparar tag/release solo tras revisión.
- **Criterios de aceptación:** documentación, versión, tag y release posterior coinciden; las capturas son actuales y los límites no se presentan como hechos no probados.
- **Validación automática:** lint Markdown, suite, build y comprobación de consistencia de versión.
- **Validación manual:** revisar README, capturas, changelog, SHA/tag y notas antes de publicar.
- **Evidencia requerida:** SHA, tag, URL de release, diff final y checklist de capturas.
- **Riesgos y reversión:** publicar una afirmación adelantada; detener antes de acciones externas y revertir documentación local si corresponde.
- **Exclusiones específicas:** no publicar automáticamente ni modificar tags o releases ya publicados.
- **Implementador:** perfil documentación/release, medio.
- **Revisor independiente:** orquestador.
- **Condición de escalamiento:** cualquier publicación, tag, versión o evidencia no sustentada.

## Evolución y mantenibilidad

### MHB-16 — Demo candidata pre-renderizada

- **Objetivo observable:** decidir y probar una demo solo lectura sin divergencia frente al HTML compilado.
- **Superficies autorizadas:** build estático, configuración de demo/despliegue aprobada, rutas de navegación y documentación de evidencia.
- **Dependencias y precondiciones:** MHB-13, MHB-14 y MHB-15; aprobación explícita de proveedor/credenciales si fueran necesarios.
- **Pasos técnicos:** comparar output, configurar demo mínima, ejecutar smoke y registrar SHA desplegado.
- **Criterios de aceptación:** demo candidata coincide con HTML compilado, funciona en desktop/móvil y se enlaza para verificación.
- **Validación automática:** smoke de build estático, enlaces y checks aplicables.
- **Validación manual:** navegar la demo solo lectura en desktop/móvil.
- **Evidencia requerida:** URL candidata, SHA desplegado y checklist.
- **Riesgos y reversión:** divergencia, coste o exposición de datos; no desplegar sin aprobación y retirar la configuración candidata de forma recuperable.
- **Exclusiones específicas:** no publicar el caso como destacado ni añadir backend.
- **Implementador:** perfil de deploy/preview, alto.
- **Revisor independiente:** orquestador.
- **Condición de escalamiento:** proveedor, credenciales, coste o publicación externa.

### MHB-23 — Ampliar biblioteca de componentes

- **Objetivo observable:** añadir componentes email-safe con schema y presencia en `/library`.
- **Superficies autorizadas:** partials/componentes, schemas, library, pruebas y documentación de componentes.
- **Dependencias y precondiciones:** MHB-20 y un caso de uso aprobado para cada componente.
- **Pasos técnicos:** crear componente/schema, registrarlo, construirlo y cubrir su validación/prueba aplicable.
- **Criterios de aceptación:** cada componente adicional es email-safe, tiene schema, aparece en `/library` y pasa controles.
- **Validación automática:** build, schema, validadores y tests aplicables por componente.
- **Validación manual:** abrir library, editar datos y revisar output.
- **Evidencia requerida:** schema, captura, build verde y resultados de validación.
- **Riesgos y reversión:** ampliar hacia un builder o duplicar componentes; mantener cada adición aislada y reversible.
- **Exclusiones específicas:** no construir editor/builder de emails.
- **Implementador:** perfil email/UI, medio.
- **Revisor independiente:** revisor de email/UI.
- **Condición de escalamiento:** el alcance se amplía hacia un builder o requiere nueva arquitectura.

### MHB-28 — Modularización de superficies web sobredimensionadas

- **Objetivo observable:** ningún archivo no-test de `src/web/**` supera 300 líneas, `preview.html` queda sin lógica JavaScript y los skeletons se declaran como componente reutilizable, sin cambio visual ni alteración del pipeline de email.
- **Motivación:** `src/web/features/preview/` concentra 7.150 líneas, cerca del 72 % del código web, en archivos que mezclan dominios. Los comentarios de `styles.css:647-666` documentan cómo un selector por ID ganó silenciosamente sobre una utilidad Tailwind y el estado seleccionado del viewport dejó de mostrarse. El riesgo no es estético: es una regresión silenciosa.

#### Inventario inicial (2026-09-18, sobre `master`)

| Archivo                                          | Líneas | Diagnóstico                                               |
| ------------------------------------------------ | -----: | --------------------------------------------------------- |
| `src/web/features/preview/styles.css`            |    776 | Nueve dominios; 112 selectores con `#` y 20 `!important`. |
| `src/web/features/preview/preview.html`          |    666 | Skeletons y 52 líneas de JavaScript embebido.             |
| `src/web/features/preview/copy-html-modal.css`   |    476 | CSS de un diálogo; conserva una regla muerta.             |
| `src/web/features/library/styles/library.css`    |    331 | Repite cuatro veces el bloque de scrollbars light/dark.   |
| `src/web/features/preview/view-mode-controls.js` |    254 | Mezcla toggle de vista y escapado de HTML fuente.         |
| `src/web/features/library/main.js`               |    232 | Estado, storage, debounce, filtrado y DOM monolíticos.    |
| `scripts/vite/plugins/dashboard.js`              |    209 | Casi todo es un template string con HTML, CSS y script.   |
| `src/web/features/preview/preview-ready.js`      |     98 | Repite a mano siete pares skeleton/contenido.             |

Defectos puntuales confirmados, independientes del tamaño:

1. `styles.css` se carga dos veces: `<link>` en `preview.html:9` e `import "./styles.css"` en `main.js:22`. Home y Library usan solo el import; el `<link>` es sobrante.
2. Hay JavaScript embebido fuera de bootstrap: `preview.html:610-661` (tabs móviles y cierre del menú `⋯`) y el `<script>` dentro del template string de `dashboard.js`.
3. La regla CSS `.btn-build-copy` en `copy-html-modal.css:473` está muerta; solo `.btn-copy-existing` tiene consumidor (`copy-html-dialog.js:34`).
4. `src/web/features/library/components/` contiene cinco fragmentos HTML huérfanos (59 líneas): no existe `fetch()` de `.html` ni include en `src/web`; sus clases BEM (`library-sidebar__header`) difieren de las de la página viva (`library-sidebar-header`, inline en `components-library.html`).

- **Decisión de arquitectura:** Handlebars queda reservado a `src/emails/**`; no se introduce en `src/web`. La componentización del dashboard usa Web Components nativos, el patrón vivo `theme-toggle` de `src/web/shared/utils/theme-toggle-component.js`, único `customElements.define` actual. No se retoma la vía de fragmentos HTML.
- **Restricción técnica del componente de skeleton:** `<ef-skeleton>` usa **light DOM, nunca shadow DOM**. Los skeletons se pintan con utilidades Tailwind (`animate-pulse`, `bg-slate-200`) y `styles.css:625-636` los alcanza desde fuera por ID (`.preview-shell #preview-skeleton`, `#editor-skeleton`, `#actions-skeleton`); `preview-ready.js` los resuelve con `doc.getElementById`. Shadow DOM rompería ambos contratos.
- **Superficies autorizadas:**
  - Obligatorias: `src/web/features/preview/styles.css` y el nuevo directorio `src/web/features/preview/styles/`; `preview.html`; `main.js` solo para imports y bootstrap; `preview-ready.js` y test; `copy-html-modal.css`; nuevos `src/web/features/preview/mobile-tabs.js` y `src/web/shared/components/ef-skeleton.js` con tests; borrado de `src/web/features/library/components/**`.
  - Opcionales, solo con autorización explícita: `scripts/vite/plugins/dashboard.js` y test; `src/web/features/library/styles/library.css`; `src/web/features/library/main.js` y módulos; `src/web/features/preview/view-mode-controls.js` y test.
  - Fuera de alcance: `src/emails/**`, Maizzle, Handlebars, variables ESP, validadores, APIs Vite, `scripts/shared/**` y HTML dentro de iframes.
- **Dependencias y precondiciones:** baseline visual y validadores de `v1.2.0` confirmados; ninguna edición concurrente de estas superficies; rama `feature/mhb-28` con `bun run check:task-branch` verde antes de editar. MHB-20 conserva prioridad inmediata.

#### Fases y pasos técnicos

Cada bloque es un commit propio y recuperable. El orden es obligatorio: F1 precede a F3 porque aislar `shell-theme.css` deja visibles las reglas por ID de las líneas 625-636 que F3 mueve.

- **F0 — Limpieza sin riesgo (obligatoria):** eliminar el `<link>` de `styles.css` en `preview.html:9` y conservar el import de `main.js:22`; borrar `.btn-build-copy` de `copy-html-modal.css:473`; borrar los cinco fragmentos de `src/web/features/library/components/`.
- **F1 — División de `styles.css` (obligatoria):** cortar por las fronteras de sus comentarios sin reordenar reglas: `layout.css` (1-114: base/modo código), `header-responsive.css` (115-328: etiquetas y container queries), `responsive.css` (329-491: tablet/móvil), `jsoneditor-theme.css` (492-584: validación/temas) y `shell-theme.css` (585-776: shell, viewport y contraste). `styles.css` conserva ruta y queda como índice de `@import` en el orden original.
- **F2 — Extracción de JavaScript embebido (obligatoria):** mover `preview.html:610-661` a `mobile-tabs.js` e integrar el cierre de `⋯` en el `more-menu.js` existente. `preview.html` queda solo con `<script type="module" src="…/main.js">`.
- **F3 — Componente `<ef-skeleton>` (obligatoria):** declarar cada par, por ejemplo `<ef-skeleton for="topbar-controls" reveal-display="flex">`, conservando clases Tailwind. `markPreviewReady()` recorre componentes y llama `reveal()` en vez de enumerar siete pares. Manejar explícitamente las dos excepciones: `template-name-skeleton` se elimina con `.remove()` y `saveBtn.disabled = false` queda fuera del componente en `main.js`. No renombrar IDs consumidos por JS, CSS y `a11y-check`.
- **F4 — `dashboard.js` (obligatoria, bajo riesgo):** sacar HTML, CSS y `<script>` del template string a un archivo de plantilla; el plugin conserva `getTemplates` y ensamblado. La apariencia de las tarjetas Home no cambia.
- **F5 — Bloque opcional, con autorización explícita:** deduplicar scrollbars light/dark en `library.css`; dividir `library/main.js` en `state.js` y `controller.js`; extraer el escapado de HTML fuente de `view-mode-controls.js`. Ninguno resuelve un bug conocido; su ausencia no bloquea el cierre.

- **Criterios de aceptación:**
  - Ningún archivo no-test bajo `src/web/**` supera 300 líneas; `styles.css`, `preview.html` y `copy-html-modal.css` quedan bajo el umbral.
  - `preview.html` no contiene `<script>` con lógica: solo el módulo de bootstrap. `preview-ready.js` no enumera pares de IDs a mano y cubre los siete pares, incluidos los dos no uniformes.
  - `<ef-skeleton>` está registrado con `customElements.define`, usa light DOM y tiene test propio de revelado, `reveal-mode="hide|remove"` y ausencia de `for`.
  - **Cero cambio visual:** `bun run a11y-check` y `bun run lint:contrast` devuelven el mismo resultado verde previo; el recuento de `!important` y selectores por ID no aumenta respecto al inventario.
  - **Cero cambio en salida de email:** `dist/*.html` es idéntico byte a byte antes y después y `src/web/features/library/components/` queda eliminado.
- **Validación automática:** `bun run lint`, `bun run typecheck`, `bun run test`, `bun run format:check`, `bun run build`, `bun run validate-email`, `bun run lint:contrast`, `bun run a11y-check`, `bun run agents:check` y `git diff --check`. Gate específico: capturar hash de cada `dist/*.html` antes de empezar y compararlo al cierre; cualquier diferencia detiene el ID.
- **Validación manual:** ejecutar `bun run dev` a 375px, 768px y 1440px, en dark y light, sobre Home, Preview y Library. Comprobar explícitamente transición skeleton→contenido sin destello/salto de layout, tabs móviles, menú `⋯` bajo 480px, estado activo del selector de viewport, toggle render/código y modal de copiar HTML.
- **Evidencia requerida:** tabla archivo→líneas antes/después; diff por F0–F4 en commits separados; salida de gates; hashes de `dist/*.html`; recuento de `!important` y selectores por ID antes/después; recorrido manual fechado con las seis combinaciones ancho/tema.
- **Riesgos y reversión:**
  - Romper la cascada al dividir CSS. Mitigación: no reordenar reglas de un bloque y replicar el orden original de `@import`.
  - La especificidad por ID puede invertir un ganador silenciosamente; el gate es `a11y-check`/`lint:contrast` más el recorrido manual, no solo inspección de diff.
  - `<ef-skeleton>` puede causar FOUC o salto de layout; conservar semántica de `hidden`/`flex` y el `initLucideIcons()` final.
  - Cada bloque se revierte independientemente; F5 se puede descartar entero sin afectar el cierre.
- **Exclusiones específicas:** no Handlebars en `src/web`; no shadow DOM en `<ef-skeleton>`; no frameworks, dependencias ni fuentes remotas; no rediseño; no renombrar IDs o clases consumidas por CSS, JS o `a11y-check`; no TypeScript ni ampliación de `tsconfig`; no tocar email, Maizzle, variables ESP, validadores o APIs Vite. `readBuiltTemplate` (`scripts/shared/built-templates.js`) queda fuera y requiere un ID propio.
- **Implementador:** perfil UI/web con propiedad exclusiva de las superficies, esfuerzo alto. **Revisor independiente:** revisor UI distinto, responsable de ejecutar el recorrido manual completo y verificar hashes de `dist/`.
- **Condición de escalamiento:** un bloque exige cambio visual, renombrar IDs o tocar una superficie no autorizada; `dist/` cambia; o dividir CSS exige reordenar reglas para conservar el comportamiento.

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
