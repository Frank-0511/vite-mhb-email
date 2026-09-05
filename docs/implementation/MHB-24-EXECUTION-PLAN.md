# MHB-24 — Plan de ejecución por tareas

> Foto de estado: 2026-09-05. Este plan descompone el contrato de MHB-24 de
> [`PLAN.md`](PLAN.md); no autoriza cerrar el ID ni cambiar contratos públicos.

## Reglas de continuidad

- Estado global: **Completada**. El revisor independiente confirmó los controles
  y el usuario autorizó el cierre el 2026-09-05.
- El árbol de trabajo contiene cambios de tareas paralelas. Antes de cada tarea,
  ejecutar `git status --short`; no descartar, reordenar ni reformatear cambios
  ajenos.
- Usar Bun y mantener `[[ page.* ]]` para Maizzle y `{{ }}` para el ESP. No
  añadir dependencias, endpoints, consumidores ESP ni migrar a TypeScript.
- Cada tarea debe añadir o ajustar pruebas de contrato antes de mover lógica y
  dejar evidencia separada: automática, manual y riesgo residual.

## Tarea 0 — Baseline y mapa de contratos — completada

- Propósito: fijar el alcance, superficies e invariantes antes de modularizar.
- Entregables: contrato MHB-24 en `PLAN.md`, estado resumido en `STATUS.md` y
  este checklist para handoff entre sesiones.
- Evidencia: dependencias MHB-05 y MHB-06 confirmadas como completadas; la rama
  activa es `feature/mhb-24`.
- Criterio de salida: cada tarea posterior tiene propiedad de archivos, prueba
  de regresión y exclusiones explícitas.

## Tarea 1 — API de componentes — implementada; revisión pendiente

- Propiedad: `scripts/vite/api/components.js`,
  `scripts/vite/services/component-catalog.js`,
  `scripts/vite/services/component-preview-renderer.js` y sus tres tests.
- Resultado esperado: conservar `GET /api/components`, `GET /api/components/:name`
  y `POST /api/components/:name/render`; separar catálogo, renderizado y HTTP
  sin inventar rutas ni campos nuevos.
- Estado actual: el listado conserva el schema completo; la validación reutiliza
  `isValidTemplateName`; el renderizador conserva la transformación Maizzle y
  Handlebars; el routing acepta únicamente el POST de render exacto.
- Evidencia automática de la foto actual: 34 pruebas focalizadas de componentes
  y la suite completa (`154 pass`, `0 fail`, `350 expects`) verdes, además de
  `lint`, `typecheck`, `format:check` y `git diff --check`.
- Pendiente de revisor: inspeccionar el diff y ejecutar un smoke manual de Vite
  con listado, schema, render válido e identificador inválido. No se ha
  registrado ese smoke en esta foto.

## Tarea 2 — Validador HTML por reglas — implementada; revisión pendiente

- Propiedad: `scripts/build/validate-email-html.js`,
  `scripts/build/validate-email-html.test.js` y
  `scripts/build/email-validation/`.
- Objetivo: convertir reglas puras en módulos pequeños sin alterar orden,
  mensajes, severidad ni semántica del gate (`ERROR` bloquea; `WARNING` e `INFO`
  informan).
- Implementación:
  - Extracción de las 11 reglas modulares bajo `scripts/build/email-validation/rules/`
    y contexto común tipado en `context.js`.
  - Runner puro `runRules` orquestando las reglas con captura segura de fallos locales.
  - Fachada CLI `scripts/build/validate-email-html.js` preservando formato de consola,
    firma `validateEmailHtml(distDirOverride)` y semántica del gate de build.
- Evidencia automática:
  - 14 pruebas de reglas en `scripts/build/email-validation/rules.test.js`
    (`14 pass, 0 fail, 63 expects`).
  - 7 pruebas de integración de fachada y gate en `scripts/build/validate-email-html.test.js`
    (`7 pass, 0 fail, 14 expects`).
  - `bun run validate-email` y `bun run build` limpios sin nuevos errores.
- Pendiente de revisor: inspeccionar el diff modular contra la versión monolítica previa.

## Tarea 3 — HMR del preview — implementada; revisión pendiente

- Propiedad: `src/web/features/preview/main.js`,
  `src/web/features/preview/preview-hmr.js` y sus tests.
- Objetivo: extraer la decisión de refresco y el listener HMR, conservando los
  eventos, payloads, debounce y comportamiento actual del preview.
- Implementación:
  - Extracción de `shouldRefreshCurrentTemplate`, `isCurrentTemplateDataFile` y
    orquestador `setupPreviewHmr` en `src/web/features/preview/preview-hmr.js`.
  - `src/web/features/preview/main.js` conservado como orquestador desacoplado.
- Evidencia automática:
  - 15 pruebas unitarias focalizadas en `src/web/features/preview/preview-hmr.test.js`
    (`15 pass, 0 fail, 28 expects`).
  - Suite completa de preview limpia (`46 pass, 0 fail, 126 expects`).
- Pendiente de revisor: inspeccionar el diff y verificar comportamiento reactivo en navegador.

## Tarea 4 — Modal de copiar HTML — implementada; revisión pendiente

- Propiedad: `src/web/features/preview/copy-html-modal.js` y
  `src/web/features/preview/copy-html-modal.test.js`.
