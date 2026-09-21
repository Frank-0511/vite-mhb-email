# Plan de implementación — EmailForge Toolkit

Este documento contiene únicamente el trabajo pendiente. El baseline funcional
publicado es `v1.2.0`; los artefactos de Git conservan la trazabilidad previa.

## Objetivo vigente

Cerrar la puerta de calidad del producto con evidencia reproducible de
integración, tipos/rendimiento, accesibilidad en clientes reales y narrativa de
portafolio. Después se completará la migración gradual de todo el código
JavaScript propio a TypeScript estricto antes de preparar la siguiente release.

## Matriz de reestructuración del plan

| Ítem anterior | Decisión   | Tratamiento vigente                                                                              |
| ------------- | ---------- | ------------------------------------------------------------------------------------------------ |
| MHB-20        | Conservar  | Mantiene prioridad inmediata y produce el baseline de integración previo a tipos.                |
| MHB-13        | Reemplazar | Pasa de cierre parcial de `checkJs` a baseline completo que prepara la conversión por capas.     |
| MHB-14        | Conservar  | Su evidencia manual sigue siendo independiente de la migración de lenguaje.                      |
| MHB-15        | Reemplazar | La release posterior dependerá del cierre total de TypeScript, además de MHB-14.                 |
| MHB-16        | Reemplazar | La demo candidata dependerá de MHB-15, que ya incorpora el gate total de migración.              |
| MHB-23        | Conservar  | Sigue opcional y no se mezcla con la conversión de lenguaje.                                     |
| MHB-28        | Conservar  | Conserva su alcance JavaScript y se ejecuta antes de migrar `src/web/**` para evitar doble diff. |
| MHB-35        | Crear      | Consolidación de shared y deduplicación previa a migración TypeScript.                           |

No se reabre ni descarta ninguna tarea completada. La migración total se divide
en MHB-29 a MHB-34; MHB-35 consolida utilidades compartidas antes de migrar el núcleo. Cada ID conserva una rama, revisión y cierre independientes.

## Backlog activo

| ID     | Entregable                                     | Estado     | Dependencia vigente                               |
| ------ | ---------------------------------------------- | ---------- | ------------------------------------------------- |
| MHB-20 | Integración build, render, caché y exportación | Completada | Prerequisitos funcionales satisfechos en `v1.2.0` |
| MHB-13 | Baseline completo de tipos y rendimiento       | Completada | MHB-20                                            |
| MHB-29 | Base de ejecución TypeScript                   | Completada | MHB-13                                            |
| MHB-28 | Modularización de superficies web              | Completada | MHB-20                                            |
| MHB-35 | Consolidación de shared y deduplicación        | Pendiente  | MHB-20 y MHB-28                                   |
| MHB-30 | Núcleo y validadores en TypeScript             | Pendiente  | MHB-29 y MHB-35                                   |
| MHB-31 | CLI, exportación y correo en TypeScript        | Pendiente  | MHB-30                                            |
| MHB-32 | Servidor Vite y APIs en TypeScript             | Pendiente  | MHB-31                                            |
| MHB-33 | Dashboard web en TypeScript                    | Pendiente  | MHB-28, MHB-32 y MHB-35                           |
| MHB-34 | Cierre total y modo estricto TypeScript        | Pendiente  | MHB-33                                            |
| MHB-14 | Evidencia de uso y compatibilidad              | Pendiente  | Flujo de producto publicado                       |
| MHB-15 | Documentación, capturas y release posterior    | Pendiente  | MHB-14 y MHB-34                                   |
| MHB-16 | Demo candidata pre-renderizada                 | Opcional   | MHB-15                                            |
| MHB-23 | Ampliar biblioteca de componentes              | Opcional   | MHB-20                                            |

## Invariantes de calidad, arquitectura y refactor integrado

A partir de `v1.2.0` y el cierre de MHB-28, todo trabajo técnico en EmailForge Toolkit debe regirse por estos principios obligatorios. No se crean tareas de refactor aisladas: la mejora estructural y el saneamiento de deuda técnica se ejecutan de forma continua como parte de cada entrega activa.

### 1. Reglas de codificación y límites estrictos

- **Límites de tamaño de archivo:** ningún archivo fuente (no-test) puede superar 250 líneas de código. Los archivos de test no deben superar 400 líneas (si crecen, deben dividirse por suite de pruebas o escenario).
- **Límites de directorio:** ningún directorio debe contener más de 8 archivos fuente sin estructurarse en subdirectorios temáticos por dominio (los tests co-locados no se contabilizan para este límite, pero no justifican directorios planos desordenados).
- **Responsabilidad única:** un archivo resuelve una sola responsabilidad. Si un módulo realiza parsing Y formateo, o validación Y reporte, debe dividirse en módulos especializados.
- **Shared first:** antes de implementar una función utilitaria o helper, revisar `scripts/shared/` o `src/web/shared/utils/`. Si existe, reutilizarla; si no existe pero tiene potencial reutilizable (≥2 consumidores), ubicarla en `shared/`. No hardcodear constantes de almacenamiento (`storage-keys.js`), breakpoints, magic numbers (e.g. `1024` para KB) ni cabeceras HTTP. En el frontend, el acceso al DOM y llamadas remotas deben usar exclusivamente `dom-helpers.js` (`queryRequired`, `querySafe`) y `http-helpers.js` (`fetchJSON`, `postJSON`, `debounce`).
- **Menos es más:** preferir eliminar código obsoleto o simplificar flujos antes que crear abstracciones preventivas o capas intermedias de una sola línea sin valor agregado.
- **Convención de nombres:** archivos en `kebab-case`, constantes exportadas en `UPPER_SNAKE_CASE`, funciones en `camelCase`, Web Components con prefijo `ef-`, y tests co-locados con sufijo `.test.js` / `.test.ts`.

### 2. Arquitectura de carpetas escalable (patrón feature-module)

Toda feature frontend o paquete de scripts debe organizarse bajo una jerarquía predecible y replicable a cualquier nivel de profundidad:

