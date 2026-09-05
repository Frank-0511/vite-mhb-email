# MHB-07 — Diseño: errores accionables en preview

## Propósito y alcance

MHB-07 sustituye la respuesta genérica de error de `POST /api/render` por un
contrato JSON estable que permita al preview explicar un fallo de render sin
revelar rutas absolutas, stack traces, secretos ni contenido de datos. No
cambia la URL, el método, la respuesta HTML exitosa, el encabezado
`X-ESP-Validation` ni la semántica de MHB-06.

La tarea se limita al handler de render, sus utilidades de error, el cliente de
preview, la vista de estado y sus pruebas. No rediseña el dashboard, no añade
una dependencia y no altera templates, datos, build ni exportación.

## Contrato público

Las respuestas exitosas se conservan como `200 text/html`. Los errores de
entrada ya conocidos permanecen como texto y sus códigos actuales: `400` para
nombre/ruta inválidos o JSON inválido y `404` para template inexistente.

Cuando falle el procesamiento después de validar la solicitud, la API responde
`422 application/json` con este único esquema versionado:

```json
{
  "success": false,
  "error": {
    "version": 1,
    "code": "RENDER_FAILED",
    "message": "No se pudo renderizar el template.",
    "cause": "Descripción segura de la causa.",
    "location": {
      "path": "welcome/index.html",
      "line": 12,
      "column": 4
    }
  }
}
```

`cause` y `location` son opcionales: se omiten si no pueden derivarse de forma
segura. `path` siempre es relativo a `src/emails/templates`; `line` y `column`
solo aparecen como enteros positivos cuando el error los proporciona. El
mensaje base no incluye el texto de la excepción; el cliente no procesa HTML
ni muestra cuerpos de respuesta no JSON como detalle técnico.

Los fallos inesperados fuera del ámbito de render conservan un `500` con un
mensaje genérico, sin payload de diagnóstico. El log local puede conservar la
causa técnica, pero nunca se devuelve al navegador sin sanitización.

## Arquitectura y límites de archivos

| Archivo                                                | Responsabilidad                                                                                                          |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `scripts/vite/api/render.js`                           | Registrar el middleware y conservar únicamente la selección de ruta y la configuración de dependencias.                  |
| `scripts/vite/services/render-request-handler.js`      | Ejecutar el flujo de render inyectable: validación existente, lectura, caché, compilación, tema y mapeo de errores HTTP. |
| `scripts/vite/services/render-error.js`                | Convertir una excepción de render en el contrato seguro; normalizar causa, ruta relativa y posición.                     |
| `src/web/features/preview/render-api.js`               | Leer el payload JSON de error, validar su forma y entregar un `RenderApiError` seguro a `onError`.                       |
| `src/web/features/preview/render-error-view.js`        | Actualizar de forma accesible el área visible de error mediante `textContent`; no crea HTML desde datos del servidor.    |
| `src/web/features/preview/main.js`                     | Inicializar la vista de error y conectarla como callback; no contiene parsing ni sanitización.                           |
| `src/web/features/preview/preview.html` y `styles.css` | Aportar un contenedor de estado de error accesible y sus estilos mínimos.                                                |

Las funciones públicas tendrán JSDoc y los módulos nuevos se probarán de forma
aislada. La extracción no modifica el resultado HTML de un render exitoso ni
la clave/cache existente.

## Flujo de error

1. El handler ejecuta el render con datos ya validados.
2. Ante una excepción de compilación/render, `render-error.js` extrae solo una
   causa de una línea y una ubicación que esté bajo la raíz permitida.
3. El handler responde `422` con el contrato versionado y registra la causa
   completa solo en la consola local.
4. `render-api.js` intenta leer JSON solo para respuestas no exitosas. Si el
   esquema no es válido, genera un error seguro de fallback basado en el status.
5. `render-error-view.js` presenta mensaje, causa y ubicación disponibles;
   conserva el último iframe válido y anuncia el fallo mediante una región
   `role="status"` o `aria-live="polite"`.

## Comprobación prevista

- Handler simulado sin listener TCP: `422`, schema, omisión de detalles
  inseguros, ruta absoluta sanitizada, y respuesta exitosa sin regresión.
- Cliente: payload válido, JSON malformado, texto/no JSON, error de red y
  fallback por status.
- Vista: contenido por `textContent`, ocultamiento al recuperar un render y
  atributos de accesibilidad.
- Controles del ID: `bun run lint`, `bun run typecheck`, `bun run test`,
  `bun run format:check` y `git diff --check`.
- Aceptación manual: con `bun run dev`, provocar una excepción real de render
  en desktop y móvil, comprobar que se ve causa/ubicación cuando existan y que
  no aparecen una ruta absoluta, stack trace ni datos de preview.

## Riesgos y decisiones explícitas

- La compatibilidad se preserva manteniendo las respuestas previas de entrada
  y éxito; el nuevo JSON solo se aplica al fallo de procesamiento `422`.
- No se intenta adivinar una ubicación: una ruta o posición incierta se omite.
- La extracción separa la lógica de dominio del middleware para permitir tests
  sin abrir puertos, condición necesaria en este sandbox.
- Si una librería no expone causa o ubicación de manera segura, el contrato
  sigue siendo accionable mediante `code` y `message`; no se añade parsing
  específico de la librería sin evidencia.
