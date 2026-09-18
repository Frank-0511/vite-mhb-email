# Guía de componentes de email

Guía reproducible para crear un componente de EmailForge Toolkit con
`index.html` y `schema.json`, verlo en `/library` y usarlo dentro de un
template compilado.

Está escrita para ejecutarse sin conocimiento previo del repositorio: cada
afirmación corresponde a una ruta o comando verificable. La compatibilidad real
con clientes de correo no se documenta aquí; eso vive en
[COMPATIBILITY-MATRIX.md](COMPATIBILITY-MATRIX.md).

## Qué es un componente

Un componente es una carpeta bajo `src/emails/partials/` que contiene al menos
`schema.json` y un archivo `.html`. No hay registro manual ni archivo índice: el
catálogo se descubre en disco.

- Descubrimiento: `scripts/vite/services/component-catalog.js` recorre
  `src/emails/partials/` y toma como componente **toda carpeta que contenga
  `schema.json`** (la búsqueda deja de descender en esa carpeta).
- Identificador: el último segmento de la ruta. `atoms/note-callout` → id
  `note-callout`. Debe ser único en todo el árbol de partials y cumplir el guard
  de nombres (`scripts/shared/path-safety.js`: minúsculas, dígitos y guiones).
- Categoría en la biblioteca: se deriva de la ruta en
  `src/web/features/library/modules/components-api.js`. `/atoms/`, `/molecules/`
  y `/organisms/` se agrupan con ese nombre; cualquier otra ruta cae en
  `Templates`.
- Uso en Maizzle: la carpeta se registra como componente y su `index.html` se
  invoca con el tag `<x-<carpeta> />` (`scripts/shared/component-folders.js`).
  Un archivo `hero-v1.html` queda disponible como `<x-hero-v1 />`.

Estructura mínima:

```text
src/emails/partials/atoms/note-callout/
├── index.html      # markup + <script props>
└── schema.json     # metadata, variantes y props del editor
```

Estructura con variantes:

```text
src/emails/partials/atoms/note-callout/
├── index.html                  # despachador por variante
├── note-callout-info.html      # variante "info"
├── note-callout-warning.html   # variante "warning"
└── schema.json
```

## `index.html`

### Bloque de props

El bloque `<script props>` declara los valores que el componente recibe y sus
defaults. Se ejecuta en Maizzle, no en el navegador, y **no llega al HTML
final**.

```html
<script props>
  module.exports = {
    title: props.title || "Nota",
    text: props.text || "Texto de la nota.",
    showTitle: props["show-title"] !== "false",
  };
</script>
```

Reglas que se derivan del pipeline:

- Los atributos HTML llegan en kebab-case. `show-title="false"` se lee como
  `props["show-title"]`, no como `props.showTitle`.
- Todo atributo llega como **string**. Un booleano se resuelve comparando
  contra `"false"`, como hacen `hero` y `note-callout`; `props.showTitle` sin
  comparación sería `true` incluso con `show-title="false"`.
- Todo prop necesita un default; el componente debe renderizar sin props.

### Markup

- Usar tablas, `cellpadding="0"`, `cellspacing="0"` y `role="none"` para la
  estructura. Evitar flex, grid, `position`, `gap`, `transform`, `calc()` y
  `var()`: `css-unsupported-props` los reporta como **error** y detiene el
  build.
- Interpolación de props: delimitadores Maizzle `[[ prop ]]`. Los delimitadores
  `{{ }}` quedan reservados para variables del ESP y deben sobrevivir intactos
  al build.
- Condicionales y loops: `<if condition="...">`, `<elseif>`, `<else>`,
  `<each loop="row in rows">`.
- Las clases `dark:` se escriben normalmente; el build las emite como
  `dark-…` junto con `@media (prefers-color-scheme: dark)`. Verificable en
  cualquier archivo de `dist/`.
- Imágenes: siempre con `width`, `height` y `alt` (`img-dimensions` es error,
  `img-alt` warning).

