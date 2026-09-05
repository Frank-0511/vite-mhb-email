# MHB-08 — Plan de ejecución por tareas

> **Para agentes ejecutores:** usar `superpowers:subagent-driven-development`
> (recomendado) o `superpowers:executing-plans` para ejecutar una tarea por vez.
> Los pasos con checkbox constituyen el registro de avance. Este documento no
> autoriza por sí solo implementación, commit, PR, merge, publicación ni cierre.

**Objetivo:** descargar desde el preview `<template>.html` equivalente al HTML
final del flujo oficial, con nombre seguro y errores recuperables.

**Arquitectura:** reutilizar `POST /api/copy-html` como única fuente de HTML
final. Una utilidad de navegador aislada valida el nombre, crea el Blob y libera
el object URL; el controlador existente del diálogo solamente coordina estado,
petición y descarga. La vista trata por igual las cuatro acciones para impedir
operaciones concurrentes.

**Stack:** Bun 1.3.13, JavaScript ESM con JSDoc, Vite, Maizzle, Handlebars y
`bun test` con doubles de DOM/Blob/URL.

**Especificación:** [`MHB-08-DESIGN.md`](MHB-08-DESIGN.md),
[`PLAN.md`](PLAN.md) y el contrato vigente de [`copy-html.js`](../../scripts/vite/api/copy-html.js).

## Restricciones globales

- Confirmar que MHB-07 está integrado antes de iniciar y registrar MHB-08 como
  `En progreso` mediante `task-status-management`; no activar otro ID ni
  declarar `Completada` sin revisor UX/API independiente.
- Crear o cambiar a `feature/mhb-08` y ejecutar `bun run check:task-branch`
  antes de editar. Revisar `git status --short` en cada tarea y preservar trabajo
  ajeno.
- Usar Bun y ESM; no añadir dependencias, endpoints, ZIP, storage, persistencia,
  envío a ESP ni TypeScript.
- Reutilizar sin cambiar `/api/copy-html`: `build: true` devuelve HTML del build
  selectivo en memoria y `build: false` devuelve `dist/<template>.html`.
- Mantener `[[ page.* ]]`, `{{ }}`, el header `X-ESP-Validation`, el iframe y
  el flujo de copia/reintento existentes. No descargar desde el iframe.
- El nombre de archivo se deriva solo del template validado: `${templateName}.html`.
  Rechazar entradas que no cumplan `/^[a-z0-9-]+$/`; nunca aceptar extensión,
  ruta, traversal, barra, backslash ni nombre desde una respuesta API.

## Mapa de archivos e interfaces

| Archivo                                                 | Acción                                  | Responsabilidad                                                            |
| ------------------------------------------------------- | --------------------------------------- | -------------------------------------------------------------------------- |
| `src/web/features/preview/html-download.js`             | Crear                                   | Descarga inyectable y segura mediante Blob/URL/anchor.                     |
| `src/web/features/preview/html-download.test.js`        | Crear                                   | Pruebas del nombre, contenido, MIME, click, revocación y ausencia de APIs. |
| `src/web/features/preview/copy-html-formatters.js`      | Modificar                               | Añadir mensajes de éxito de descarga, sin cambiar los de copia.            |
| `src/web/features/preview/copy-html-formatters.test.js` | Modificar                               | Fijar mensajes de descarga con/sin build y validación ESP.                 |
| `src/web/features/preview/copy-html-view.js`            | Modificar                               | Habilitar/deshabilitar las cuatro acciones sin romper estados de copia.    |
| `src/web/features/preview/copy-html-view.test.js`       | Modificar                               | Cubrir bloqueo y recuperación de botones de descarga.                      |
| `src/web/features/preview/copy-html-modal.js`           | Modificar                               | Añadir `performDownload(build)` y listeners, reutilizando `postJsonFn`.    |
| `src/web/features/preview/copy-html-modal.test.js`      | Modificar                               | Contratos build/existente, fallo de API y fallo de descarga.               |
| `src/web/features/preview/preview.html`                 | Modificar                               | Añadir dos botones de descarga al diálogo existente.                       |
| `src/web/features/preview/copy-html-modal.css`          | No modificar salvo necesidad demostrada | Reusar `.btn-build-copy` y `.btn-copy-existing`; no rediseñar el modal.    |
| `docs/implementation/STATUS.md`                         | Modificar al inicio y entrega           | Evidencia real de MHB-08 y handoff a revisión.                             |

Los contratos a producir son:

