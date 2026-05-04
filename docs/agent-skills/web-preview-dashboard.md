# Web Preview Dashboard Skill

Usa esta skill cuando trabajes en el dashboard web, preview/editor, libreria de
componentes, UI de Vite, APIs internas para la UI o estado del frontend.

## Alcance

- Home: `src/web/features/home/`.
- Preview/editor: `src/web/features/preview/`.
- Libreria de componentes: `src/web/features/library/`.
- Utilidades compartidas: `src/web/shared/`.
- APIs internas de Vite: `scripts/vite/api/`.
- Plugins y servicios de Vite: `scripts/vite/plugins/` y
  `scripts/vite/services/`.

Si el cambio tambien afecta templates, layouts, partials, CSS de email o build
final, lee tambien `email-compatibility.md` y `project-stack.md`.

## Principios

- La UI es una herramienta de trabajo, no una landing page.
- Mantiene vistas densas, escaneables y predecibles.
- No rompas el flujo: seleccionar template, editar datos, renderizar preview,
  guardar/restaurar y compilar por el pipeline oficial.
- El preview debe representar el HTML de email sin convertirlo en una app web
  moderna incompatible con clientes de correo.

## Frontend

- Coloca codigo nuevo en la feature propietaria si solo la usa esa vista.
- Coloca helpers en `src/web/shared/` solo si dos o mas features los usan.
- Mantiene HTML como estructura y carga de assets; evita JS embebido salvo
  bootstrap minimo.
- Usa helpers compartidos para DOM, HTTP, storage, iconos y tema cuando existan.
- Valida elementos DOM obligatorios antes de usarlos.
- Maneja `fetch` con `response.ok`, errores de red y respuesta inesperada.
- Mantiene claves de `localStorage` centralizadas en `storage-keys.js`.

## APIs Vite

- Implementa endpoints internos como middlewares de Vite.
- Valida query params, body JSON, nombres de templates, componentes y variantes.
- Evita path traversal resolviendo inputs dentro del directorio esperado.
- Devuelve status HTTP correcto y mensajes accionables.
- No ocultes errores ni retornes HTML de error con status 200.
- Reusa servicios en `scripts/vite/services/` para cache, render o compilacion.

## Preview y Componentes

- El render de preview debe preservar variables ESP `{{ }}`.
- La libreria de componentes debe leer schemas cuando existan, no duplicar
  contratos en JS si el schema ya es la fuente.
- Cambios de variantes o schemas deben considerar `src/emails/partials/**`.
- Aisla manipulacion de iframe en modulos dedicados.
- No mezcles estado de editor, llamadas API y rendering visual en una sola
  funcion cuando puedas separarlo por responsabilidad.

## Verificacion

- Ejecuta `bun run lint` para cambios en `src/web/` o `scripts/vite/`.
- Ejecuta `bun run dev` y prueba manualmente si cambias interaccion visual,
  rutas del dashboard, preview/editor o libreria de componentes.
- Ejecuta `bun run build` si el cambio puede afectar render, CSS, Maizzle o
  HTML final.
- Ejecuta `bun run validate-email` si el cambio puede afectar output de email.