```html
<table class="w-full" cellpadding="0" cellspacing="0" role="none">
  <tr>
    <td
      class="bg-sky-50 dark:bg-sky-950 rounded-lg p-4"
      style="padding: 16px; border-radius: 8px; border: 1px solid #bae6fd"
    >
      <if condition="showTitle">
        <p class="m-0 mb-2 text-sm font-bold text-sky-900 dark:text-sky-100">[[title]]</p>
      </if>
      <p class="m-0 text-sm text-sky-800 dark:text-sky-200">[[text]]</p>
    </td>
  </tr>
</table>
```

### Bloque completo o fragmento de tabla

Ambas formas funcionan, pero tienen consecuencias distintas:

| Forma                                 | Ejemplo en el repo                     | Consecuencia                                                                                                                 |
| ------------------------------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Bloque completo (`<table>`, `<div>`)  | `organisms/hero`, `atoms/note-callout` | Se puede insertar directamente dentro de `<x-main>`.                                                                         |
| Fragmento (`<tr>`, `<td>`, `<tbody>`) | `molecules/key-value-card`             | El preview lo envuelve solo para mostrarlo (`wrapTableFragment`); en un template debe insertarse dentro de una tabla propia. |

Preferir bloque completo salvo que el componente sea, por diseño, una fila de
una tabla existente.

## `schema.json`

`schema.json` describe el componente para la biblioteca. No afecta el build de
email: solo alimenta `/library` y la API `/api/components`.

```json
{
  "name": "Note Callout",
  "description": "Caja de nota con título opcional y dos tonos",
  "component": "src/emails/partials/atoms/note-callout",
  "icon": "info",
  "variants": [
    { "id": "info", "name": "Info", "description": "Tono informativo" },
    { "id": "warning", "name": "Warning", "description": "Tono de atención" }
  ],
  "props": {
    "variant": {
      "type": "select",
      "default": "info",
      "label": "Variante",
      "options": [
        { "value": "info", "label": "Info" },
        { "value": "warning", "label": "Warning" }
      ]
    },
    "title": { "type": "string", "default": "Nota", "label": "Título", "required": true },
    "text": { "type": "textarea", "default": "Texto de la nota.", "label": "Texto" },
    "showTitle": { "type": "boolean", "default": true, "label": "Mostrar título" }
  }
}
```

### Campos

| Campo         | Obligatorio | Consumido por                              | Notas                                                                                        |
| ------------- | ----------- | ------------------------------------------ | -------------------------------------------------------------------------------------------- |
| `name`        | Sí          | Listado y cabecera de `/library`           | Si falta o está vacío se usa el id de la carpeta.                                            |
| `description` | Recomendado | Cabecera de `/library`                     | —                                                                                            |
| `variants`    | Sí          | Selector de variante y primer render       | `id` debe resolver a un archivo (ver abajo).                                                 |
| `props`       | Sí          | Formulario del editor (`form-renderer.js`) | Un objeto vacío `{}` es válido para un componente sin props.                                 |
| `component`   | No          | Nadie                                      | Informativo. `organisms/hero` lo tiene desactualizado; si se escribe, escribir la ruta real. |
| `icon`        | No          | Nadie                                      | El ícono mostrado es fijo por categoría (`itemIcon` en `groupByType`).                       |

### Tipos de prop soportados por el editor

`src/web/features/library/modules/form-renderer.js` reconoce exactamente estos
tipos; cualquier otro valor cae en un input de texto.

| `type`     | Control              | Campos adicionales                       |
| ---------- | -------------------- | ---------------------------------------- |
| `string`   | `input[type=text]`   | `default`, `label`, `required`           |
| `textarea` | `textarea`           | `default`, `label`                       |
| `number`   | `input[type=number]` | `default`, `label`                       |
| `date`     | `input[type=date]`   | `default`, `label`                       |
| `boolean`  | Toggle               | `default`, `label`                       |
| `select`   | `select`             | `options: [{ value, label }]`, `default` |