```text
feature-o-paquete/
├── main.js (o index.ts)      # Punto de entrada cohesivo: solo bootstrap y exports
├── feature.html              # Markup exclusivo si aplica
├── styles/                   # Hojas de estilo divididas por dominio temático
│   ├── layout.css
│   └── theme.css
└── modules/ (o subcarpetas)  # Lógica modular organizada por subdominio
    ├── controls/
    │   ├── component.js
    │   └── component.test.js
    └── render/
        ├── render-api.js
        └── render-api.test.js
```

Criterios para crear subdirectorios:

- Más de 8 archivos fuente en un mismo directorio.
- Tres o más archivos que compartan un prefijo temático (e.g. `esp-*`, `copy-html-*`).
- Extracción de un módulo en múltiples piezas auxiliares.

### 3. Re-análisis obligatorio de mantenibilidad por tarea

Todo plan de implementación y contrato técnico futuro debe incluir obligatoriamente una sección de **Análisis de mantenibilidad**:

1. Inventario de archivos intervenidos y líneas de código.
2. Identificación de responsabilidades por archivo y plan de división si superan 250 líneas o mezclan dominios.
3. Detección de duplicación o constantes hardcodeadas y plan de migración a `shared/`.
4. Revisión de carpetas planas y plan de subdirectorios.

El cumplimiento de estos criterios es condición indispensable para que un revisor independiente marque una tarea como `Completada`.

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

## MHB-13 — Baseline completo de tipos y rendimiento

- **Objetivo observable:** lograr un baseline `checkJs` verde para todo el código JavaScript propio y documentar mediciones repetibles antes de renombrar archivos.
- **Superficies autorizadas:** `tsconfig*.json`, declaraciones ambientales, código bajo `scripts/**` y `src/**`, configuraciones raíz, tests/medición y documentación técnica.
- **Dependencias y precondiciones:** MHB-20 completada y cobertura unitaria existente; mantener extensiones `.js`/`.mjs` durante este ID.
- **Pasos técnicos:** inventariar el alcance y sus importadores; incorporar producción, tests y configuraciones al typecheck; declarar CSS, `import.meta.hot`, editor CDN y demás límites externos; corregir tipos JSDoc sin alterar comportamiento; medir con Bun, Node, SO y método declarados; registrar el orden de conversión MHB-29 a MHB-34.
- **Criterios de aceptación:** todo archivo JavaScript propio queda inventariado y cubierto por un typecheck verde; no hay `@ts-ignore` nuevo; la suite no cambia de comportamiento y las mediciones son repetibles y contextualizadas.
- **Validación automática:** typecheck ampliado, suite global, lint, formato y script de medición reproducible.
- **Validación manual:** revisar inventario, límites ambientales, entorno, repeticiones y variabilidad.
- **Evidencia requerida:** inventario inicial por directorio, lista de declaraciones externas, tabla Bun/Node/SO, comandos, repeticiones y resultados.
- **Riesgos y reversión:** confundir diagnósticos de librerías con defectos de runtime o introducir cambios funcionales; separar anotaciones, declaraciones y correcciones, conservando el baseline.
- **Exclusiones específicas:** no renombrar archivos a `.ts`, no activar todavía `strict` global ni fijar un budget CI.
- **Implementador:** perfil de tipos/rendimiento, alto.
- **Revisor independiente:** revisor técnico.
- **Condición de escalamiento:** un diagnóstico exige cambio de comportamiento, contrato público o dependencia nueva.

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
- **Dependencias y precondiciones:** MHB-14 y MHB-34 completadas, además de una decisión explícita antes de publicar o etiquetar; preservar el baseline publicado.
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
- **Dependencias y precondiciones:** MHB-15 completada; aprobación explícita de proveedor/credenciales si fueran necesarios.
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
- **Exclusiones específicas:** no Handlebars en `src/web`; no shadow DOM en `<ef-skeleton>`; no frameworks, dependencias ni fuentes remotas; no rediseño; no renombrar IDs o clases consumidas por CSS, JS o `a11y-check`; no TypeScript ni ampliación de `tsconfig` dentro de MHB-28, porque `src/web/**` se migra después en MHB-33; no tocar email, Maizzle, variables ESP, validadores o APIs Vite. `readBuiltTemplate` (`scripts/shared/built-templates.js`) queda fuera y requiere un ID propio.
- **Implementador:** perfil UI/web con propiedad exclusiva de las superficies, esfuerzo alto. **Revisor independiente:** revisor UI distinto, responsable de ejecutar el recorrido manual completo y verificar hashes de `dist/`.
- **Condición de escalamiento:** un bloque exige cambio visual, renombrar IDs o tocar una superficie no autorizada; `dist/` cambia; o dividir CSS exige reordenar reglas para conservar el comportamiento.

## Migración gradual y completa a TypeScript

El alcance final comprende todo archivo JavaScript o MJS propio bajo
`scripts/**`, `src/**` y las configuraciones raíz. Se excluyen dependencias,
outputs generados, `dist/**` y material sincronizado de solo lectura. Durante
MHB-29 a MHB-33 se permite convivencia `.js`/`.mjs`/`.ts`; MHB-34 elimina esa
compatibilidad transitoria. Cambiar extensión no autoriza cambios funcionales,
rediseños ni alteraciones de los contratos CLI, filesystem, email o ESP.

### MHB-29 — Base de ejecución TypeScript

