# MHB-07 — Plan de ejecución por tareas

> **Para agentes ejecutores:** usar `superpowers:subagent-driven-development`
> (recomendado) o `superpowers:executing-plans` y marcar cada paso con
> checkbox. Este plan no autoriza implementar, cerrar el ID, hacer commit,
> merge ni publicar por sí solo.

**Objetivo:** hacer que un fallo de procesamiento de `POST /api/render` llegue
al preview como diagnóstico accionable y seguro, sin cambiar el render exitoso
ni exponer detalles internos.

**Arquitectura:** el middleware queda delgado y delega el flujo de render a un
handler inyectable. Un normalizador puro transforma excepciones en un contrato
JSON seguro; el cliente lo valida y la vista de preview lo muestra con DOM
seguro. La extracción mantiene la caché, los delimitadores ESP y el iframe
vigente sin cambios observables en la ruta exitosa.

**Stack:** Bun 1.3.13, JavaScript ESM con JSDoc, Vite middleware, Maizzle,
Handlebars, Bun test y DOM simulado.

**Especificación:** [`MHB-07-DESIGN.md`](MHB-07-DESIGN.md) y contrato de
[`PLAN.md`](PLAN.md).

## Restricciones globales

- Dependencias: MHB-05 y MHB-24 están completadas; confirmar `git status
--short` y la rama antes de editar. El árbol ya puede contener trabajo ajeno:
  preservarlo y limitar los `git add` a las rutas de esta tarea.
- Para la ejecución, crear o cambiar a `feature/mhb-07`, ejecutar `bun run
check:task-branch` y registrar solo MHB-07 como `En progreso` mediante la
  skill `task-status-management`.
- Usar Bun. No añadir dependencias, endpoints, rutas públicas, TypeScript ni
  lógica HTML de preview en `main.js`.
- Conservar `200 text/html` y `X-ESP-Validation` en el éxito; conservar los
  `400`/`404` existentes de entrada. Solo fallos posteriores de procesamiento
  pasan a `422 application/json`.
- Nunca devolver stack trace, ruta absoluta, datos de preview, HTML de origen,
  secretos ni `err.message` sin clasificación y sanitización explícita.
- Mantener `[[ page.* ]]` y `{{ }}`; MHB-07 no modifica templates, layouts,
  build ni validación ESP.

## Mapa de archivos y contratos

| Archivo                                                | Acción                        | Responsabilidad                                                                  |
| ------------------------------------------------------ | ----------------------------- | -------------------------------------------------------------------------------- |
| `scripts/vite/services/render-error.js`                | Crear                         | Clasificación y serialización segura de excepciones de render.                   |
| `scripts/vite/services/render-error.test.js`           | Crear                         | Pruebas puras de schema, ruta, ubicación y omisiones seguras.                    |
| `scripts/vite/services/render-request-handler.js`      | Crear                         | Flujo de render, caché y respuesta HTTP inyectable.                              |
| `scripts/vite/services/render-request-handler.test.js` | Crear                         | Contratos de éxito, 422 y fallback 500 sin listener TCP.                         |
| `scripts/vite/api/render.js`                           | Modificar                     | Registrar el handler; conservar helpers de tema y API pública `setupRenderApi`.  |
| `src/web/features/preview/render-api.js`               | Modificar                     | Parsear el error JSON y construir `RenderApiError`; conservar callbacks.         |
| `src/web/features/preview/render-api.test.js`          | Crear                         | Validación de payload, fallback y error de red del cliente.                      |
| `src/web/features/preview/render-error-view.js`        | Crear                         | Render accesible del diagnóstico usando exclusivamente `textContent`.            |
| `src/web/features/preview/render-error-view.test.js`   | Crear                         | Estado visible/oculto, contenido y accesibilidad con DOM simulado.               |
| `src/web/features/preview/main.js`                     | Modificar                     | Conectar la vista y limpiar el error tras éxito; no parsear payloads.            |
| `src/web/features/preview/preview.html`                | Modificar                     | Añadir región de estado de error vacía y accesible.                              |
| `src/web/features/preview/styles.css`                  | Modificar                     | Estilos mínimos de estado, sin rediseñar controles existentes.                   |
| `docs/implementation/STATUS.md`                        | Modificar al iniciar/entregar | Estado y evidencia de MHB-07; no marcar `Completada` sin revisión independiente. |