El prop llamado `variant` recibe un tratamiento especial: al cambiarlo, la
biblioteca vuelve a pedir el render de esa variante en vez de solo actualizar
props.

## Variantes

La resolución de variantes está en
`scripts/vite/services/component-preview-renderer.js` y prueba, en orden:

1. `<variant>.html`
2. `<componente>-<variant>.html`

Por eso `hero` declara `v1`/`v2` y sirve `hero-v1.html`/`hero-v2.html`, y
`key-value-card` declara `index` y sirve `index.html`.

Dos patrones válidos:

- **Componente de una sola forma**: un `index.html` y
  `"variants": [{ "id": "index", "name": "Default" }]`.
- **Componente con variantes**: un archivo por variante más un `index.html`
  despachador para el uso en templates.

Un despachador **debe reenviar cada prop explícitamente**; Maizzle no propaga
props a los componentes hijos:

```html
<script props>
  module.exports = {
    variant: props.variant || "info",
    title: props.title || "Nota",
    text: props.text || "Texto de la nota.",
    showTitle: props["show-title"] !== "false",
  };
</script>

<if condition="variant === 'warning'">
  <x-note-callout-warning title="[[title]]" text="[[text]]" show-title="[[showTitle]]" />
</if>

<else>
  <x-note-callout-info title="[[title]]" text="[[text]]" show-title="[[showTitle]]" />
</else>
```

Omitir un atributo en el despachador no rompe el build: el hijo usa su propio
default y el prop del padre se pierde en silencio. `organisms/hero/index.html`
reenvía `show-button` pero no `title` ni `subtitle`, y por eso un
`<x-hero title="…" />` no cambia el título.

## Usar el componente en un template

```html
---
title: "Fixture MHB-18"
previewText: "Verificacion de la guia de componentes"
titleTemplate: "Fixture MHB-18"
---

<x-main>
  <h1>Hola, {{ first_name }}</h1>

  <x-note-callout variant="info" title="Nota informativa" text="Creado siguiendo la guia." />
</x-main>
```

- El tag es `x-` + nombre de la carpeta del componente.
- Las variables `{{ }}` del template son del ESP y deben sobrevivir al build;
  sus claves de preview van en `data.json` (`esp-variables` avisa si falta una).
- El HTML final se genera con `bun run build` (o
  `bun run build-selective <template>` para uno solo) en `dist/<template>.html`.

## Preview en `/library`

Flujo con `bun run dev` → `http://localhost:5173/library`:

1. `GET /api/components` lista el catálogo.
2. `GET /api/components/<id>` devuelve el schema más `_availableVariants`, que
   son los **nombres de archivo** en disco (`index`, `note-callout-info`,
   `note-callout-warning`), no los ids declarados en `variants`.
3. `POST /api/components/<id>/render` con `{ variant, props }` devuelve el HTML
   del iframe.

El render de preview no es el pipeline de build. `renderComponentPreview`
elimina el `<script props>`, traduce `[[ x ]]` → `{{ x }}` y `<if>`/`<each>` a
Handlebars, pasa el resultado por Maizzle y lo compila con Handlebars usando los
fixtures de `component-preview-fixtures.js`.

Limitaciones conocidas del preview (verificadas, no corregidas en esta guía):

- **Condicionales con comparación rompen el preview.** Una condición como
  `variant === 'warning'` se traduce a `{{#if variant === 'warning'}}`, que
  Handlebars no sabe parsear, y la respuesta es 500. Por eso un `index.html` despachador
  **no debe declararse como variante** en `schema.json`; se declaran solo las
  variantes concretas. Reproducible hoy pidiendo la variante `index` de
  `organisms/hero`.
- En el preview, `<if>` solo funciona con un identificador simple
  (`<if condition="showTitle">`). En el build de email la comparación sí se
  evalúa con normalidad.
- Como el `<script props>` se elimina, los defaults del preview vienen de
  `buildHandlebarsData`, no del componente: un prop no declarado en el schema ni
  en esos fixtures se renderiza vacío.

## Checklist de creación