- **Objetivo observable:** establecer una configuración mixta reproducible que permita ejecutar, probar, lintar y compilar módulos `.ts` junto a los `.js` existentes.
- **Superficies autorizadas:** `tsconfig*.json`, `package.json`, lockfile solo si hace falta una dependencia directa justificada, ESLint/lint-staged, declaraciones ambientales, script de inventario y documentación técnica.
- **Dependencias y precondiciones:** MHB-13 completada con inventario y typecheck verde en JavaScript.
- **Pasos técnicos:** consolidar la configuración en dos archivos (`tsconfig.json` canónico para todo el proyecto y `tsconfig.strict.json` para auditoría estricta de módulos `.ts`), unificando opciones y librerías DOM compartidas; activar `strict` para archivos nuevos `.ts`; estandarizar la convención de imports explícitos con extensión `.ts`; declarar imports CSS, Vite HMR y el editor remoto; verificar ejecución TypeScript con Bun, Node 24, Vite, Maizzle, Tailwind, PostCSS y ESLint; añadir un control determinista que cuente archivos `.js`/`.mjs` restantes por capa con soporte para `--require-zero`.
- **Criterios de aceptación:** un módulo y test piloto `.ts` pasan typecheck/lint/test sin transpilar artefactos al repositorio; los entrypoints actuales conservan comandos y salida; el inventario inicial queda versionado como baseline decreciente.
- **Validación automática:** typecheck unificado + estricto, test piloto, lint, formato, build, validación email y control de inventario.
- **Validación manual:** revisar resolución ESM, sourcemaps/errores accionables y compatibilidad de cada cargador de configuración.
- **Evidencia requerida:** matriz herramienta→forma de cargar TypeScript, comandos ejecutados, conteo inicial por capa y diff de configuración.
- **Riesgos y reversión:** loaders incompatibles o dependencia transitoria implícita; declarar dependencias directas necesarias y revertir el piloto sin tocar lógica de producto.
- **Exclusiones específicas:** no migrar aún una capa completa, no activar JSX/React y no emitir JavaScript versionado.
- **Implementador:** perfil TypeScript/tooling, alto.
- **Revisor independiente:** revisor técnico distinto.
- **Condición de escalamiento:** una herramienta no puede cargar TypeScript sin cambiar un comando público o añadir una dependencia de runtime.

### MHB-35 — Consolidación de shared y deduplicación

- **Objetivo observable:** eliminar duplicación de código, claves hardcodeadas y dependencias directas en APIs no estandarizadas, consolidando utilidades en `scripts/shared/` y `src/web/shared/utils/` antes de la migración a TypeScript.
- **Superficies autorizadas:** `src/web/shared/utils/**`, `scripts/shared/**`, `src/web/features/preview/**`, `src/web/features/library/**`, `scripts/validators/check-html-size.js`, `scripts/export/index.js`, `scripts/vite/plugins/dashboard-templates.js`.
- **Dependencias y precondiciones:** MHB-20 y MHB-28 completadas; pruebas y validadores verdes en `master`.
- **Pasos técnicos:**
  1. Adoptar `storage-keys.js` de forma estricta en `theme-manager.js`, `iframe-manager.js`, `render-api.js` y `library/main.js` (reemplazar `"template-theme"` y `"selectedComponentId"` hardcodeados).
  2. Sustituir llamadas `fetch()` directas en features web por los helpers `fetchJSON`/`postJSON` de `http-helpers.js` (e.g. en `components-api.js` y `render-api.js`).
  3. Reemplazar `document.getElementById` directo en `library/main.js` por `queryRequired` o `querySafe` de `dom-helpers.js`.
  4. Reemplazar el `setTimeout` manual para debounce en `library/main.js` por el helper `debounce` de `http-helpers.js`.
  5. Crear `scripts/shared/format-helpers.js` con `formatBytes()` y sus tests unitarios; consumirlo en `check-html-size.js`, `export/index.js` y `dashboard-templates.js` eliminando el cálculo manual `size / 1024`.
  6. Unificar la lógica de determinación de tema (lectura y fallback) en un helper reusable en `src/web/shared/utils/` para desacoplar y deduplicar `theme-manager.js` e `iframe-manager.js`.
- **Criterios de aceptación:**
  - Cero cadenas literales de almacenamiento (`"template-theme"`, `"selectedComponentId"`) fuera de `storage-keys.js`.
  - Cero llamadas directas a `fetch()` en componentes y módulos de features web.
  - Cero uso de `document.getElementById` crudo en `library/main.js`.
  - Cero implementaciones manuales de debounce con temporizadores en features web.
  - `formatBytes()` centralizado con suite de test unitario y adoptado en todos los scripts que formatean tamaños.
  - Suite de pruebas completa verde, typecheck sin nuevos errores y sin regresión visual ni funcional en preview ni library.
- **Validación automática:** `bun run lint`, `bun run typecheck`, `bun run test`, `bun run format:check`, `bun run build`, `bun run validate-email`, `bun run lint:contrast`, `bun run a11y-check`.
- **Validación manual:** verificar alternancia de tema dark/light en preview y library; validar persistencia de componente seleccionado en library tras refrescar.
- **Evidencia requerida:** búsqueda estática confirmando cero ocurrencias de strings de storage o fetch crudo; reporte de tests de `format-helpers.js`; reporte completo de gates globales.
- **Riesgos y reversión:** romper reactividad de tema o debounce; aislar cambios por módulo en commits independientes y verificables.
- **Exclusiones específicas:** no renombrar archivos a `.ts` (reservado a MHB-30+); no alterar el markup de email ni el pipeline de compilación Maizzle.
- **Implementador:** perfil arquitectura frontend/shared, medio.
- **Revisor independiente:** revisor técnico.
- **Condición de escalamiento:** alteración de contratos públicos de APIs o comportamiento visible del usuario.

### MHB-30 — Núcleo y validadores en TypeScript

