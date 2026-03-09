# vite-mhb-email

Herramienta de desarrollo de emails HTML que integra **Maizzle**, **Handlebars** y **Vite** en un solo flujo de trabajo. Pensado para construir y previsualizar templates de email que se pueden subir directamente a SendGrid (o cualquier ESP que soporte variables `{{ }}`).

## Stack

| Herramienta                            | Rol                                                  |
| -------------------------------------- | ---------------------------------------------------- |
| [Vite](https://vite.dev)               | Dev server con hot reload + dashboard de preview     |
| [Maizzle](https://maizzle.com)         | Compilación final con CSS inline, purge y minify     |
| [Handlebars](https://handlebarsjs.com) | Renderizado de variables `{{ }}` en el preview local |

## Cómo funciona

### Modo de desarrollo

```
yarn dev
```

Vite levanta el dashboard en `http://localhost:5173`. Cada template en `src/templates/*/` aparece como una tarjeta con preview en vivo.

**Doble sistema de delimitadores:**

- `[[ page.variable ]]` — variables de Maizzle, resueltas desde el front matter del template
- `{{ variable }}` — variables de SendGrid, renderizadas desde `data.json` en el preview y **preservadas intactas** en el build

### Build de producción

```
yarn build
```

Maizzle compila los templates a `dist/` aplicando:

- CSS inline (Tailwind compilado directo en los `style=""`)
- Purge de CSS no utilizado
- Minify de HTML y CSS
- Aplanado de estructura: `dist/welcome/index.html` → `dist/welcome.html`

Las variables `{{ first_name }}` etc. **no se modifican** — quedan listas para SendGrid.

## Estructura

```
src/
├── layouts/
│   └── main.html          # Layout base con header y footer del email
├── partials/
│   ├── atoms/
│   ├── molecules/
│   └── organisms/
└── templates/
    ├── welcome/
    │   ├── index.html     # Template (front matter + <x-main>)
    │   └── data.json      # Datos de preview + titleTemplate
    └── user-created/
        ├── index.html
        └── data.json
dist/
├── welcome.html           # Email compilado, listo para SendGrid
└── user-created.html
```

## Crear un nuevo template

```bash
yarn create:template nombre-del-template
```

Genera `src/templates/nombre-del-template/` con `index.html` y `data.json` base.

## Anatomía de un template

```html
---
title: "Título visible en el layout"
previewText: "Texto en la bandeja de entrada"
titleTemplate: "Nombre en el dashboard"
---

<x-main>
  <h1>[[ page.title ]]</h1>
  <p>Hola {{ first_name }}, este texto va a SendGrid.</p>
  <a href="{{ cta_url }}" class="btn">Ir →</a>
</x-main>
```

### `data.json` — datos de muestra para el preview

```json
{
  "titleTemplate": "Nombre en el dashboard",
  "first_name": "Frank",
  "cta_url": "https://miapp.com/dashboard"
}
```

## Requisitos

- Node.js ≥ 20
- Yarn 4 (`corepack enable`)

## Instalación

```bash
git clone <repo>
cd vite-mhb-email
yarn install
```