Los contratos que producen y consumen las tareas son:

```js
// scripts/vite/services/render-error.js
export const RENDER_ERROR_VERSION = 1;
export function normalizeRenderError(error, { templatesRoot }) {
  // { version: 1, code: "RENDER_FAILED", message, cause?, location? }
}

// scripts/vite/services/render-request-handler.js
export function createRenderRequestHandler(options) {
  // async (req, res, next) => void
}

// src/web/features/preview/render-api.js
export class RenderApiError extends Error {
  // { status, code, message, cause?, location? }
}
export function parseRenderErrorResponse(response, body) {}

// src/web/features/preview/render-error-view.js
export function createRenderErrorView(element) {
  // { show(error), clear() }
}
```

`location` es `{ path: string, line?: number, column?: number }`. Solo se
incluye si `path` se puede resolver dentro de `templatesRoot`; line/column son
enteros positivos. `cause` se limita a categorías seguras controladas por la
aplicación (por ejemplo, sintaxis de template, fuente requerida no encontrada o
fallo de compilación); no copia el mensaje bruto de una dependencia.

---

### Tarea 0 — Baseline, aislamiento y caracterización

**Propiedad:** solo el registro de estado de MHB-07 y las pruebas creadas en
esta tarea. No tocar producción todavía.

**Consume:** `MHB-07-DESIGN.md`, `PLAN.md`, `STATUS.md`, el comportamiento
actual de `setupRenderApi`.

**Produce:** una foto de estado y pruebas que congelan la ruta exitosa y los
errores de entrada actuales para proteger al refactor.

- [x] **Paso 1: comprobar precondiciones y rama.**

  Ejecutar:

  ```bash
  git status --short
  git branch --show-current
  bun run check:task-branch
  ```

  Esperado: no se absorben cambios ajenos; la ejecución solo continúa en
  `feature/mhb-07` y el checker confirma el ID.

- [x] **Paso 2: registrar MHB-07 como `En progreso`.**

  Usar `task-status-management`, actualizar exclusivamente el bloque de
  MHB-07 con rama, alcance, precondiciones y fecha. No modificar estados de
  otros IDs ni declarar validaciones aún no corridas.

- [x] **Paso 3: escribir pruebas de caracterización de `render`.**

  Crear `scripts/vite/services/render-request-handler.test.js` con un request
  simulado basado en `components.test.js` (un `EventEmitter`, respuesta que
  captura `status`, `headers` y `body`, sin `listen(0)`). Añadir, como mínimo:

  ```js
  test("conserva 200 text/html y X-ESP-Validation al renderizar", async () => {
    const response = await request(handler, {
      method: "POST",
      url: "/api/render?template=welcome&theme=light",
      body: JSON.stringify({ name: "Ana" }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/html");
    expect(JSON.parse(response.headers.get("X-ESP-Validation"))).toEqual({
      missing: [],
      unused: [],
    });
    expect(response.body).toContain("Ana");
  });

  test("conserva 400 de JSON inválido", async () => {
    const response = await request(handler, {
      method: "POST",
      url: "/api/render?template=welcome",
      body: "{",
    });
    expect(response).toMatchObject({ status: 400, body: "Invalid JSON body" });
  });
  ```

- [x] **Paso 4: ejecutar la caracterización.**

  Ejecutar `bun test scripts/vite/services/render-request-handler.test.js`.
  Esperado: las pruebas de entrada que apuntan a la fachada actual pueden
  fallar antes de crear el handler; anotar el fallo exacto, no ajustar el
  contrato a la conveniencia del test.