- **Objetivo observable:** convertir a TypeScript estricto el núcleo compartido, build, ESP y validadores con sus pruebas, saneando deuda técnica, dividiendo módulos sobredimensionados y organizando directorios por subdominios, manteniendo idénticos contratos y output.
- **Superficies autorizadas:** `scripts/shared/**`, `scripts/build/**`, `scripts/esp/**`, `scripts/validators/**`, `scripts/inventory/**`, `scripts/perf/**`, el test de partial bajo `src/emails/**`, imports consumidores y documentación de rutas afectada.
- **Dependencias y precondiciones:** MHB-29 y MHB-35 completadas; baseline de MHB-20 disponible para comparar build/render/exportación.
- **Pasos técnicos:**
  - Migrar por subcarpetas en orden de dependencias mediante commits independientes (`scripts/shared` → `scripts/esp` → `scripts/build` → `scripts/validators` → `src/emails`).
  - **Refactor integrado en `scripts/inventory/`:** dividir `check-migration-inventory.js` (334 líneas) en `inventory-parser.ts` y `inventory-reporter.ts` para cumplir el límite de ≤250 líneas y separar parsing de reporting.
  - **Refactor integrado en `scripts/perf/`:** dividir `measure-benchmarks.js` (320 líneas) en `benchmark-runner.ts` y `benchmark-formatter.ts`.
  - **Refactor integrado en `scripts/validators/`:** dividir `validate-contrast.js` (260 líneas) en `contrast-calculator.ts` y `contrast-reporter.ts`.
  - **Arquitectura de carpetas en `scripts/validators/email-rules/rules/`:** estructurar los 21 archivos planos en subdirectorios temáticos (`structure/`, `content/`, `accessibility/`) manteniendo un índice barril cohesivo.
  - **Arquitectura de carpetas en `scripts/shared/`:** estructurar los 16 archivos planos en subcarpetas cohesivas (`io/`, `template/`, etc.) evitando el límite de 8 archivos fuente por directorio.
  - **Saneamiento de límites:** resolver el acoplamiento cruzado en `src/emails/partials/organisms/hero/index.test.js` eliminando la dependencia indebida hacia `scripts/shared/component-folders.js`.
  - **Desambiguación de nombres:** renombrar `scripts/validators/email-rules/rules/esp-variables.js` para evitar colisión conceptual con `scripts/esp/esp-variables.js`.
  - Estandarizar imports con extensión `.ts` explícita; reemplazar typedefs locales por tipos exportados solo cuando haya dos o más consumidores; conservar validación runtime en límites JSON/filesystem; actualizar imports y scripts en `package.json`; comparar hashes y validaciones del HTML final tras cada carpeta; auditar el descenso del inventario tras cada bloque.
- **Criterios de aceptación:**
  - Ningún archivo fuente no-test supera 250 líneas de código; ningún archivo de test supera 400 líneas.
  - Ningún directorio contiene más de 8 archivos fuente sin estructurarse en subdirectorios por dominio.
  - No quedan `.js`/`.mjs` propios en las superficies autorizadas; `strict` pasa sin `any` explícito injustificado ni `@ts-ignore`; build selectivo/completo, ESP y validadores conservan resultados y hashes idénticos.
- **Validación automática:** typecheck estricto, tests focalizados y globales, lint, formato, build, `validate-email` y hashes de `dist/*.html`.
- **Validación manual:** revisar mensajes de error y un output transaccional y marketing frente al baseline.
- **Evidencia requerida:** inventario antes/después, hashes, tabla contrato→test y diagnósticos corregidos por carpeta.
- **Riesgos y reversión:** inferencias que cambien coerciones o manejo de `unknown`; tipar sin retirar guards runtime y cerrar cada carpeta en commit independiente.
- **Exclusiones específicas:** no tocar UI, servidor Vite, CLI ni semántica de reglas email.
- **Implementador:** perfil TypeScript/backend, alto.
- **Revisor independiente:** revisor de build/compatibilidad.
- **Condición de escalamiento:** cambia HTML, severidad de validación, delimitadores o contrato público de build.

### MHB-31 — CLI, exportación y correo en TypeScript

- **Objetivo observable:** convertir los entrypoints operativos y sus helpers a TypeScript estricto, desacoplando utilidades monolíticas, sin cambiar comandos, prompts, códigos de salida ni efectos de filesystem.
- **Superficies autorizadas:** `scripts/cli/**`, `scripts/export/**`, `scripts/generators/**`, `scripts/mail/**`, sus tests, scripts de `package.json`, imports y documentación de comandos.
- **Dependencias y precondiciones:** MHB-30 completada y APIs tipadas del núcleo disponibles.
- **Pasos técnicos:**
  - Migrar helpers antes que entrypoints.
  - **Refactor integrado en `scripts/cli/`:** modularizar `helpers.js` (221 líneas) separándolo en módulos especializados (`path-validators.ts`, `format-helpers.ts`, `fs-helpers.ts`) con responsabilidad única.
  - Tipar argumentos, procesos hijos, errores, prompts, rutas y resultados de Puppeteer/Nodemailer; actualizar comandos conservando nombres y argumentos; ejecutar casos felices y negativos sin shell ni credenciales reales.
- **Criterios de aceptación:**
  - Ningún archivo fuente no-test supera 250 líneas.
  - No quedan `.js`/`.mjs` propios en las superficies autorizadas; todos los comandos documentados conservan nombre, argumentos, código de salida y mensajes accionables; no se expone ningún secreto.
- **Validación automática:** typecheck estricto, tests focalizados/globales, lint, formato, generación en temporal, build selectivo y smoke seguro de exportación/correo sin envío real.
- **Validación manual:** recorrer ayuda/prompts y revisar fallos de template inexistente, navegador ausente y configuración de correo incompleta.
- **Evidencia requerida:** matriz comando→casos, salidas/códigos, inventario antes/después y ausencia de artefactos.
- **Riesgos y reversión:** alterar resolución de entrypoints o interacción CLI; migrar helper y consumidor juntos y conservar fixtures temporales.
- **Exclusiones específicas:** no enviar correo real, no abrir navegador y no rediseñar la CLI.
- **Implementador:** perfil TypeScript/CLI, alto.
- **Revisor independiente:** revisor técnico de CLI/filesystem.
- **Condición de escalamiento:** cambia un comando público, requiere credenciales o modifica el comportamiento de exportación.

### MHB-32 — Servidor Vite y APIs en TypeScript

