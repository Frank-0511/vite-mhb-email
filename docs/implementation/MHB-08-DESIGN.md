# MHB-08 — Diseño: descargar HTML final

## Propósito y alcance

MHB-08 permite descargar desde el preview un archivo llamado
`<template>.html` cuyo contenido sea exactamente el HTML final obtenido por el
flujo oficial. Se apoya en `POST /api/copy-html`, ya existente: `build: true`
obtiene el HTML de un build selectivo en memoria y `build: false` lee el HTML
ya generado de `dist`.

La tarea se limita al modal actual de Copiar HTML, una utilidad de descarga,
sus pruebas y el estado asociado. No crea endpoint, ZIP, almacenamiento,
persistencia, envío a un ESP ni cambios en templates, layouts, Maizzle, build o
validación de email.

## Contrato de descarga

El navegador recibe el string `html` de una respuesta exitosa de
`/api/copy-html`. La utilidad solamente descarga cuando:

- el nombre cumple el mismo subconjunto seguro de MHB-01: minúsculas, dígitos y
  guiones, sin separadores, traversal, espacios ni extensiones proporcionadas
  por el usuario;
- `html` es una cadena;
- el entorno proporciona `Blob`, `URL.createObjectURL` y un documento capaz de
  crear un enlace.

El nombre final se construye internamente como `${templateName}.html`; no se
acepta un filename externo. Se crea un `Blob` de tipo `text/html;charset=utf-8`,
se activa un `<a download>` temporal y se revoca el object URL después de la
activación. Si el navegador no soporta una dependencia, la utilidad devuelve
un fallo controlado sin lanzar ni descargar un archivo parcial.

## Arquitectura y límites de archivos

| Archivo                                            | Responsabilidad                                                                                                                           |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `src/web/features/preview/html-download.js`        | Utilidad pura e inyectable `downloadHtml({ templateName, html, document, urlApi, Blob })`; valida entradas, dispara y limpia la descarga. |
| `src/web/features/preview/html-download.test.js`   | Casos de nombre, contenido, `Blob`, enlace, click, revocación y APIs ausentes.                                                            |
| `src/web/features/preview/copy-html-modal.js`      | Añade `performDownload(build)` al controlador y listeners de UI; reutiliza el mismo `postJsonFn` y los resultados de `/api/copy-html`.    |
| `src/web/features/preview/copy-html-modal.test.js` | Prueba build/existente, nombre seguro, fallo de API y fallo de descarga en el controlador.                                                |
| `src/web/features/preview/preview.html`            | Añade las dos acciones explícitas de descarga dentro del diálogo existente.                                                               |
| `src/web/features/preview/copy-html-view.js`       | Solo se modifica si el estado actual no puede representar descarga; no debe cambiar los contratos de copia.                               |
| `src/web/features/preview/copy-html-modal.css`     | Estilos mínimos para las nuevas acciones, únicamente si los selectores existentes no bastan.                                              |

La API `setupCopyHtmlApi` y `scripts/vite/api/copy-html.js` se mantienen sin
modificación: el nombre ya pasa el guard MHB-01 en servidor, el resultado
incluye el HTML compilado y no se necesita un contrato público adicional.

## Flujo de usuario

1. La persona abre “Copiar HTML final” en el preview.
2. Selecciona “Buildear y descargar” o “Descargar HTML existente”.
3. El controlador solicita el HTML con `build: true` o `build: false` al
   endpoint actual.
4. Ante éxito, llama a `downloadHtml` con `result.template` solamente si es
   seguro; como defensa adicional, el controlador usa el template ya recibido
   al inicializarse y no un valor del body no validado.
5. La utilidad descarga el Blob y el modal informa éxito. Un error de API,
   nombre, HTML o soporte de navegador usa el estado recuperable `error` sin
   cambiar el HTML previamente copiado ni provocar un build adicional.

Los botones actuales de copia conservan su comportamiento, copy/retry de
portapapeles y caché `lastHtml`.

## Pruebas y aceptación

- La utilidad genera `welcome.html`, contenido idéntico y MIME correcto;
  rechaza `../x`, `welcome.html`, mayúsculas, espacios, HTML no string y APIs
  de navegador incompletas.
- El controlador manda los bodies exactos `{ build: true }` y `{ build: false }`;
  no reintenta ni construye un nombre desde una respuesta no confiable.
- Los fallos muestran estado recuperable y no llaman a `downloadHtml`.
- Las pruebas existentes de copia/reintento se mantienen verdes.
- Manualmente, descargar un template con build y otro desde `dist`, abrirlos y
  comparar su contenido con la fuente de HTML devuelta por la misma acción.
- Ejecutar `bun run lint`, `bun run typecheck`, `bun run test`,
  `bun run format:check`, `bun run build`, `bun run validate-email` y
  `git diff --check` antes de entregar a revisión.

## Riesgos y decisiones

- Reutilizar `/api/copy-html` evita divergencia entre una ruta de descarga y el
  pipeline de exportación; un endpoint nuevo queda fuera de alcance.
- La descarga se hace desde un Blob y no desde el iframe, que puede contener
  preview transformado y no constituye el contrato de HTML final.
- El guard del cliente es defensa en profundidad. No sustituye MHB-01 del
  servidor y no debe duplicar rutas de filesystem.
- La revocación del object URL se difiere hasta después de `click()` para no
  interrumpir navegadores que inician la descarga de forma asíncrona.