---

### Tarea 1 — Normalizador seguro de errores

**Propiedad:** `scripts/vite/services/render-error.js` y
`scripts/vite/services/render-error.test.js`.

**Consume:** excepciones de compilación/render y `templatesRoot`.

**Produce:** `normalizeRenderError(error, { templatesRoot })`, sin I/O, que
devuelve un objeto serializable del schema v1.

- [x] **Paso 1: escribir pruebas de seguridad primero.**

  Crear casos explícitos:

  ```js
  test("convierte una ruta absoluta bajo templates en ubicación relativa", () => {
    const result = normalizeRenderError(
      Object.assign(new SyntaxError("unexpected token"), {
        path: "/tmp/project/src/emails/templates/welcome/index.html",
        line: 12,
        column: 4,
      }),
      { templatesRoot: "/tmp/project/src/emails/templates" },
    );

    expect(result).toEqual({
      version: 1,
      code: "RENDER_FAILED",
      message: "No se pudo renderizar el template.",
      cause: "El template contiene sintaxis inválida.",
      location: { path: "welcome/index.html", line: 12, column: 4 },
    });
  });

  test("omite rutas externas, stack y mensaje bruto", () => {
    const error = Object.assign(new Error("token=secret /Users/name/private"), {
      path: "/Users/name/private",
      stack: "stack trace",
    });
    const result = normalizeRenderError(error, { templatesRoot: "/tmp/templates" });

    expect(JSON.stringify(result)).not.toContain("/Users/name");
    expect(JSON.stringify(result)).not.toContain("secret");
    expect(JSON.stringify(result)).not.toContain("stack trace");
    expect(result.location).toBeUndefined();
  });
  ```

  Añadir casos de `ENOENT`, valores no `Error`, línea/columna `0`, decimal o
  string y ruta con traversal. Cada caso debe probar omisión, no corrección
  inventada.

- [x] **Paso 2: comprobar que fallan.**

  Ejecutar `bun test scripts/vite/services/render-error.test.js`.
  Esperado: falla por módulo/export inexistente.

- [x] **Paso 3: implementar el normalizador mínimo.**

  Declarar `RENDER_ERROR_VERSION = 1`, `code = "RENDER_FAILED"` y
  `message = "No se pudo renderizar el template."`. Clasificar únicamente:
  `SyntaxError` → causa de sintaxis; `error.code === "ENOENT"` → fuente
  requerida no encontrada; el resto → fallo de compilación. Usar `relative` y
  `isPathInside` para incluir una ruta solo si está bajo `templatesRoot`; no
  usar regex sobre `stack` ni devolver `error.message`.

- [x] **Paso 4: ejecutar prueba focalizada y controles estáticos.**

  Ejecutar:

  ```bash
  bun test scripts/vite/services/render-error.test.js
  bun run lint:js
  bun run typecheck
  ```

  Esperado: todo verde, con JSDoc de exports y tipos de objeto de ubicación.

---

### Tarea 2 — Handler inyectable y contrato HTTP

**Propiedad:** `scripts/vite/services/render-request-handler.js`, su test y
`scripts/vite/api/render.js`.

**Consume:** `normalizeRenderError`, compilador/caché existentes, `readJsonBody`,
validación ESP y helpers de tema existentes.

**Produce:** `createRenderRequestHandler(options)` y una fachada
`setupRenderApi(server, rootDir)` que conserva su firma pública.