- **Objetivo observable:** convertir plugins, APIs y servicios Vite a TypeScript estricto, desacoplando transformaciones monolíticas y organizando carpetas de servicios, preservando rutas, payloads, caché y render.
- **Superficies autorizadas:** `scripts/vite/**`, `vite.config.*`, tests, declaraciones/imports y documentación de endpoints.
- **Dependencias y precondiciones:** MHB-31 completada y contratos TypeScript del núcleo disponibles.
- **Pasos técnicos:**
  - Migrar librerías y servicios antes que APIs/plugins.
  - **Refactor integrado en `scripts/vite/services/`:** modularizar `component-preview-transforms.js` (270 líneas) dividiendo las diferentes transformaciones en módulos específicos bajo un subdirectorio `transforms/`.
  - **Arquitectura de carpetas en `scripts/vite/services/`:** agrupar los 15 archivos planos en subdirectorios temáticos por responsabilidad (`cache/`, `catalog/`, `transforms/`).
  - Modelar request/response, payloads versionados, dependencias inyectadas, caché y errores como uniones discriminadas; mantener validación runtime de entradas; actualizar Vite config y cada importador; probar endpoints con temporales.
- **Criterios de aceptación:**
  - Ningún archivo fuente no-test supera 250 líneas; ningún directorio supera 8 archivos fuente sin subdirectorio.
  - No quedan `.js`/`.mjs` propios en `scripts/vite/**` ni en la configuración Vite; rutas, status, headers y payloads permanecen compatibles; caché y render producen el mismo output.
- **Validación automática:** typecheck estricto, tests Vite/API, suite global, lint, formato, build, validación email y integración MHB-20.
- **Validación manual:** revisar errores 4xx/5xx, invalidación de caché y render de un template y un componente.
- **Evidencia requerida:** inventario antes/después, tabla endpoint→contrato→test, comparación de payloads y hashes de output.
- **Riesgos y reversión:** hacer confiable por tipos un payload externo no validado o romper middleware; conservar guards y migrar por cadena servicio→API→plugin.
- **Exclusiones específicas:** no cambiar rutas, esquema público, estrategia de caché ni UI.
- **Implementador:** perfil TypeScript/Vite, alto.
- **Revisor independiente:** revisor backend/Vite.
- **Condición de escalamiento:** exige versionar un endpoint, cambiar payload o alterar el pipeline Maizzle/Handlebars.

### MHB-33 — Dashboard web en TypeScript

- **Objetivo observable:** convertir Home, Preview, Library y utilidades compartidas a TypeScript estricto, modularizando `library/main.js` y controles de vista, sin cambio visual ni funcional.
- **Superficies autorizadas:** `src/web/**`, tests, HTML que referencia entrypoints, declaraciones browser y documentación de rutas; solo imports necesarios en plugins ya migrados.
- **Dependencias y precondiciones:** MHB-28, MHB-32 y MHB-35 completadas; superficies web modularizadas, utilidades shared consolidadas y contratos API tipados.
- **Pasos técnicos:**
  - Migrar por subcarpetas/features en commits independientes (`src/web/shared` y Home → Library → Preview); estandarizar imports con extensión `.ts` explícita.
  - **Refactor integrado en `src/web/features/library/`:** dividir `main.js` (233 líneas) en módulos dedicados de gestión de estado (`state.ts`) y controlador (`controller.ts`) bajo `modules/`.
  - **Refactor integrado en `src/web/features/preview/`:** modularizar `view-mode-controls.js` (256 líneas) separando el toggle de vista del formateo/escapado HTML; modularizar `theme-toggle-component.js` (162 líneas) separando storage y manipulación de DOM.
  - Tipar elementos DOM con helpers genéricos, eventos, storage, iframes, estados de render, editor CDN, HMR y respuestas API; convertir tests junto con cada módulo; actualizar entrypoints HTML sin renombrar IDs/clases/ARIA; validar descenso de inventario tras cada feature.
- **Criterios de aceptación:**
  - Ningún archivo fuente no-test supera 250 líneas.
  - Consumo estricto y unificado de utilidades centralizadas (`storage-keys.ts`, `dom-helpers.ts`, `http-helpers.ts`).
  - No quedan `.js`/`.mjs` propios bajo `src/web/**`; `strict` pasa sin `@ts-ignore`; Home, Preview y Library mantienen comportamiento, accesibilidad, temas, responsive e aislamiento de iframe.
- **Validación automática:** typecheck estricto, suite global, lint, formato, build, validación email, `lint:contrast`, `a11y-check`, hashes de `dist/*.html` y control de inventario.
- **Validación manual:** recorrer Home/Preview/Library en 375, 768 y 1440 px, dark/light; verificar editor, HMR, render/source, viewport, save/reset, copy/download, búsqueda y preview de componentes.
- **Evidencia requerida:** inventario antes/después, matriz flujo→test/recorrido, hashes, capturas de los seis tamaños/temas y lista de contratos DOM preservados.
- **Riesgos y reversión:** casts DOM que oculten nodos ausentes o divergencia visual; usar helpers que fallen de forma accionable y migrar por feature en commits recuperables.
- **Exclusiones específicas:** no introducir React/JSX, no rediseñar, no cambiar IDs/clases/ARIA ni tocar HTML de email dentro de iframes.
- **Implementador:** perfil TypeScript/frontend, alto.
- **Revisor independiente:** revisor UI distinto con recorrido manual completo.
- **Condición de escalamiento:** requiere framework, cambio visual, endpoint nuevo o modificación del output email.

### MHB-34 — Cierre total y modo estricto TypeScript

- **Objetivo observable:** eliminar la compatibilidad JavaScript transitoria, sanear utilidades residuales y dejar el repositorio propio completamente migrado a TypeScript estricto con arquitectura de carpetas validada.
- **Superficies autorizadas:** `scripts/ai/**`, configuraciones raíz restantes, tests/imports residuales, `package.json`, `tsconfig*.json`, ESLint/lint-staged, documentación y control de inventario.
- **Dependencias y precondiciones:** MHB-33 completada y conteo residual limitado a esta superficie.
- **Pasos técnicos:**
  - **Refactor y reorganización shared:** evaluar y mover utilidades agnósticas de `scripts/ai/common/` (`hashing.mjs`, `gitignore.mjs`) a `scripts/shared/` para unificar el tooling.
  - **Auditoría arquitectónica:** auditar y validar que todo el árbol de archivos cumpla la regla de ≤250 líneas y ≤8 archivos fuente por directorio (incluyendo `scripts/esp/`).
  - Verificar previamente la compatibilidad de loaders de configuración para herramientas que no usan Vite (`maizzle`, `postcss`, `tailwind`); migrar automatizaciones AI y configuraciones raíz restantes; actualizar todas las referencias documentales y comandos; eliminar `tsconfig.strict.json` y activar `strict: true` directamente en `tsconfig.json`; eliminar `allowJs`/`checkJs`; activar `strict`, `noImplicitAny` y `strictNullChecks` como gate global único; ejecutar `bun run check:inventory --require-zero` como gate de bloqueo obligatorio; ejecutar la matriz completa desde instalación congelada.