```js
// html-download.js
export function isSafeDownloadTemplateName(templateName) {}
export function downloadHtml({ templateName, html, document, urlApi, Blob }) {
  // { ok: true, filename: "welcome.html" } | { ok: false, error: string }
}

// copy-html-formatters.js
export function formatDownloadSuccessMessage(build, validation) {}

// copy-html-modal.js
createCopyHtmlModalController({ templateName, postJsonFn, downloadHtmlFn, renderState });
// añade: performDownload(build) -> Promise<void>
```

`downloadHtml` debe recibir dependencias inyectadas en tests y usar globals solo
en su valor por defecto. El controlador siempre pasa su `templateName` inicial;
no consume `result.template` de la API para construir el filename.

---

### Tarea 0 — Preflight, estado y caracterización de fuente

**Archivos:** modificar solamente `docs/implementation/STATUS.md` tras el
preflight; crear pruebas solo en las rutas de MHB-08.

**Consume:** MHB-07 integrado, `copy-html.js`, `copy-html-modal.js` y el
contrato de MHB-01.

**Produce:** ejecución aislada en `feature/mhb-08` y el registro `En progreso`.

- [ ] **Paso 1: comprobar estado, dependencia y rama.**

  Ejecutar:

  ```bash
  git status --short
  git branch --show-current
  git log --oneline origin/master..HEAD
  bun run check:task-branch
  ```

  Esperado: la rama es `feature/mhb-08`, no hay cambios ajenos absorbidos y
  MHB-07 forma parte de `master`. Si el `STATUS.md` aún contiene un handoff
  anterior, reconciliarlo solo con evidencia de merge autorizada antes de marcar
  MHB-08 activa.

- [ ] **Paso 2: registrar el inicio controlado.**

  Usar `task-status-management` para marcar MHB-08 `En progreso`, con alcance
  limitado a descarga, nombre seguro, modal y tests. No reescribir tablas
  históricas ni tocar estado de otros IDs.

- [ ] **Paso 3: fijar la fuente de HTML con pruebas de controlador.**

  Añadir en `copy-html-modal.test.js` un doble `postJsonFn` que capture el body
  y confirme que una descarga solicita exactamente la ruta existente:

  ```js
  expect(httpCalls).toEqual([
    {
      url: "/api/copy-html?template=welcome",
      body: { build: true },
    },
  ]);
  ```

  La prueba debe configurar `downloadHtmlFn` y probar que recibe
  `templateName: "welcome"` y el mismo `html` retornado por la API. No crear una
  ruta de red nueva ni probar el iframe como fuente.

---

### Tarea 1 — Utilidad de descarga segura y aislada

**Archivos:** crear `html-download.js` y `html-download.test.js`.

**Consume:** `templateName` de MHB-01 y string HTML emitido por `/api/copy-html`.

**Produce:** `isSafeDownloadTemplateName` y `downloadHtml` con resultado
determinista, sin estado global persistente.

- [ ] **Paso 1: escribir pruebas RED de nombre y contenido.**

  Crear doubles mínimos para `document`, `Blob` y `urlApi` e incluir:

  ```js
  test("descarga welcome.html con el HTML recibido y MIME text/html", () => {
    const result = downloadHtml({
      templateName: "welcome",
      html: "<!doctype html><p>Hola</p>",
      document: mockDocument,
      Blob: MockBlob,
      urlApi: mockUrlApi,
    });

    expect(result).toEqual({ ok: true, filename: "welcome.html" });
    expect(createdAnchor.download).toBe("welcome.html");
    expect(createdBlob.parts).toEqual(["<!doctype html><p>Hola</p>"]);
    expect(createdBlob.options).toEqual({ type: "text/html;charset=utf-8" });
    expect(mockUrlApi.revoked).toEqual(["blob:download-1"]);
  });

  test.each(["../escape", "welcome.html", "WELCOME", "two words", "a/b", "a\\b"])(
    "rechaza un nombre de template inseguro: %s",
    (templateName) => {
      expect(downloadHtml({ templateName, html: "<p>x</p>", ...browserDeps })).toEqual(
        expect.objectContaining({ ok: false }),
      );
      expect(mockUrlApi.createObjectURL).not.toHaveBeenCalled();
    },
  );
  ```

  Añadir casos para HTML no string, `Blob`/`URL`/`document` ausentes, excepción
  de `createObjectURL` y excepción de `click`. La prueba de excepción debe
  confirmar que se revoca toda URL que ya haya sido creada.

- [ ] **Paso 2: comprobar que falla.**

  Ejecutar `bun test src/web/features/preview/html-download.test.js`.
  Esperado: fallo por módulo o exports inexistentes, no por un mock incompleto.

