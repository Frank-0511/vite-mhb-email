# Project Stack Skill

Usa esta skill cuando trabajes con Bun, Vite, Maizzle, Handlebars, CLI,
middlewares internos o rutas clave del proyecto.

## Stack

- Runtime autorizado: Bun.
- Node: `>=20`.
- Bun: `>=1.0.0`.
- Modulos: ESM (`"type": "module"`).
- Package manager declarado: `bun@1.2.2`.

No introduzcas CommonJS salvo que una dependencia lo exija de forma demostrable.
No generes lockfiles de npm, yarn o pnpm.

## Vite

- Vite provee el servidor de desarrollo y el dashboard de preview.
- La raiz de Vite es `src/web`.
- Los plugins propios viven en `scripts/vite/plugins/`.
- Las APIs internas viven en `scripts/vite/api/`.
- Los servicios compartidos de preview viven en `scripts/vite/services/`.
- Las APIs internas de desarrollo deben implementarse como middlewares de Vite.
- No agregues servidores paralelos para resolver endpoints internos.

## Maizzle

- Maizzle es el compilador final de emails.
- El output de produccion debe pasar por `bun run build`.
- No uses `maizzle build` como solucion final.
- Los layouts viven en `src/emails/layouts/`.
- Los partials viven en `src/emails/partials/`.
- El output final se aplana a `dist/<template>.html` segun
  `maizzle.config.js`.

## Handlebars y Delimitadores

El proyecto usa dos sistemas:

- `[[ page.* ]]`: variables internas de Maizzle.
- `{{ * }}`: variables de ESP, por ejemplo SendGrid.

Reglas:

- Nunca rompas ni reemplaces variables `{{ }}` destinadas al ESP durante el
  build final.
- Cualquier transformacion de delimitadores debe estar encapsulada, testeable y
  documentada.
- No agregues reemplazos ad hoc dispersos.

## CSS

- `src/web/shared/styles/tailwind.css` es para preview (usa `tailwind.config.js`,
  `darkMode: "class"`).
- `src/emails/styles/tailwind.email.css` es para email final (usa
  `tailwind.email.config.js`, `darkMode: "media"`).
- Cada template/layout importa su CSS directamente; no existe intercambio de
  configs en el pipeline de build.
- No uses `scripts/generators/css-switcher.js`; ese módulo está obsoleto.

## Rutas Clave

- Dashboard principal: `src/web/features/home/index.html`.
- Libreria de componentes: `src/web/features/library/components-library.html`.
- Preview/editor: `src/web/features/preview/preview.html`.
- JS del dashboard: `src/web/features/` y `src/web/shared/`.
- Templates: `src/emails/templates/<template>/index.html`.
- Datos de preview: `src/emails/templates/<template>/data.json`.
- Layouts: `src/emails/layouts/`.
- Partials: `src/emails/partials/`.
- Build: `scripts/build/build.js`.
- CLI: `scripts/cli.js` y `scripts/cli/`.
- APIs Vite: `scripts/vite/api/`.
- Plugins Vite: `scripts/vite/plugins/`.
- Servicios Vite: `scripts/vite/services/`.
- Validacion de email: `scripts/build/validate-email-html.js`.

## Pipeline Esperado

El flujo principal es:

1. editar templates;
2. previsualizar con Vite;
3. renderizar datos de preview con Handlebars;
4. compilar con Maizzle;
5. inyectar ajustes de email;
6. validar compatibilidad;
7. escribir HTML final plano en `dist/`.

Todo cambio debe preservar ese flujo.