1. Elegir categoría y nombre en kebab-case: `src/emails/partials/<categoría>/<id>/`.
2. Escribir `index.html` con `<script props>`, defaults y markup en tablas.
3. Añadir archivos de variante si hacen falta, y reenviar los props desde el
   despachador.
4. Escribir `schema.json` con `name`, `description`, `variants` y `props`.
5. Declarar en `variants` solo ids que resuelvan a archivo, y nunca el
   despachador con comparaciones.
6. `bun run lint:html` y `bun run lint:json` → sintaxis de markup y schema.
7. `bun run dev` y revisar el componente en `/library`: todas las variantes y
   cada prop del formulario.
8. Usar el componente en un template y compilar:
   `bun run build-selective <template>`.
9. `bun run validate-email` → 0 errores. Revisar los warnings del template.
10. `bun run format` sobre los archivos nuevos y `bun run format:check`.

## Ejercicio reproducible

Ejercicio ejecutado para validar esta guía (MHB-18). Crea un componente
desechable, lo verifica y lo elimina.

```bash
# 1. Componente
mkdir -p src/emails/partials/atoms/note-callout
# crear index.html, note-callout-info.html, note-callout-warning.html y schema.json
# con el contenido de las secciones anteriores

# 2. Sintaxis
bun run lint:html
bun run lint:json

# 3. Template de prueba que lo consume
mkdir -p src/emails/templates/mhb18-fixture
# crear index.html con <x-note-callout ... /> y data.json con las claves ESP

# 4. Build y validación de compatibilidad
bun run build-selective mhb18-fixture
bun run validate-email

# 5. Limpieza
rm -rf src/emails/partials/atoms/note-callout src/emails/templates/mhb18-fixture
rm -f dist/mhb18-fixture.html
```

Resultado observado el 2026-09-18 en `feature/mhb-18`:

- El componente aparece en el catálogo como
  `note-callout@src/emails/partials/atoms/note-callout`, categoría `Atoms`, sin
  ningún registro manual.
- `_availableVariants` devuelve los tres nombres de archivo (`index`,
  `note-callout-warning`, `note-callout-info`); las variantes `info` y
  `warning` renderizan, y la variante `index` falla por la limitación de
  condicionales descrita arriba.
- `show-title="false"` oculta el título en el render, confirmando la conversión
  de booleanos por string.
- `dist/mhb18-fixture.html` compila con **0 errores, 0 warnings y 0 info**, con
  `{{ first_name }}` y `{{ dashboard_url }}` intactos y ambos tonos presentes.

## Errores frecuentes

| Síntoma                                          | Causa                                                                                      |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| El componente no aparece en `/library`           | Falta `schema.json`, o una carpeta padre ya tiene uno y corta la búsqueda.                 |
| El preview responde 404 `VARIANT_NOT_FOUND`      | El `id` de la variante no resuelve a `<id>.html` ni `<componente>-<id>.html`.              |
| El preview responde 500 en una variante concreta | Condicional con comparación (`===`) en el archivo de esa variante.                         |
| Un prop pasado desde el template no tiene efecto | El despachador no lo reenvía, o se leyó `props.showTitle` en vez de `props["show-title"]`. |
| Un booleano en `false` se comporta como `true`   | Se usó el valor crudo en vez de comparar contra el string `"false"`.                       |
| El build falla con `css-unsupported-props`       | CSS moderno (flex, grid, `gap`, `transform`, `calc()`, `var()`) en `<style>`.              |
| Las variables `{{ }}` desaparecen del HTML final | Se usaron `{{ }}` para props del componente en lugar de `[[ ]]`.                           |

## Límites de esta guía

- No documenta compatibilidad real con Gmail, Outlook o Apple Mail: ver
  [COMPATIBILITY-MATRIX.md](COMPATIBILITY-MATRIX.md).
- No hay generador ni builder de componentes; la creación es manual.
- El catálogo de componentes del repositorio se amplía en su propio ID de
  `PLAN.md` (MHB-23), no desde esta guía.
