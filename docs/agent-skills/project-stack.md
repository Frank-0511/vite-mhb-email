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
- La raiz de Vite es `src`.
- Los plugins propios viven en `scripts/vite-plugins/`.
- Las APIs internas de desarrollo deben implementarse como middlewares de Vite.
- No agregues servidores paralelos para resolver endpoints internos.

## Maizzle

- Maizzle es el compilador final de emails.
- El output de produccion debe pasar por `bun run build`.
- No uses `maizzle build` como solucion final.
- Los layouts viven en `src/layouts/`.
- Los partials viven en `src/partials/`.
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

- `src/css/tailwind.css` es para preview.
- `src/css/tailwind.email.css` es para email final.
- El intercambio entre CSS de preview y email pertenece al pipeline de build.
- No cambies ese intercambio sin revisar `scripts/build/build.js` y
  `scripts/generators/css-switcher.js`.

## Rutas Clave

- Dashboard principal: `src/index.html`.
- Preview/editor: `src/preview.html`.
- JS del dashboard: `src/js/`.
- Templates: `src/templates/<template>/index.html`.
- Datos de preview: `src/templates/<template>/data.json`.
- Layouts: `src/layouts/`.
- Partials: `src/partials/`.
- Build: `scripts/build/build.js`.
- CLI: `scripts/cli.js` y `scripts/cli/`.
- Plugins Vite: `scripts/vite-plugins/`.
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