- **Criterios de aceptación:**
  - Todo el árbol de directorios del proyecto respeta los límites de ≤250 líneas y ≤8 archivos fuente por carpeta.
  - `rg --files -g '*.js' -g '*.mjs'` no devuelve código propio dentro del alcance; no existen imports rotos ni extensiones antiguas documentadas; el typecheck global estricto, suite, build, validadores y sincronización de agentes quedan verdes; `check:inventory --require-zero` finaliza con código 0.
- **Validación automática:** `bun install --frozen-lockfile`, lint, typecheck estricto, test, formato, build, `validate-email`, `lint:contrast`, `a11y-check`, `agents:check`, `check:inventory --require-zero` y `git diff --check`.
- **Validación manual:** revisar comandos públicos, configuración de cada herramienta, recorridos UI de MHB-33 y output transaccional/marketing.
- **Evidencia requerida:** inventario final cero (`--require-zero`), matriz completa de gates, hashes finales, lista de comandos/documentos actualizados y diff acumulado por ID.
- **Riesgos y reversión:** cerrar prematuramente con excepciones ocultas o romper tooling auxiliar; ninguna excepción cuenta como cierre y cada ID previo permanece revertible por separado.
- **Exclusiones específicas:** no introducir React, no cambiar comportamiento de producto y no publicar versión/tag/release dentro de este ID.
- **Implementador:** perfil TypeScript/tooling transversal, alto.
- **Revisor independiente:** revisor técnico final distinto de los implementadores.
- **Condición de escalamiento:** queda cualquier excepción JavaScript, falla un gate global o una herramienta exige conservar wrapper no TypeScript.

## Fases

### Fase C — Evidencia para la puerta de calidad

- **Hallazgos que resuelve:** integración, baseline de tipos/rendimiento, accesibilidad y clientes reales.
- **IDs incluidos:** MHB-13, MHB-14, MHB-19 y MHB-20.
- **Entregables:** integración reproducible, baseline completo de tipos, mediciones y matriz de pruebas manuales.
- **Riesgos:** afirmar evidencia de clientes sin pruebas; incluir secretos en capturas o documentación.
- **Criterio de salida:** MHB-20, MHB-13 y MHB-14 están cerradas con evidencia enlazable; el repositorio está preparado para convertir capas sin diagnósticos heredados.

### Fase D — Evolución opcional y mantenimiento

- **IDs incluidos:** MHB-23 es opcional; MHB-28 es requerido. MHB-26 y MHB-27 se ejecutaron en esta fase y están `Completada`.
- **Nota de alcance:** no es una fase solo opcional. La validación automatizada de accesibilidad/contraste y la mantenibilidad del código web son requeridas: no añaden producto, pero sostienen un dashboard verificable y mantenible.
- **Criterio de salida:** cada opcional aprobado cumple su propia aceptación; una demo accesible permite verificación, pero no equivale a publicar el caso como destacado. Los IDs requeridos cumplen su aceptación completa, sin excepción por ser trabajo interno.

#### Fase E — Migración completa a TypeScript

- **IDs incluidos:** MHB-35, MHB-29, MHB-30, MHB-31, MHB-32, MHB-33 y MHB-34.
- **Entregables:** utilidades compartidas consolidadas (MHB-35), tooling mixto temporal, núcleo, CLI, servidor y web convertidos por capas; saneamiento de deuda y arquitectura modular; cierre global estricto sin JavaScript propio residual.
- **Riesgos:** mezclar renombres con cambios funcionales, perder compatibilidad de loaders o ocultar límites runtime con tipos estáticos.
- **Criterio de salida:** MHB-34 confirma inventario JavaScript propio en cero, límites de tamaño y carpetas cumplidos, typecheck estricto y matriz global verde.

### Fase F — Release y demostración

- **IDs incluidos:** MHB-15 y, si se aprueba, MHB-16.
- **Entregables:** documentación y release posterior coherentes con la migración completada; demo candidata opcional y verificable.
- **Riesgos:** publicar antes del cierre total o presentar evidencia no sustentada.
- **Criterio de salida:** MHB-15 está cerrada; MHB-16 cumple su aceptación cuando sea requerida o aprobada.

## Contrato obligatorio de cierre

Cada elemento debe conservar en el contrato transferido objetivo, archivos, pasos, dependencias, aceptación, pruebas automáticas, validación manual, riesgos, exclusiones y evidencia esperada. Una skill puede añadir controles, pero no sustituir esos campos ni rebajar su aceptación.

### Estados y revisión independiente

1. `Pendiente`: dependencias o autorización todavía no satisfechas.
2. `En progreso`: implementador asignado y propiedad de archivos registrada.
3. `En revisión`: implementación terminada; se registran diff, comandos, resultados, desviaciones y riesgos. El implementador no puede marcarla `Completada`.
4. `Bloqueada`: un control obligatorio falla o falta evidencia; no se inicia la tarea dependiente.
5. `Completada`: un revisor independiente confirma aceptación, diff, pruebas, lint, typecheck/build cuando correspondan y ausencia de cambios fuera de alcance; el orquestador dicta el veredicto.

### Matriz mínima de comprobación