- [ ] **Paso 3: implementar el mínimo comportamiento.**

  En `html-download.js`, validar el nombre con el patrón literal de MHB-01 y el
  HTML con `typeof html === "string"`. Crear `new Blob([html], { type:
"text/html;charset=utf-8" })`, asignar el URL al anchor temporal, `download`
  al filename interno, llamar `click()` y revocar URL en `finally`. Devolver un
  objeto `{ ok, filename? | error }`; no lanzar el error original ni exponer el
  contenido HTML en el mensaje.

- [ ] **Paso 4: ejecutar pruebas focalizadas y calidad estática.**

  Ejecutar:

  ```bash
  bun test src/web/features/preview/html-download.test.js
  bun run lint:js
  bun run typecheck
  ```

  Esperado: nombre, Blob, descarga, cleanup y fallos de capacidades quedan
  cubiertos; exports tienen JSDoc.

---

### Tarea 2 — Estado del modal y mensajes de descarga

**Archivos:** modificar `copy-html-formatters.js`,
`copy-html-formatters.test.js`, `copy-html-view.js` y `copy-html-view.test.js`.

**Consume:** `ValidationResult` de build selectivo y cuatro botones opcionales
del diálogo.

**Produce:** mensajes inequívocos para descarga y un renderizador que bloquea
todas las acciones durante una operación.

- [ ] **Paso 1: escribir casos RED de mensaje.**

  Añadir a `copy-html-formatters.test.js`:

  ```js
  expect(formatDownloadSuccessMessage(true, { unused: ["legacy"] })).toBe(
    "✅ Build completado. HTML descargado. ℹ️ Claves sin uso: legacy",
  );
  expect(formatDownloadSuccessMessage(false)).toBe("✅ HTML descargado.");
  ```

  Confirmar que `formatSuccessMessage` sigue devolviendo “copiado al
  portapapeles”; MHB-08 no cambia ese contrato.

- [ ] **Paso 2: escribir casos RED de concurrencia visual.**

  Extender el mock de `copy-html-view.test.js` con `buildAndDownloadBtn` y
  `downloadExistingBtn`. Durante `loading`, los cuatro botones deben tener
  `disabled`; en `success`, `error` e `idle`, los cuatro deben volver a estar
  habilitados. Ejecutar el test focalizado y confirmar fallo por campos no
  gestionados.

- [ ] **Paso 3: implementar sin rediseñar.**

  Añadir `formatDownloadSuccessMessage(build, validation)` reutilizando
  `formatValidation`. En la vista, usar un helper privado que recorra los
  botones existentes y opcionales; si un botón es `null`, se omite. Mantener los
  estados `idle`, `loading`, `success`, `clipboard-error` y `error`, incluido
  el reintento de portapapeles.

- [ ] **Paso 4: ejecutar pruebas focalizadas.**

  Ejecutar:

  ```bash
  bun test src/web/features/preview/copy-html-formatters.test.js
  bun test src/web/features/preview/copy-html-view.test.js
  bun run lint:js
  bun run typecheck
  ```

  Esperado: mensajes correctos, cuatro acciones bloqueadas durante operación y
  contratos de copia intactos.

---

### Tarea 3 — Controlador y botones de descarga

**Archivos:** modificar `copy-html-modal.js`, `copy-html-modal.test.js` y
`preview.html`. No modificar `copy-html.js` ni CSS salvo evidencia de que las
clases existentes no funcionan con la nueva disposición.

**Consume:** `downloadHtml`, `formatDownloadSuccessMessage`, vista extendida y
la respuesta actual `{ success, html, validation? }`.

**Produce:** `performDownload(build)` y dos botones conectados sin afectar
`performCopy`, `retryClipboard`, `lastHtml` ni el endpoint.

- [ ] **Paso 1: escribir pruebas RED de controlador.**

  Agregar las pruebas siguientes, usando inyección de `downloadHtmlFn`:

  ```js
  test("descarga el HTML de build usando el template inicial y el body exacto", async () => {
    const controller = createCopyHtmlModalController({
      templateName: "welcome",
      postJsonFn: () => Promise.resolve({ success: true, html: "<p>final</p>" }),
      downloadHtmlFn: (input) => {
        receivedDownload = input;
        return { ok: true, filename: "welcome.html" };
      },
      renderState,
    });

    await controller.performDownload(true);

    expect(receivedDownload).toEqual({ templateName: "welcome", html: "<p>final</p>" });
    expect(controller.getState()).toBe("success");
  });
  ```

  Añadir pruebas de `build: false`, `{ success: false }`, `html` no string y
  `{ ok: false, error: "..." }`. En cada fallo, `downloadHtmlFn` no debe
  ejecutarse o no debe informar éxito; el estado final debe ser `error`.

