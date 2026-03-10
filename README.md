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
yarn dev
```

Vite levanta el dashboard en `http://localhost:5173`. Cada template en `src/templates/*/` aparece como una tarjeta con preview en vivo.

**Doble sistema de delimitadores:**

- `[[ page.variable ]]` — variables de Maizzle, resueltas desde el front matter del template
- `{{ variable }}` — variables de SendGrid, renderizadas desde `data.json` en el preview y **preservadas intactas** en el build

### Build de producción

```bash
yarn build
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
yarn cli          # Abre el menú interactivo
yarn cli --help   # Muestra la ayuda y sale
```

Lanza un menú interactivo desde la terminal con todas las opciones del proyecto:

| Opción | Acción                                                  |
| ------ | ------------------------------------------------------- |
| `1`    | ⚡ Levantar servidor de desarrollo                      |
| `2`    | 📦 Buildear para producción                             |
| `3`    | ✨ Crear nuevo template                                 |
| `4`    | 📨 Enviar template a **Mailtrap** (sandbox)             |
| `5`    | 🧪 Testear con **Mail-Tester** vía Gmail SMTP           |
| `6`    | 📬 Enviar a bandeja real (Gmail / Outlook / Apple Mail) |
| `0`    | 👋 Salir                                                |

> Al arrancar, el CLI verifica el estado del `.env` y muestra advertencias si faltan variables críticas para las opciones de envío.
> Si `dist/` está vacío al intentar enviar (opciones 4/5/6), el CLI ofrece buildear el proyecto en el momento.

### Envío a Mailtrap

Usa la API REST de Mailtrap para enviar el HTML compilado a tu inbox de sandbox. Permite validar rendering sin llegar a bandejas reales.

### Envío a Mail-Tester

Envía el template vía Gmail SMTP a una dirección temporal de [mail-tester.com](https://www.mail-tester.com) para obtener un score de entregabilidad (spam, SPF, DKIM, etc.).

### Envío a bandeja real

Envía el template vía Gmail SMTP directamente a una o varias cuentas (Gmail, Outlook, Apple Mail) para validar el rendering en clientes reales.

### Estructura de scripts

```text
scripts/
├── cli.js               # Punto de entrada del CLI (menú interactivo)
├── utils.js             # Utilidades compartidas: colores, .env, prompts, templates
├── gmail-transport.js   # Transporte Gmail SMTP (nodemailer)
├── build-helper.js      # buildIfNeeded(): ofrece buildear si dist/ está vacío
├── send-mailtrap.js     # Flujo de envío a Mailtrap (opción 4)
├── send-mailtester.js   # Flujo de envío a Mail-Tester (opción 5)
├── send-inbox.js        # Flujo de envío a bandeja real (opción 6)
└── generate-email.js    # Generador de nuevos templates (opción 3)
```

---

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
- Yarn 4 (`corepack enable`)

## Instalación

```bash
git clone <repo>
cd vite-mhb-email
yarn install
```