| IDs    | Prueba automática mínima                                                            | Validación manual                                                                         | Evidencia de cierre                                                                      |
| ------ | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| MHB-19 | Positivo/negativo por regla y casos felices/borde por helper crítico.               | Revisar que las fixtures no prueben implementación interna irrelevante.                   | Inventario regla/helper→tests.                                                           |
| MHB-20 | Integración temporal de build, render, caché y exportación HTML.                    | Revisar output final de un caso transaccional y uno marketing.                            | Resultados de flatten, delimitadores, gate y caché.                                      |
| MHB-13 | Typecheck ampliado y medición repetida.                                             | Revisar entorno y variabilidad.                                                           | Tabla Bun/Node/SO, comando, repeticiones y resultados.                                   |
| MHB-14 | Validadores disponibles; no sustituyen pruebas reales.                              | Teclado/lector y Gmail/Outlook/Apple Mail con protocolo fechado.                          | Matriz por cliente/criterio, capturas sin secretos y limitaciones.                       |
| MHB-15 | Lint, suite, build y consistencia de versión.                                       | Revisar README, capturas, changelog y release antes de publicar.                          | SHA, tag, URL de release y diff final.                                                   |
| MHB-16 | Smoke del build estático y enlaces.                                                 | Navegar demo solo lectura en desktop/móvil.                                               | URL candidata, SHA desplegado y checklist.                                               |
| MHB-23 | Tests y validadores aplicables por componente.                                      | Aparición y edición en `/library`.                                                        | Schema, captura y build verde.                                                           |
| MHB-28 | Suite completa, `lint:contrast`, `a11y-check` y test de `ef-skeleton`.              | Seis combinaciones ancho×tema en Home/Preview/Library; skeletons, tabs y viewport activo. | Tabla de líneas, hashes `dist/` iguales, diff por bloque y recuento de `!important`/IDs. |
| MHB-35 | Tests unitarios de format-helpers, suite completa, grep de cero strings duplicados. | Comprobar alternancia dark/light y persistencia de selección en preview y library.        | Diff limpio, reporte de grep y suite verde sin errores.                                  |
| MHB-29 | Typecheck unificado + estricto y piloto `.ts`.                                      | Revisar resolución ESM y loaders de herramientas.                                         | Matriz herramienta→loader y conteo inicial por capa.                                     |
| MHB-30 | Typecheck estricto, tests de núcleo, build y validadores.                           | Comparar outputs transaccional y marketing.                                               | Inventario por carpeta, hashes y tabla contrato→test.                                    |
| MHB-31 | Tests CLI/export/mail y smokes seguros sin credenciales.                            | Recorrer prompts, ayuda y fallos accionables.                                             | Matriz comando→casos, códigos de salida e inventario.                                    |
| MHB-32 | Tests Vite/API e integración MHB-20.                                                | Revisar endpoints, caché y render.                                                        | Tabla endpoint→contrato→test y comparación de payloads.                                  |
| MHB-33 | Typecheck web, suite, contraste, accesibilidad y hashes.                            | Home/Preview/Library en seis combinaciones ancho×tema.                                    | Matriz flujo→evidencia, capturas e inventario web cero.                                  |
| MHB-34 | Gate de cero `.js`/`.mjs`, typecheck estricto y matriz global.                      | Revisar comandos, tooling, UI y outputs finales.                                          | Inventario final cero, gates completos y referencias actualizadas.                       |

### Gates globales

- Todos los cambios: `bun run format:check` y `git diff --check`.
- Markdown: `bun run lint:md`.
- JavaScript/TypeScript/configuración: `bun run lint` y `bun run typecheck` según alcance.
- Templates/layouts/CSS/build: `bun run build` y `bun run validate-email`; ERROR bloquea y WARNING/INFO no se ocultan.
- UI/API: pruebas automatizadas más `bun run dev` y recorrido manual cuando corresponda.
- Antes de cerrar una fase: instalación congelada, lint, typecheck, test, build y formato verdes en la versión de Bun fijada por el proyecto.
- Un control obligatorio `Fallido` o `No ejecutado` impide `Completada`, salvo excepción explícita aprobada por el orquestador con riesgo y nueva acción.

## Orden de ejecución

1. Completar MHB-20; luego ejecutar MHB-13 y MHB-14 para cerrar la evidencia base de Fase C.
2. Ejecutar MHB-28 después de MHB-20; MHB-23 permanece opcional y separado.
3. Ejecutar MHB-35 (consolidación de shared y deduplicación) antes de migrar el núcleo.
4. Ejecutar secuencialmente MHB-29, MHB-30, MHB-31 y MHB-32; MHB-33 espera además el cierre de MHB-28, MHB-32 y MHB-35.
5. Cerrar la migración con MHB-34; ninguna excepción `.js`/`.mjs` permite avanzar a release.
6. Preparar MHB-15 solo tras MHB-14 y MHB-34; decidir MHB-16 después de esa release candidata.
7. Someter el producto a revisión final independiente antes de declararlo listo para presentarse como caso de portafolio.

### Política de ramas y versiones conservada

- Una tarea por rama `feature/<id-en-minusculas>` y PR directo a `master`; no se mezclan tareas ni se incrementa versión por cada una.
- `v1.2.0` es el baseline publicado. Cualquier versión, tag o release posterior requiere evidencia de su alcance y aprobación explícita del orquestador.
- Tag, CHANGELOG, versión y release deben apuntar al mismo alcance. Ningún subagente publica o mueve referencias sin aprobación del orquestador.
- `dist/` permanece versionado; las capturas son entregables documentales. `task-verification` debe evitar commits accidentales fuera de tarea.

## Criterios para estar listo para portafolio

- CI cubre las rutas relevantes; lint, typecheck, pruebas, build y formato están verdes en la matriz declarada.
- Todo el código propio del alcance está en TypeScript estricto y el guard de inventario impide reintroducir `.js`/`.mjs`.
- Los templates de producto, preview seguro y descarga de HTML funcionan y están verificados.
- Hay evidencia fechada de accesibilidad, rendimiento y clientes de correo.
- La documentación, versión, tag y release posterior concuerdan; existe una demostración candidata o instrucciones reproducibles para el flujo.
- MHB-16 sigue opcional solo si la puerta final acepta la demostración local reproducible; si esa evidencia es insuficiente, pasa a requerida antes de `Listo para portafolio`.
- La verificación final aprueba el caso. Publicarlo en una superficie externa del portafolio es una acción posterior y separada.