- [ ] **Paso 2: ejecutar para confirmar fallo.**

  Ejecutar `bun test src/web/features/preview/copy-html-modal.test.js`.
  Esperado: falla por `performDownload`/`downloadHtmlFn` inexistentes.

- [ ] **Paso 3: implementar el flujo de descarga.**

  Extender `ControllerDeps` con `downloadHtmlFn`, cuyo default es
  `downloadHtml`. Implementar `performDownload(build)` con el mismo
  `postJsonFn` y URL codificada de `performCopy`; validar que `result.success`
  sea true y `result.html` sea string antes de invocar la utilidad. Pasar
  `{ templateName, html }`, ignorando `result.template`. Usar `loading` con
  `formatLoadingMessage(build)`, `success` con
  `formatDownloadSuccessMessage(build, result.validation)` y `error` con
  `formatErrorMessage` ante los demás casos.

  En `preview.html`, añadir dentro de `.copy-html-actions`:

  ```html
  <button id="btn-build-and-download" type="button" class="btn-build-copy">
    Buildear y descargar
  </button>
  <button id="btn-download-existing" type="button" class="btn-copy-existing">
    Descargar HTML existente
  </button>
  ```

  Conservar iconos Lucide y la semántica de los botones de copia actuales. En
  `initCopyHtmlModal`, obtener ambos elementos, pasarlos a `renderModalState` y
  registrar listeners que llamen a `performDownload(true/false)` con el mismo
  catch recuperable de las acciones de copia.

- [ ] **Paso 4: verificar la integración focal.**

  Ejecutar:

  ```bash
  bun test src/web/features/preview/copy-html-modal.test.js
  bun test src/web/features/preview/html-download.test.js
  bun run lint
  bun run typecheck
  bun run format:check
  git diff --check
  ```

  Esperado: copia/reintento sigue verde, ambas rutas de descarga usan la API
  existente y el diff no incluye endpoint, templates ni archivos no mapeados.

---

### Tarea 4 — Validación integral y entrega a revisión

**Archivos:** actualizar el bloque de MHB-08 en `docs/implementation/STATUS.md`
solo con evidencia obtenida.

**Consume:** tareas 0–3 completas y controles focalizados verdes.

**Produce:** MHB-08 `En revisión`, con evidencia automática, manual, archivos
descargados comparados y riesgos residuales. No marca `Completada`.

- [ ] **Paso 1: ejecutar controles completos.**

  Ejecutar secuencialmente:

  ```bash
  bun run test
  bun run lint
  bun run typecheck
  bun run format:check
  bun run build
  bun run validate-email
  git diff --check
  ```

  Esperado: registrar el resultado real y separar los warnings preexistentes de
  `link-targets`/`company` de los resultados de MHB-08.

- [ ] **Paso 2: realizar smoke manual de descarga.**

  Ejecutar `bun run dev` y abrir `/preview?template=welcome`. Para cada acción:
  1. Pulsar “Buildear y descargar”; confirmar que se obtiene `welcome.html`.
  2. Pulsar “Descargar HTML existente”; confirmar el mismo filename seguro.
  3. Abrir ambos archivos y comparar su contenido con el HTML devuelto por la
     misma operación (o con `dist/welcome.html` en el caso existente).
  4. Probar un fallo recuperable —por ejemplo, `dist` ausente en un fixture
     temporal— y confirmar mensaje sin archivo parcial ni bloqueo permanente.
  5. Repetir la disposición del diálogo en viewport móvil; restaurar todos los
     fixtures y comprobar `git status --short`.

- [ ] **Paso 3: registrar handoff y solicitar revisor UX/API.**

  Usar `task-status-management` para mover solo MHB-08 a `En revisión` con
  rama, commit si fue autorizado, resultados, archivo comparado/captura sin
  secretos, estado de build/validación, riesgo residual y siguiente acción.
  El revisor independiente debe comprobar nombre seguro, equivalencia de HTML,
  revocación de URL, ausencia de API nueva, estado de cuatro botones y recorrido
  desktop/móvil antes de cualquier cierre o PR.

## Autorrevisión del plan

- Los criterios de MHB-08 —archivo equivalente, nombre seguro, fallos
  recuperables, pruebas y smoke manual— tienen tareas y evidencias concretas.
- Las interfaces se definen antes de su consumo: utilidad → vista/formateador →
  controlador → UI → entrega.
- No hay endpoint, ZIP, storage, ESP ni cambio de pipeline fuera del alcance.
- La fuente del HTML es la respuesta existente de build/export, no el iframe;
  el nombre nunca procede de input libre ni de la respuesta API.