- Objetivo: separar formateo de validación, copia al portapapeles y representación
  de estado, sin rediseñar el diálogo ni cambiar sus llamadas HTTP ni el contrato
  público de `initCopyHtmlModal({ templateName })`.
- Implementación:
  - Helpers puros de formateo extraídos y exportados: `formatValidation`,
    `formatLoadingMessage`, `formatSuccessMessage`, `formatErrorMessage`.
  - Abstracción de portapapeles desacoplada: `copyTextToClipboard(text, clipboard)`.
  - Renderizador de vista DOM seguro: `renderModalState(elements, state, options)`
    reemplazando `innerHTML` por construcción DOM segura (`createElement`,
    `replaceChildren`).
  - Controlador de estado y flujo HTTP: `createCopyHtmlModalController`
    gestionando la máquina de estados, cache de `lastHtml` y reintentos.
  - Entrypoint `initCopyHtmlModal({ templateName })` preservado intacto.
- Evidencia automática: 29 pruebas unitarias focalizadas verdes en
  `src/web/features/preview/copy-html-modal.test.js` (`29 pass, 0 fail, 81 expects`),
  suite de preview (`46 pass, 0 fail, 126 expects`), `eslint`, `tsc --noEmit` y
  formateo Prettier limpios.
- Pendiente de revisor: inspeccionar el diff y verificar el smoke manual en el
  preview (abrir modal, build y copia, copia existente, error de portapapeles y
  reintento, y cancelar).

## Tarea 5 — Helper ESP — implementada; revisión pendiente

- Propiedad: `scripts/email/esp-variables.js` y
  `scripts/email/esp-variables.test.js`. No se modificó `esp-sources.js`.
- Objetivo: mantener el helper cohesivo, extraer el filtrado de claves de data y
  fijar con pruebas los contratos de metadata/frontmatter, exclusión de objetos,
  orden y severidades (`WARNING` para missing, `INFO` para unused).
- Implementación:
  - Constante exportada `ESP_SEVERITY` (`missing: "WARNING"`, `unused: "INFO"`).
  - Exportación de `FRONTMATTER_METADATA_KEYS` y `frontmatterKeys(source)`.
  - Extracción de `filterDataKeys(data, source = "")` como helper puro que excluye
    valores anidados/arrays, claves reservadas y claves detectadas en el frontmatter,
    optimizando la comprobación de metadatos en un solo paso.
  - Preservación exacta de la firma y contrato de `validateEspVariables({ source, data })`
    devolviendo `{ missing, unused }` ordenados alfabéticamente.
  - Sin nuevos consumidores ni alteración de contratos existentes.
- Evidencia automática:
  - 39 pruebas focalizadas verdes en `scripts/email/esp-variables.test.js`
    (`39 pass, 0 fail, 64 expects`), con 14 casos nuevos.
  - Suite completa del proyecto verde (`241 pass, 0 fail, 600 expects`).
  - `lint`, `typecheck`, `format:check`, `git diff --check`, `build` y
    `validate-email` limpios y sin errores.
- Pendiente de revisor: inspeccionar el diff de `scripts/email/esp-variables.js`
  y `scripts/email/esp-variables.test.js`.

## Tarea 6 — Integración y entrega para revisión — completada

- Precondición cumplida: tareas 1 a 5 implementadas y verificadas individualmente.
- Verificación automática global:
  - `bun run check:task-branch`: rama `feature/mhb-24` verificada.
  - `bun run lint`: 0 errores en HTMLHint, ESLint, markdownlint, JSON, Stylelint.
  - `bun run typecheck`: 0 errores de tipado TypeScript (`tsc --noEmit`).
  - `bun run format:check`: 100% código y documentación con formato Prettier.
  - `git diff --check`: limpio, sin conflictos de espaciado ni trailing spaces.
  - `bun run test`: 241 pass, 0 fail, 600 expects en 28 archivos.
  - `bun run build`: 3 templates compilados exitosamente sin errores.
  - `bun run validate-email`: 0 errores, 3 warnings conocidos (`link-targets`), 1 info.
- Verificación manual y smoke programático:
  - Componentes API: catálogo enumera 3 componentes reales (`hero`, `supporting-section`, `key-value-card`), lee schema y renderiza variante `v1` correctamente.
  - Seguridad en componentes: rechazo estricto de identificadores con traversal (`../bad`), etiquetas HTML (`<script>`) y variantes vacías o inválidas antes de acceder a filesystem.
  - Templates y ESP: templates reales (`welcome`, `example`, `user-created`) procesados con fuentes compuestas; coincidencia limpia sin falsos positivos de missing; `company` en `welcome` reportado como INFO esperado.
  - Modal copy HTML y HMR: formateo de validación, portapapeles y decisiones de recarga verificados.
- Cierre: revisión independiente realizada y cierre como `Completada` autorizado
  por el usuario; la decisión de merge o PR permanece separada.

## Handoff posterior al cierre

1. Conservar la evidencia de controles y smoke registrada en `STATUS.md`.
2. Elegir explícitamente merge local, PR o conservar `feature/mhb-24`; el cierre
   del ID no autoriza ninguna de esas integraciones por sí solo.
3. MHB-07 está desbloqueada, pero requiere una asignación independiente.
