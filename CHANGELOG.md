# Changelog

<!-- markdownlint-configure-file { "MD024": { "siblings_only": true } } -->

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Añadido

- Contratos compartidos y constantes tipadas aisladas en `scripts/shared/contracts/`
  con guards de ESLint contra magic strings y `@typedef` en TypeScript (MHB-37).
- Reglas estructurales de nombres y árbol de archivos (`eslint-plugin-check-file`
  y `scripts/validators/lint-guards/file-tree.test.ts`) que limitan tamaños de
  archivo (≤ 250 líneas prod / ≤ 400 test) y número de ficheros por carpeta (MHB-39).
- Procedimiento ejecutable de revisión técnica independiente (`task-review`) y
  gestión de versiones y Go/No-Go (`release-management`) como skills obligatorias (MHB-40).
- Reglas de gobernanza para agentes contra supresiones no autorizadas de lint/tipos,
  asociación de criterios a comandos y verificación obligatoria de baseline (MHB-40).

### Cambiado

- Estandarización de 48 nombres de archivo a `kebab-case` eliminando prefijos
  redundantes de carpeta padre y unificación de barrels `index.ts` puros (MHB-39).

### Mejorado

- Activación de linting con tipos en ESLint sobre `tsconfig.strict.json` para
  reglas estrictas de promesas y tipos redundantes con cero advertencias (MHB-39).
- Manejo de `res.headersSent` y envoltorio seguro en `asyncHandler` para APIs
  locales de Vite (MHB-39).

## [1.2.0] - 2026-09-18

### Añadido

- Añadidos alias de Bun para generar templates y exportar capturas sin depender
  del menú interactivo.
- Validación de variables ESP en preview, build y exportación, junto con
  mensajes de error estructurados y seguros en el preview.
- Descarga del HTML compilado y alternancia persistente entre el render y el
  código fuente escapado.
- Templates de producto `password-reset`, `receipt` y `newsletter`, además de
  enlaces verificables y `logoUrl` en `welcome`.
- Guía reproducible de componentes, matriz de compatibilidad y cobertura de
  reglas y helpers críticos.
- Validadores automatizados de contraste y accesibilidad para el dashboard.

### Cambiado

- Modularizada la validación de emails, la API de componentes y las superficies
  de preview sin cambiar los contratos de build, preview ni exportación.
- Actualizada la interfaz Home, Library y Preview con tokens Space Blue,
  skeletons y una cabecera responsive para la previsualización.

### Corregido

- La exportación PNG usa el navegador administrado por Puppeteer en lugar de
  binarios globales, y la instalación documenta Node.js 20 y Bun 1.3.13 como
  entorno reproducible.
- Corregida la validación de nombres de template antes del acceso al filesystem
  y la ejecución de procesos CLI/build sin reenviar entradas de usuario mediante
  shell.

## [1.1.0] - 2026-08-10

### Added

- `bun run test` and `bun run test:watch` scripts connected to the built-in
  `bun test` runner (`bunfig.toml` scoped to `**/*.test.js`, excludes `dist/`
  and `node_modules`).
- Smoke test for `getProjectPaths` in `scripts/shared/` to validate test
  discovery outside `src/web/`.
- Build gate: `bun run build` now exits with code 1 when the compatibility
  validator reports ERROR-level issues; WARNINGs remain non-blocking.
- `validateEmailHtml()` returns structured `{ errors, warnings, infos }` counts
  and accepts `distDirOverride` for isolated test usage.
- `tsconfig.json` with `allowJs`, `checkJs`, `noEmit`, `module: nodenext`, and
  `types: ["node"]`; scope limited to `scripts/shared/**` and `scripts/build/**`
  (excludes `*.test.js` and `dist/`).
- `bun run typecheck` script backed by `tsc --noEmit` (devDep `typescript@6.0.3`
  and `@types/node@26.0.1`).
- GitHub Actions CI workflow (`.github/workflows/ci.yml`): path-filtered jobs
  for `lint:md`, `lint:html`, `lint:js`, `lint:json`, `lint:css`; unified
  `verify` job for `typecheck → test → build`; Bun cache keyed on `bun.lock`.
- `screenshots/dashboard.png`, `screenshots/email-welcome-desktop.png`,
  `screenshots/email-welcome-mobile.png` — real screenshots embedded in README.
- Renderizado de iconos Lucide como SVG inline en las vistas estáticas de Vite
  mediante el plugin `lucide-inline`.

### Changed

- `src/emails/layouts/layout-tenpo.html` renamed to `layout-alt.html`; content
  fully genericized (logo, social links, and legal text replaced with `{{ }}`
  variables and `[[logoFooter]]`).
- `src/emails/partials/organisms/supporting-section/index.html`: hardcoded
  image URLs replaced with `{{ support_icon_url }}` and
  `{{ support_arrow_icon_url }}` ESP variables.
- `package.json` `lint:md` glob: removed obsolete `#analysis_results.md`
  exclusion.
- `README.md`: restructured to include problem/solution framing,
  architecture diagram, CI badge, `test`/`typecheck` commands, and embedded
  screenshots.
- `package.json` version bumped from `1.0.0` to `1.1.0`.
- Interfaz web, layouts de email y artefactos versionados de `dist/` alineados
  con la identidad de EmailForge Toolkit y con los iconos inline.
- Capturas regeneradas para reflejar el dashboard y el email Welcome incluidos
  en el tag publicado.

### Fixed

- `dist/` is intentionally versioned as generated email output and is not
  included in `.gitignore`.
- Build no longer silently ignores compatibility validation errors.
- El renderizador de iconos escapa `&`, `<`, `>` y comillas en atributos antes
  de generar el SVG inline.

[Unreleased]: https://github.com/Frank-0511/vite-mhb-email/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/Frank-0511/vite-mhb-email/releases/tag/v1.2.0
[1.1.0]: https://github.com/Frank-0511/vite-mhb-email/releases/tag/v1.1.0
