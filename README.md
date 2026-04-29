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

```bash
bun run dev
```

Vite levanta el dashboard en `http://localhost:5173`. Cada template en `src/templates/*/` aparece como una tarjeta con preview en vivo.

**Doble sistema de delimitadores:**

- `[[ page.variable ]]` — variables de Maizzle, resueltas desde el front matter del template
- `{{ variable }}` — variables de SendGrid, renderizadas desde `data.json` en el preview y **preservadas intactas** en el build

### Build de producción

```bash
bun run build
```

Maizzle compila los templates a `dist/` aplicando:

- CSS inline (Tailwind compilado directo en los `style=""`)
- Purge de CSS no utilizado
- Minify de HTML y CSS
- Aplanado de estructura: `dist/welcome/index.html` → `dist/welcome.html`

Las variables `{{ first_name }}` etc. **no se modifican** — quedan listas para SendGrid.

## Estructura

```text
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

## CLI interactivo

```bash
bun run cli          # Abre el menú interactivo
bun run cli --help   # Muestra la ayuda y sale
```

Lanza un menú interactivo desde la terminal con todas las opciones del proyecto.

**Características:**

- ✅ Verifica el estado de `.env` al arrancar
- ✅ Muestra advertencias si faltan variables críticas
- ✅ Ofrece buildear automáticamente si `dist/` está vacío
- ✅ Interfaz modular y fácil de extender

**Opciones disponibles:**

| Opción | Acción                                                  |
| ------ | ------------------------------------------------------- |
| `1`    | ⚡ Levantar servidor de desarrollo                      |
| `2`    | 📦 Buildear para producción                             |
| `3`    | ✨ Crear nuevo template                                 |
| `4`    | 📨 Enviar template a **Mailtrap** (sandbox)             |
| `5`    | 🧪 Testear con **Mail-Tester** vía Gmail SMTP           |
| `6`    | 📬 Enviar a bandeja real (Gmail / Outlook / Apple Mail) |
| `7`    | 📸 Exportar template como PNG                           |
| `8`    | 🔍 Validar compatibilidad email                         |
| `0`    | 👋 Salir                                                |

### Submódulos de opciones

#### [4] Envío a Mailtrap

Usa la API REST de Mailtrap para enviar el HTML compilado a tu inbox de sandbox. Permite validar rendering sin llegar a bandejas reales.

#### [5] Envío a Mail-Tester

Envía el template vía Gmail SMTP a una dirección temporal de [mail-tester.com](https://www.mail-tester.com) para obtener un score de entregabilidad (spam, SPF, DKIM, etc.).

#### [6] Envío a bandeja real

Envía el template vía Gmail SMTP directamente a una o varias cuentas (Gmail, Outlook, Apple Mail) para validar el rendering en clientes reales.

#### [7] Exportar template como PNG

**Opción [7]** del CLI permite capturar un screenshot PNG de cualquier template compilado.

```bash
bun run export-screenshot nombre-template
```

**Características:**

- Compila el HTML con Handlebars usando los datos de `data.json`
- Renderiza a PNG de alta calidad usando `wkhtmltoimage` (con fallbacks a puppeteer/PDF+ImageMagick)
- Guarda el screenshot en `screenshots/nombre-template.png`
- Soporta templates con variables SendGrid (`{{ variable }}`) y Maizzle (`[[ page.variable ]]`)

#### [8] Validar compatibilidad email

**Opción [8]** analiza los templates compilados en `dist/` y reporta problemas de
compatibilidad con clientes de email (Outlook, Gmail, Apple Mail, Yahoo).
También se ejecuta automáticamente como parte del build.

```bash
bun run validate-email
```

**Reglas incluidas:**

| Severidad  | Regla                   | Qué valida                                                |
| ---------- | ----------------------- | --------------------------------------------------------- |
| ❌ Error   | `img-dimensions`        | `<img>` sin `width`/`height` como atributos HTML          |
| ❌ Error   | `css-unsupported-props` | CSS no soportado: `flex`, `grid`, `position`, `gap`, etc. |
| ❌ Error   | `doctype-present`       | Falta `<!doctype html>`                                   |
| ❌ Error   | `no-js-in-email`        | Tags `<script>` en el output                              |
| ⚠️ Warning | `img-alt`               | Imágenes sin `alt` descriptivo                            |
| ⚠️ Warning | `meta-charset`          | Falta `<meta charset="utf-8">`                            |
| ⚠️ Warning | `link-targets`          | Links con `href="#"` en producción                        |
| ⚠️ Warning | `max-width-check`       | Email más ancho que 700px                                 |
| ⚠️ Warning | `unsubscribe-link`      | Falta link de cancelar suscripción                        |
| ℹ️ Info    | `color-scheme-meta`     | Falta `<meta name="color-scheme">` con dark mode          |
| ℹ️ Info    | `nested-tables-depth`   | Tablas anidadas a más de 4 niveles                        |
| ℹ️ Info    | `css-class-vs-inline`   | Ratio de estilos en `<style>` vs inline                   |

---

### Estructura de scripts

```text
scripts/
├── cli/                      # CLI modular (menú interactivo)
│   ├── index.js              # Loop principal
│   ├── ui.js                 # UI: banner, menú, ayuda, validación .env
│   ├── helpers.js            # Helpers: run, ask*, input
│   └── actions.js            # Acciones: [1]-[7] del menú
├── cli.js                    # Entry point del CLI (importa cli/index.js)
├── build/                    # Build y validaciones
│   ├── build.js              # Orquestador del build (Maizzle + CSS inlining)
│   ├── build-helper.js       # buildIfNeeded(): ofrece buildear si dist/ vacío
│   ├── check-html-size.js    # Valida tamaño de templates compilados
│   ├── inject-email-media-queries.js  # Inyecta media queries para mobile
│   ├── validate-email-html.js # Valida compatibilidad con clientes de email
│   └── validate-json.js      # Valida JSON en templates
├── mail/                     # Envío de emails
│   ├── gmail-transport.js    # Transporte Gmail SMTP (nodemailer)
│   ├── send-inbox.js         # Flujo: Enviar a bandeja real (opción 6)
│   ├── send-mailtester.js    # Flujo: Testear con Mail-Tester (opción 5)
│   └── send-mailtrap.js      # Flujo: Enviar a Mailtrap (opción 4)
├── generators/               # Generadores de templates/assets
│   ├── css-switcher.js       # Cambia entre CSS preview vs. email
│   └── generate-email.js     # Generador de nuevos templates (opción 3)
├── exporters/                # Exportar templates a imagen (opción 7)
│   ├── index.js              # Orquestador principal
│   ├── compilers.js          # Compilación Handlebars + datos
│   ├── renderers.js          # Renderización: wkhtmltoimage, puppeteer, PDF+ImageMagick
│   └── file-manager.js       # Gestión de archivos temporales
├── export-screenshot.js      # Entry point para exportar PNG
├── utils.js                  # Utilidades compartidas: colores, .env, prompts
└── vite-plugins/             # Plugins para Vite/Maizzle
    ├── dashboard.js          # Dashboard de preview
    ├── maizzle.js            # Plugin Maizzle para Vite
    └── maizzle/
        ├── api-components.js # API de componentes
        ├── api-data.js       # API de datos
        ├── api-render.js     # API de renderizado
        ├── api-template.js   # API de templates
        ├── compile.js        # Lógica de compilación
        └── index.js          # Punto de entrada del plugin