- [x] **Paso 1: extender pruebas del handler para el contrato 422.**

  Inyectar un compilador que lance un error conocido, sin crear servidor real:

  ```js
  test("devuelve 422 JSON seguro cuando el compilador falla", async () => {
    const handler = createRenderRequestHandler({
      rootDir: fixtureRoot,
      compileTemplate: async () => {
        throw Object.assign(new SyntaxError("/private/token"), {
          path: join(fixtureRoot, "src/emails/templates/welcome/index.html"),
          line: 9,
        });
      },
      cacheManager: createNoopCache(),
      applyPreviewTheme: (html) => html,
    });
    const response = await request(handler, validRenderRequest());

    expect(response.status).toBe(422);
    expect(response.headers.get("Content-Type")).toBe("application/json");
    expect(JSON.parse(response.body)).toEqual({
      success: false,
      error: expect.objectContaining({
        version: 1,
        code: "RENDER_FAILED",
        location: { path: "welcome/index.html", line: 9 },
      }),
    });
    expect(response.body).not.toContain(fixtureRoot);
    expect(response.body).not.toContain("token");
  });
  ```

  Añadir una prueba donde el normalizador falle: debe responder `500` con
  texto genérico y sin serializar la excepción.

- [x] **Paso 2: ejecutar para verificar el fallo.**

  Ejecutar `bun test scripts/vite/services/render-request-handler.test.js`.
  Esperado: falla por `createRenderRequestHandler` inexistente o por el 500
  genérico actual.

- [x] **Paso 3: extraer el flujo sin alterar éxito ni entradas.**

  Mover desde `render.js` al nuevo handler la validación de template y ruta,
  lectura JSON, ESP, caché, compilación y respuesta de éxito. Recibir por
  `options` `rootDir`, `compileTemplate`, `cacheManager` y
  `applyPreviewTheme`, con valores por defecto de producción. En el `catch` de
  procesamiento, llamar al normalizador y usar `sendJson(res, 422, { success:
false, error })`; el catch de emergencia usa `sendText(res, 500, "Internal
server error")`.

  `render.js` conserva `findMatchingBrace`, `transformColorSchemeMedia`,
  `applyPreviewTheme` y su registro Vite, y construye el handler una vez. No
  modificar `maizzle-index.js`, URLs, `preview-cache.js` ni la lógica ESP.

- [x] **Paso 4: verificar contrato y regresiones.**

  Ejecutar:

  ```bash
  bun test scripts/vite/services/render-request-handler.test.js
  bun test scripts/vite/services/render-error.test.js
  bun run lint:js
  bun run typecheck
  ```

  Esperado: éxito 200 caracterizado, 400/404 inalterados, 422 JSON seguro y
  fallback 500 cubiertos.

---

### Tarea 3 — Cliente de render sin texto de error no confiable

**Propiedad:** `src/web/features/preview/render-api.js` y
`src/web/features/preview/render-api.test.js`.

**Consume:** respuesta HTTP 422 schema v1.

**Produce:** `RenderApiError` y `parseRenderErrorResponse(response, body)`;
`onError` recibe ese error o un fallback seguro.

- [x] **Paso 1: escribir pruebas de parsing y fallback.**

  Simular `fetch` con respuestas simples, sin browser:

  ```js
  test("convierte el payload 422 versionado en RenderApiError", async () => {
    const api = createRenderAPI({
      getTheme: () => "light",
      onSuccess: () => {},
      onStatusChange: () => {},
      onError: (error) => captured.push(error),
    });
    globalThis.fetch = async () =>
      response(
        422,
        JSON.stringify({
          success: false,
          error: {
            version: 1,
            code: "RENDER_FAILED",
            message: "No se pudo renderizar el template.",
            cause: "El template contiene sintaxis inválida.",
            location: { path: "welcome/index.html", line: 9 },
          },
        }),
      );

    await api.render("welcome", {});
    expect(captured[0]).toMatchObject({
      status: 422,
      code: "RENDER_FAILED",
      location: { path: "welcome/index.html", line: 9 },
    });
  });

  test("no refleja un cuerpo no JSON ni un schema inválido", async () => {
    expect(parseRenderErrorResponse({ status: 500 }, "token=secret")).toMatchObject({
      message: "No se pudo renderizar el template.",
      cause: undefined,
    });
  });
  ```

  Cubrir también JSON malformado, `version` distinta, `location.path` no string,
  status no 422 y rechazo de red.

