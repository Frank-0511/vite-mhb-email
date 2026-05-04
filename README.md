# vite-mhb-email

Sistema de desarrollo, preview, validacion y exportacion de templates HTML de email.
Integra **Bun**, **Vite**, **Maizzle** y **Handlebars** para editar emails con
preview local, compilar HTML compatible con clientes de email y generar archivos
finales planos en `dist/<template>.html`.

El proyecto esta pensado para templates que luego se suben a SendGrid, Mailtrap u
otro ESP que use variables `{{ }}`.

## Stack

| Herramienta                             | Rol                                                   |
| --------------------------------------- | ----------------------------------------------------- |
| [Bun](https://bun.sh)                   | Runtime y package manager oficial                     |
| [Vite](https://vite.dev)                | Dev server del dashboard, preview y component library |
| [Maizzle](https://maizzle.com)          | Build final de emails con componentes y purge CSS     |
| [Handlebars](https://handlebarsjs.com)  | Datos de preview sin consumir variables del ESP       |
| [Tailwind CSS](https://tailwindcss.com) | CSS de preview y CSS especializado para email         |

## Flujo Principal

1. Editar templates en `src/emails/templates/<template>/`.
2. Previsualizar con Vite desde el dashboard.
3. Renderizar datos locales de preview con Handlebars.
4. Compilar con Maizzle mediante `bun run build`.
5. Inyectar ajustes de email y validar compatibilidad.
6. Obtener HTML final plano en `dist/<template>.html`.

## Desarrollo

```bash
bun install
bun run dev
```

Vite abre el dashboard local. Desde ahi puedes:

- ver todos los templates disponibles;
- abrir el preview/editor de cada email;
- alternar tema claro/oscuro;
- acceder a la libreria de componentes reutilizables.

### Rutas de la app web

| Ruta       | Vista                                    |
| ---------- | ---------------------------------------- |
| `/`        | Dashboard de templates                   |
| `/preview` | Preview/editor de templates              |
| `/library` | Libreria de componentes HTML para emails |

## Build de Produccion

```bash
bun run build
```

El comando oficial ejecuta lint y luego el pipeline del proyecto. No uses
`maizzle build` como comando final directo.

El build hace lo siguiente:

- cambia temporalmente al CSS especializado para email;
- compila templates con Maizzle;
- conserva las variables ESP `{{ variable }}`;
- inyecta media queries necesarias para email;
- aplana la salida a `dist/<template>.html`;
- valida tamano y compatibilidad del HTML generado.

## Delimitadores

El proyecto usa dos sistemas de variables:

| Sintaxis              | Uso                                             |
| --------------------- | ----------------------------------------------- |
| `[[ page.variable ]]` | Variables internas de Maizzle/front matter      |
| `{{ variable }}`      | Variables del ESP, renderizadas solo en preview |

Durante el preview, Handlebars usa `data.json` para mostrar valores de ejemplo.
Durante el build final, las variables `{{ }}` quedan intactas para que el ESP las
resuelva al enviar el email.

## Estructura

```text
src/
├── emails/
│   ├── layouts/
│   │   └── main.html
│   ├── partials/
│   │   └── organisms/
│   │       └── hero/
│   │           ├── hero-v1.html
│   │           ├── hero-v2.html
│   │           ├── index.html
│   │           └── schema.json
│   ├── styles/
│   │   └── tailwind.email.css
│   └── templates/
│       ├── welcome/
│       │   ├── index.html
│       │   └── data.json
│       └── user-created/
│           ├── index.html
│           └── data.json
└── web/
    ├── index.html
    ├── features/
    │   ├── home/
    │   ├── library/
    │   └── preview/
    └── shared/
        ├── styles/
        └── utils/

scripts/
├── build/
├── cli/
├── exporters/
├── generators/
├── mail/
├── shared/
└── vite/
    ├── api/
    ├── plugins/
    └── services/
```

## Anatomia de un Template

```html
---
title: "Titulo visible en el layout"
previewText: "Texto de preview en inbox"
titleTemplate: "Nombre en el dashboard"
---

<x-main>
  <h1>[[ page.title ]]</h1>
  <p>Hola {{ first_name }}, este texto va al ESP.</p>
  <a href="{{ cta_url }}">Ir</a>
</x-main>
```

Cada template debe tener datos de preview:

```json
{
  "titleTemplate": "Welcome",
  "first_name": "Frank",
  "cta_url": "https://example.com/dashboard"
}
```

## Component Library

La libreria vive en `src/web/features/library/` y consume componentes de email
desde `src/emails/partials/`.

Los componentes pueden incluir un `schema.json` para describir campos editables
en la UI de la libreria. El preview renderiza el HTML del componente sin cambiar
el pipeline final de Maizzle.

## CLI

```bash
bun run cli
bun run cli --help
```

Opciones principales:

| Opcion | Accion                                               |
| ------ | ---------------------------------------------------- |
| `1`    | Levantar servidor de desarrollo                      |
| `2`    | Buildear para produccion                             |
| `3`    | Crear nuevo template                                 |
| `4`    | Enviar template a Mailtrap                           |
| `5`    | Testear con Mail-Tester via Gmail SMTP               |
| `6`    | Enviar a bandeja real (Gmail / Outlook / Apple Mail) |
| `7`    | Exportar template como PNG                           |
| `8`    | Validar compatibilidad email                         |
| `0`    | Salir                                                |

### Exportar PNG

```bash
bun run export-screenshot nombre-template
```

Genera `screenshots/nombre-template.png` a partir del HTML compilado y los datos
de preview.

## Validacion

```bash
bun run lint
bun run validate-email
bun run format:check
```

Reglas principales de compatibilidad email:

| Severidad | Regla                   | Valida                                    |
| --------- | ----------------------- | ----------------------------------------- |
| Error     | `img-dimensions`        | Imagenes con `width` y `height` HTML      |
| Error     | `css-unsupported-props` | CSS problematico en clientes de email     |
| Error     | `doctype-present`       | Presencia de `<!doctype html>`            |
| Error     | `no-js-in-email`        | Ausencia de `<script>` en el output final |
| Warning   | `img-alt`               | Texto alternativo en imagenes             |
| Warning   | `link-targets`          | Links reales en vez de `href="#"`         |
| Warning   | `max-width-check`       | Ancho razonable para email                |
| Warning   | `unsubscribe-link`      | Link de desuscripcion                     |
| Info      | `color-scheme-meta`     | Metadata de color scheme                  |
| Info      | `nested-tables-depth`   | Profundidad de tablas anidadas            |

## Variables de Entorno

Copia `.env.example` a `.env` y completa solo lo que necesites:

```bash
cp .env.example .env
```

### Mailtrap

```env
MAILTRAP_API_TOKEN=
MAILTRAP_INBOX_ID=
MAILTRAP_FROM_EMAIL=
MAILTRAP_FROM_NAME=
MAILTRAP_TO_EMAIL=
MAILTRAP_TO_NAME=
```

### Gmail SMTP

Requiere un App Password de Google:
<https://myaccount.google.com/apppasswords>

```env
GMAIL_USER=
GMAIL_APP_PASS=
SMTP_FROM_NAME=
MAILTESTER_TO_EMAIL=
TEST_GMAIL_TO=
TEST_OUTLOOK_TO=
TEST_APPLE_TO=
```

## Comandos Oficiales

```bash
bun install
bun run dev
bun run build
bun run lint
bun run validate-email
bun run cli
bun run format
bun run format:check
```

Scripts adicionales utiles:

```bash
bun run build-selective
bun run check-size
bun run agents:sync
```

## Requisitos

- Node.js >= 20
- Bun >= 1.0.0

## Notas para Agentes

Las reglas operativas viven en `AGENTS.md` y en las skills repo-locales de
`docs/agent-skills/`. Antes de modificar build, Vite, Maizzle, Handlebars,
templates, CLI, validadores o scripts, lee la skill correspondiente.