```

---

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

## Variables de entorno

Copiá `.env.example` a `.env` y configurá las variables según qué funcionalidades del CLI vayas a usar:

```bash
cp .env.example .env
```

### Mailtrap (opción 4)

```env
MAILTRAP_API_TOKEN=        # Token de API de Mailtrap
MAILTRAP_INBOX_ID=         # ID del inbox (aparece en la URL)
MAILTRAP_FROM_EMAIL=       # Remitente por defecto
MAILTRAP_FROM_NAME=        # Nombre del remitente
MAILTRAP_TO_EMAIL=         # Destinatario por defecto
MAILTRAP_TO_NAME=          # Nombre del destinatario
```

### Gmail SMTP — Mail-Tester y bandeja real (opciones 5 y 6)

Requiere un **App Password** de Google (no tu contraseña normal):
→ [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)

```env
GMAIL_USER=                # tu@gmail.com
GMAIL_APP_PASS=            # App Password (4 grupos de 4 letras)
SMTP_FROM_NAME=            # Nombre del remitente

MAILTESTER_TO_EMAIL=       # Dirección temporal de mail-tester.com (opción 5)

TEST_GMAIL_TO=             # Destinatario Gmail (opción 6)
TEST_OUTLOOK_TO=           # Destinatario Outlook (opción 6)
TEST_APPLE_TO=             # Destinatario iCloud (opción 6)
```

---

## Requisitos

- Node.js ≥ 20
- Bun ≥ 1.0.0

## Instalación

```bash
git clone <repo>
cd vite-mhb-email
bun install
```