- [x] **Paso 2: ejecutar y confirmar fallo.**

  Ejecutar `bun test src/web/features/preview/render-api.test.js`.
  Esperado: falla por exports y comportamiento actual que construye
  `HTTP <status>: <statusText>`.

- [x] **Paso 3: implementar parsing con allowlist.**

  Para una respuesta no exitosa, leer `await response.text()` una única vez.
  Solo aceptar `success === false`, `error.version === 1`,
  `error.code === "RENDER_FAILED"` y campos de strings/enteros válidos. Si no
  pasa la validación, crear `RenderApiError` con mensaje fijo; no reutilizar
  `statusText` ni el body. Conservar `onStatusChange` y `onValidation` del
  éxito sin cambio.

- [x] **Paso 4: ejecutar las pruebas focalizadas.**

  Ejecutar:

  ```bash
  bun test src/web/features/preview/render-api.test.js
  bun run lint:js
  bun run typecheck
  ```

  Esperado: cliente seguro para API, red y schema inválido; éxito y validación
  ESP conservados.

---

### Tarea 4 — Vista accesible y composición mínima del preview

**Propiedad:** `render-error-view.js`, su test, `preview.html`, `styles.css` y
la conexión mínima de `main.js`.

**Consume:** `RenderApiError` con mensaje, causa y ubicación opcionales.

**Produce:** un panel visible cuando falla, que se limpia al éxito y no borra
el último HTML correcto del iframe.

- [x] **Paso 1: añadir primero las pruebas de vista.**

  Reutilizar el patrón de nodos simulados de `copy-html-view.test.js`:

  ```js
  test("muestra mensaje, causa y ubicación mediante textContent", () => {
    const element = createMockDomElement("preview-render-error");
    const view = createRenderErrorView(element);

    view.show({
      message: "No se pudo renderizar el template.",
      cause: "El template contiene sintaxis inválida.",
      location: { path: "welcome/index.html", line: 9, column: 2 },
    });

    expect(element.hidden).toBe(false);
    expect(element.textContent).toContain("sintaxis inválida");
    expect(element.textContent).toContain("welcome/index.html:9:2");
    expect(element.innerHTML).toBeUndefined();
  });

  test("clear oculta y vacía el diagnóstico", () => {
    const element = createMockDomElement("preview-render-error");
    const view = createRenderErrorView(element);
    view.show({ message: "No se pudo renderizar el template." });
    view.clear();
    expect(element.hidden).toBe(true);
    expect(element.textContent).toBe("");
  });
  ```

  Verificar `role="status"`, `aria-live="polite"` y ausencia segura del
  elemento.

- [x] **Paso 2: ejecutar para confirmar fallo.**

  Ejecutar `bun test src/web/features/preview/render-error-view.test.js`.
  Esperado: falla por módulo inexistente.

- [x] **Paso 3: implementar UI mínima.**

  En `preview.html`, ubicar después de `#sync-status` un elemento inicialmente
  oculto:

  ```html
  <div
    id="preview-render-error"
    class="preview-render-error"
    role="status"
    aria-live="polite"
    hidden
  ></div>
  ```

  En `render-error-view.js`, construir una línea con `message`, una segunda
  opcional con `cause` y una tercera con `path[:line[:column]]`, siempre por
  `textContent`/`replaceChildren`. En `main.js`, instanciar la vista una vez,
  llamar `clear()` antes de `iframeManager.updateContent(html)` y
  `show(error)` desde `onError`. Mantener el `console.error` como log local,
  pero no interpolar `error` en HTML.

  Agregar en `styles.css` únicamente espaciado, borde/color de error y un ancho
  fluido que no exceda el contenedor móvil actual.

