---
name: email-project-stack
description: "Trabajar en el stack de EmailForge Toolkit: Bun, Vite, Maizzle, Handlebars, CLI, build o rutas clave. Usar antes de modificar el pipeline, APIs Vite, configuración, templates o scripts que dependan de esas capas."
---

# Stack de EmailForge Toolkit

- Usar Bun 1.3.13 y ESM. No crear lockfiles de npm, Yarn o pnpm.
- Usar `bun run build` como compilación final; no sustituirlo por `maizzle build`.
- Mantener Vite como servidor y middleware interno: UI en `src/web/`, APIs en
  `scripts/vite/api/`, plugins en `scripts/vite/plugins/` y servicios en
  `scripts/vite/services/`.
- Mantener templates en `src/emails/templates/<template>/index.html`, datos en
  `data.json`, layouts en `src/emails/layouts/` y partials en
  `src/emails/partials/`.
- Conservar `[[ page.* ]]` para Maizzle y `{{ }}` para el ESP. Encapsular y
  probar cualquier transformación de delimitadores.
- Mantener separados Tailwind web (`src/web/shared/styles/tailwind.css`) y email
  (`src/emails/styles/tailwind.email.css`); no reutilizar sus configuraciones.
- No usar `scripts/generators/css-switcher.js`: está obsoleto.

Preservar el flujo editar → preview → Handlebars → Maizzle → validación →
`dist/<template>.html`. Escalar cambios de contrato CLI, rutas del filesystem o
compatibilidad multiplataforma.
