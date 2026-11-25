---
name: email-responsive-web-ui
description: "Usar al cambiar layout responsive, breakpoints, Grid, Flexbox o container queries en las páginas del dashboard de EmailForge bajo src/web/**, sobre todo cuando un encabezado o una barra de controles tiene menos espacio que el viewport."
---

# UI web responsive

Usar el espacio disponible que realmente gobierna la UI. Preservar el modo de
producto, los contratos del DOM y los controles accesibles mientras cambia la
distribución visual.

Usar junto con `email-web-app` para el comportamiento de Preview/Dashboard y
con `email-visual-design-system` cuando se afecten tokens, dark/light o
contraste. Esta skill no aplica a `src/emails/**` ni al CSS de clientes de
correo.

## Elegir el mecanismo responsive

| Decisión                                                                   | Mecanismo               |
| -------------------------------------------------------------------------- | ----------------------- |
| Modo editor/preview, navegación u otro estado global de la aplicación      | `@media`                |
| Encabezado, barra, tarjeta o componente que reacciona al ancho de su panel | `@container` con nombre |
| Regiones bidimensionales conocidas                                         | Grid                    |
| Controles lineales, alineación o ajuste intrínseco                         | Flexbox                 |

Colocar un contenedor con nombre en un ancestro estable de cada elemento que
deba reaccionar; un elemento no puede consultarse a sí mismo. Mantener
`min-width: 0` en las pistas flexibles donde el contenido pueda desbordar. Derivar
los umbrales del contenedor del ancho mínimo de los grupos reales y verificar
cada uno en `x - 1`, `x` y `x + 1`.

## Preservar el comportamiento antes de limpiar

- Inspeccionar el cambio en curso, el diff actual, los consumidores del CSS, los
  selectores de JS y los tests.
- Mantener intactos IDs, ARIA, comportamiento de teclado, storage, límites de
  iframe y estados condicionales. No quitar un wrapper ni `display: contents`
  solo para acortar el CSS si eso cambia el orden o los selectores.
- Hacer primero una migración responsive equivalente en comportamiento. Mover
  DOM, consolidar etiquetas o reemplazar la estructura del layout solo en una
  limpieza aceptada por separado.
- Para controles que se encogen, preferir `etiqueta completa → etiqueta corta →
ícono`; el nombre accesible debe permanecer estable.

Ejemplo: un encabezado de Preview junto a un editor fijo usa `@media` para el
modo de pestañas de un solo panel, pero un contenedor `preview-panel` en
`#right-panel` para los estados de una fila, dos filas y compacto del
encabezado.

## Verificar el contrato visual

Ejecutar las comprobaciones focalizadas con Bun que exija la feature afectada y
distinguirlas de la aceptación visual manual. Revisar dark/light, skeleton de
carga, estado listo, textos largos de error o estado, inputs condicionales,
foco de teclado, zoom y desbordamiento horizontal. Probar viewports
representativos y cada frontera de umbral del contenedor. No declarar
aceptación visual solo con lint, tests o build. Abrir el Browser pane solo
cuando el usuario lo haya pedido explícitamente.