- [x] **Paso 4: ejecutar controles de la feature.**

  Ejecutar:

  ```bash
  bun test src/web/features/preview/render-error-view.test.js
  bun test src/web/features/preview/render-api.test.js
  bun test scripts/vite/services/render-error.test.js
  bun test scripts/vite/services/render-request-handler.test.js
  bun run lint
  bun run typecheck
  bun run format:check
  git diff --check
  ```

  Esperado: pruebas y controles verdes sin cambios en archivos fuera del mapa.

---

### Tarea 5 — Integración, evidencia y entrega a revisión

**Propiedad:** evidencia de MHB-07 y el bloque correspondiente de
`docs/implementation/STATUS.md`.

**Consume:** tareas 0–4 verificadas.

**Produce:** MHB-07 en `En revisión`, con evidencia automática, manual y riesgo
residual; no `Completada`.

- [x] **Paso 1: ejecutar la suite y el pipeline aplicable.**

  Ejecutar:

  ```bash
  bun run test
  bun run lint
  bun run typecheck
  bun run format:check
  bun run build
  bun run validate-email
  git diff --check
  ```

  Esperado: registrar salidas reales. Si build o validación falla por un cambio
  ajeno, separar el hallazgo y no atribuir verde/rojo a MHB-07 sin evidencia.

- [x] **Paso 2: realizar smoke manual desktop y móvil.**

  Ejecutar `bun run dev`, abrir `/preview?template=welcome`, provocar un error
  real de compilación reversible en una copia/fixture temporal o mediante un
  seam de desarrollo, y verificar:
  1. La interfaz muestra el mensaje, causa y ubicación cuando el error las
     proporciona.
  2. No aparecen ruta absoluta, stack trace, secretos ni data de preview.
  3. El iframe conserva el último HTML correcto.
  4. Tras restaurar el caso válido, el panel desaparece y el render sigue
     mostrando `X-ESP-Validation` como antes.
  5. El panel es legible tanto en viewport desktop como móvil.

  Restaurar el fixture temporal y comprobar `git status --short` antes de
  continuar.

- [x] **Paso 3: registrar evidencia y dejar para revisión independiente.**

  Con `task-status-management`, actualizar MHB-07 a `En revisión`, incluyendo
  rama, SHA solo si existe un commit autorizado, comandos/resultados reales,
  payload/captura sin secretos, smoke manual, cambios exactos, riesgos
  residuales y siguiente acción: revisión UX/API independiente. No marcar
  `Completada`, no crear PR, no fusionar ni publicar.

- [ ] **Paso 4: pedir revisión independiente.**

  El revisor debe inspeccionar en particular: ausencia de detalles internos en
  `422`, conservación de 200/400/404 y ESP, validación estricta del cliente,
  uso de `textContent`, accesibilidad y recorrido manual. Solo después de su
  veredicto y autorización del usuario puede actualizarse el estado final.

## Autorrevisión del plan

- Cobertura: handler 422/payload/sanitización, cliente, UI desktop/móvil y
  evidencia exigida por MHB-07 aparecen en tareas 1–5.
- Consistencia: `RENDER_FAILED`, versión `1`, `422`, `RenderApiError` y
  `createRenderErrorView` se definen antes de ser consumidos.
- Alcance: no incluye descarga MHB-08, catálogo MHB-09, cambios de templates,
  rutas nuevas, dependencias ni rediseño del dashboard.
- Seguridad: el único detalle expuesto proviene de categorías controladas y de
  paths validados bajo la raíz permitida; los casos de mensaje/stack externo se
  prueban explícitamente.

## Handoff de ejecución

Ejecutar una tarea por vez con revisor independiente antes del cierre. Si se
requiere exponer una ruta, conservar un payload externo, interpretar un error
no cubierto por la clasificación o cambiar el contrato público, detener MHB-07
y escalar la decisión al usuario antes de ampliar el diseño.