## Impacto de nombre o combinación de repositorios

No se cambia el repositorio ni se combina con otro caso. `EmailForge Toolkit` es el nombre de producto; `vite-mhb-email` conserva su slug, URL y paquete históricos. Toda release posterior usa ambos nombres de forma coherente.

## Diseño de orquestación

Las skills son contratos de procedimiento; los subagentes son ejecuciones temporales. Cada subagente recibe IDs, skills obligatorias, archivos exclusivos, controles y condición de escalamiento. Ninguna identidad se persiste como agente permanente.

### Fase C — Calidad y evidencia

| Línea                   | Skills obligatorias                               | Implementador y propiedad            | Revisor                       | Controles                                          | Escalar cuando                                                    |
| ----------------------- | ------------------------------------------------- | ------------------------------------ | ----------------------------- | -------------------------------------------------- | ----------------------------------------------------------------- |
| MHB-19/MHB-20 pruebas   | `task-verification`, skills del dominio probado   | Perfil alto; tests y fixtures        | Revisor técnico independiente | Inventario de cobertura e integración temporal     | Requiera binarios externos o cambios productivos para testear.    |
| MHB-13 baseline tipos   | `email-refactor-type-safety`, `task-verification` | Perfil alto; JSDoc/config/mediciones | Revisor técnico               | Typecheck JS completo y protocolo reproducible     | Exija cambio funcional, contrato público o dependencia nueva.     |
| MHB-14 evidencia manual | `email-compatibility`, `email-preview-dashboard`  | Perfil alto; matriz/capturas         | Orquestador                   | Protocolo fechado, clientes reales y accesibilidad | No haya acceso a cliente/dispositivo o aparezcan datos sensibles. |

### Fase D — Evolución y mantenimiento

| Línea                 | Skills obligatorias                                                          | Implementador y propiedad                     | Revisor                  | Controles                                            | Escalar cuando                                                               |
| --------------------- | ---------------------------------------------------------------------------- | --------------------------------------------- | ------------------------ | ---------------------------------------------------- | ---------------------------------------------------------------------------- |
| MHB-23 componentes    | `email-compatibility`, `email-preview-dashboard`                             | Perfil medio; partials/schemas/library        | Revisor email/UI         | Build, schema, library y visual                      | Amplíe el alcance hacia un builder.                                          |
| MHB-28 mantenibilidad | `email-refactor-type-safety`, `email-preview-dashboard`, `task-verification` | Perfil alto; superficies exclusivas de MHB-28 | Revisor UI independiente | Gates, hashes de `dist/` y recorrido visual completo | Exija cambio visual, afecte `dist/` o toque una superficie fuera de alcance. |

### Fase E — Migración TypeScript

| Línea            | Skills obligatorias                                                            | Implementador y propiedad                     | Revisor                  | Controles                                          | Escalar cuando                                              |
| ---------------- | ------------------------------------------------------------------------------ | --------------------------------------------- | ------------------------ | -------------------------------------------------- | ----------------------------------------------------------- |
| MHB-35 shared    | `email-project-stack`, `email-refactor-type-safety`, `task-verification`       | Perfil medio; utils/shared/features afectadas | Revisor técnico          | Tests format-helpers, suite, grep deduplicación    | Exige cambiar APIs públicas o esquemas de datos.            |
| MHB-29 base TS   | `email-project-stack`, `email-refactor-type-safety`, `task-verification`       | Perfil alto; configs/tooling/declaraciones    | Revisor técnico          | Piloto mixto, loaders e inventario                 | Un loader exige cambiar CLI o añadir dependencia runtime.   |
| MHB-30 núcleo TS | `email-project-stack`, `email-compatibility`, `email-refactor-type-safety`     | Perfil alto; shared/build/ESP/validators      | Revisor build/email      | Strict, tests, build, validadores y hashes         | Cambia HTML, delimitadores o severidad de validación.       |
| MHB-31 CLI TS    | `email-project-stack`, `email-quality-gates`, `email-refactor-type-safety`     | Perfil alto; CLI/export/generators/mail       | Revisor CLI/filesystem   | Comandos, códigos, temporales y smokes seguros     | Cambia CLI pública, requiere credenciales o abre navegador. |
| MHB-32 Vite TS   | `email-project-stack`, `email-preview-dashboard`, `email-refactor-type-safety` | Perfil alto; Vite APIs/services/plugins       | Revisor backend/Vite     | Endpoints, caché, integración y payloads           | Exige versionar API o alterar Maizzle/Handlebars.           |
| MHB-33 web TS    | `email-preview-dashboard`, `email-refactor-type-safety`, `task-verification`   | Perfil alto; `src/web/**`                     | Revisor UI independiente | Strict, suite, a11y, contraste, hashes y recorrido | Exige React, cambio visual, endpoint o cambio de email.     |
| MHB-34 cierre TS | `email-project-stack`, `email-quality-gates`, `task-verification`              | Perfil alto; AI/configs/gates/docs residuales | Revisor técnico final    | Inventario cero, strict global y matriz completa   | Queda una excepción JS/MJS o falla cualquier gate global.   |

### Fase F — Release y demo

| Línea          | Skills obligatorias                                                                           | Implementador y propiedad            | Revisor     | Controles                                 | Escalar cuando                                          |
| -------------- | --------------------------------------------------------------------------------------------- | ------------------------------------ | ----------- | ----------------------------------------- | ------------------------------------------------------- |
| MHB-15 release | `task-verification`                                                                           | Perfil medio; docs/version/changelog | Orquestador | Suite, inventario TS, tag y release       | Antes de publicación, tag o cambio de versión.          |
| MHB-16 demo    | `email-project-stack`, `email-preview-dashboard`, skill de despliegue si se aprueba proveedor | Perfil alto; build/config de deploy  | Orquestador | Smoke, URL, SHA y ausencia de divergencia | Requiera proveedor, credenciales o publicación externa. |

El orquestador conserva integración, decisiones transversales, cambios destructivos, versiones, releases y veredictos. Solo paraleliza líneas con archivos exclusivos y al menos dos ámbitos realmente independientes.
