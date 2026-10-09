# Changelog

<!-- markdownlint-configure-file { "MD024": { "siblings_only": true } } -->

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Seguridad

- Endpoints de escritura de la API local del servidor Vite rechazan con 403 peticiones cross-site (`Sec-Fetch-Site`/`Origin`) y cuerpos sin `application/json` (MHB-46).

### Añadido

- Soporte para npm, Yarn 4 (con `nodeLinker: node-modules`), pnpm 12 y Bun 1.3.13 como package managers soportados para desarrollo local y ejecución de scripts (`<pm> run <script>`) (MHB-36).
- Política de lockfiles: cada quien decide si congela su instalación; el repositorio versiona exclusivamente `bun.lock` como manager del mantenedor e ignora `package-lock.json`, `yarn.lock` y `pnpm-lock.yaml`, funcionando sin lockfile en los demás gestores (MHB-36).
- Matriz de CI con Node 24 en GitHub Actions que ejecuta pruebas e instalaciones limpias desde cero en Yarn 4, npm y pnpm para asegurar compatibilidad continua sin lockfiles versionados (MHB-36).
- Check `PR Guard` (`pr-guard.yml`) y guía `CONTRIBUTING.md` para la política de PR externas: rechazo automático de PRs que incluyan lockfiles ajenos o modificaciones en `.github/` desde forks, y aprobación obligatoria previa para workflows (MHB-36).
- Manifiesto de variables ESP `dist/esp-manifest.json` generado automáticamente en el pipeline de build y ejecutable bajo demanda (`bun run esp:manifest`), con perfiles `sendgrid` (Dynamic Templates con Handlebars, bloques y helpers soportados) y `sendgrid-legacy` (etiquetas de sustitución `-variable-`), sanitización de datos de prueba (`exampleData`) contra fuga de datos personales o credenciales, reglas de compatibilidad de sintaxis `esp-syntax-profile` (ERROR) y `esp-legacy-compat` (WARNING) en `validate-email`, y guard de coherencia entre manifiesto y baseline versionado integrado en `bun run check:dist-baseline` (MHB-47).
- Workflow trimestral `outdated-majors.yml` que abre un issue asignado al dueño
  con las versiones mayores pendientes de `bun outdated`.
- Contratos compartidos y constantes tipadas aisladas en `scripts/shared/contracts/`
  con guards de ESLint contra magic strings y `@typedef` en TypeScript (MHB-37).
- Reglas estructurales de nombres y árbol de archivos (`eslint-plugin-check-file`
  y `scripts/validators/lint-guards/file-tree.test.ts`) que limitan tamaños de
  archivo (≤ 250 líneas prod / ≤ 400 test) y número de ficheros por carpeta (MHB-39).
- Procedimiento ejecutable de revisión técnica independiente (`task-review`) y
  gestión de versiones y Go/No-Go (`release-management`) como skills obligatorias (MHB-40).
- Reglas de gobernanza para agentes contra supresiones no autorizadas de lint/tipos,
  asociación de criterios a comandos y verificación obligatoria de baseline (MHB-40).
- Módulo de validación de baseline para el contrato de salida `dist/*.html` (`scripts/validators/dist-baseline/`)
  con cálculo determinista de hash SHA-256 sobre bytes crudos y extracción/comparación de variables ESP `{{ }}` (MHB-41).
- Comandos CLI `bun run check:dist-baseline` y `bun run update:dist-baseline` para contrastar y regenerar
  el baseline versionado `baseline.json` (MHB-41).
- Pasos de validación en el pipeline de CI (`CI Pipeline`): verificación estricta de `dist/` contra build
  (`git diff --exit-code`), `validate-email`, `check:dist-baseline`, `check-size` y `check:inventory` (MHB-41).
- Protección de rama `master` en GitHub con checks requeridos (`CI Pipeline` y `Accessibility & Contrast Audit`), historial lineal obligatorio (`required_linear_history`), `enforce_admins` y PR obligatorio sin bypass (MHB-45).
- Soporte para ecosistema `github-actions` en Dependabot y agrupación de dependencias dev (`dev-dependencies` y `actions`) para actualizaciones minor y patch (MHB-45).
- Reglas de `validate-email` (ERROR) contra colores CSS Color 4 no soportados por Outlook (`css-color-format`), unidades relativas `rem`/`em` en CSS de email (`css-relative-units`), imágenes SVG (`img-svg-source`), hosts de imagen fuera de allowlist (`img-host-allowlist`) y bloques `<style>` que superan el límite de 8192 bytes de Gmail (`style-block-size`); regla WARNING para enlaces/imágenes hacia dominios de ejemplo (`example-domains`) (MHB-44).
- Allowlist tipada de hosts de imagen permitidos en email (`EMAIL_IMAGE_HOST_ALLOWLIST`) y límite de bytes por bloque `<style>` (`EMAIL_STYLE_BLOCK_MAX_BYTES`) en `scripts/shared/contracts/constants/email-assets.ts` (MHB-44).
- Dependencia de desarrollo `tailwindcss-preset-email@1.4.2` (MIT, peer `tailwindcss>=3.4.17`) fijada exacta para el pipeline de email (MHB-44).
- Atom `email-icon` (`src/emails/partials/atoms/email-icon/index.html`) para renderizar iconos PNG optimizados alojados en CDN público (jsDelivr) con soporte para variantes de tema claro/oscuro (MHB-44).
- Colección de 12 iconos PNG @2x en `src/emails/assets/icons/` con documentación de origen, colores y licencias en `README.md` (MHB-44).
- Script generador CLI `generate:icons` (`bun run generate:icons`) en `scripts/icons/generate-icon.ts` y módulo `generator.ts` para rasterizar nodos SVG de Lucide Icons a PNG @2x con fondo transparente mediante `@resvg/resvg-js`, con validación de argumentos por type guards, soporte para opción `--suffix <vN>` para versionado inmutable y bloqueo de sobrescritura sin `--force` (MHB-44).
- Validador de referencias de iconos en `scripts/icons/validator.ts` que analiza plantillas en `src/emails/**/*.html`, valida la convención ampliada `lucide-<icono>-<hex6>(-v<N>)?` (`ICON_NAME_CONVENTION_REGEX` en `scripts/shared/contracts/constants/email-assets.ts`), rechaza explícitamente el atributo `name` con extensión `.png` («no debe incluir la extensión .png») y comprueba la existencia de los PNG en disco, integrado en `bun run validate-email` (MHB-44).
- Guard de no-sobrescritura en `scripts/icons/guard.ts` que detecta modificaciones en iconos PNG existentes resolviendo la referencia base con respaldo (`master` y `origin/master`) para entornos locales y shallow clones de CI (`.github/workflows/ci.yml`), protegiendo la inmutabilidad y la caché de jsDelivr, integrado en `bun run validate-email` (MHB-44).
- Dependencia de desarrollo `@resvg/resvg-js@2.6.2` fijada exacta para el rasterizado nativo de SVG a PNG (MHB-44).

### Cambiado

- Simplificado el conjunto de scripts de `package.json` (30 → 18), sin cambios de comportamiento en el HTML generado (MHB-36). Migración:
  - `test:watch` → `<pm> exec vitest`.
  - `build-selective <t>` → `<pm> run build <t>`.
  - `generate:email` y `export:screenshot` → `<pm> run cli` (opciones [3] y [7]) o `node scripts/generators/generate-email.ts` / `node scripts/export/screenshot.ts`.
  - `lint:html`, `lint:js`, `lint:md`, `lint:json` y `lint:css` → incluidos en `<pm> run lint`.
  - `lint:contrast` y `a11y-check` → `<pm> run check:a11y`.
  - `check:inventory` → cubierto por `<pm> run test`; `esp:manifest` y `benchmark` → `node scripts/esp/manifest/write-manifest.ts` y `node scripts/perf/measure-benchmarks.ts`.
- Ejecución de scripts del proyecto migrada a `node` directo con detección dinámica del package manager en tiempo de ejecución (`detect-pm.ts`) para orquestación secuencial y mensajes CLI interactivos (MHB-36).
- Migración integral de la suite de pruebas unitarias de `bun:test` a Vitest (`vitest.config.ts`), ejecutada con `node` sobre Node 24 manteniendo paridad completa de pruebas (MHB-36).
- Retirada de los campos `packageManager` y `engines.bun` en `package.json`, y eliminación del bloque `overrides` de `postcss` (MHB-36).
- Declaración de soporte de plataforma: Windows no soportado (entorno verificado y soportado en macOS y Linux con Node.js `>=24`) (MHB-36).
- Cierre total de la migración a TypeScript con repositorio 100% tipado bajo allowlist cerrada (`eslint.config.js` y el wrapper `maizzle.config.js`) (MHB-34).
- Migración a TypeScript de configuraciones raíz (`postcss.config.ts`, `tailwind.config.ts`, `tailwind.email.config.ts`, `maizzle.config.ts`) y actualización de rutas en directivas `@config` en hojas de estilo CSS (MHB-34).
- Migración a TypeScript de automatizaciones de agentes y comprobación de rama en `scripts/ai/**`, actualizando los comandos `agents:sync`, `agents:check` y `check:task-branch` a sus rutas `.ts` con soporte para type stripping nativo (MHB-34).
- Unificación del chequeo de tipos en un único comando `bun run typecheck` (`tsc --noEmit`) con modo estricto integral (`strict: true`, `verbatimModuleSyntax: true`, `erasableSyntaxOnly: true`) en `tsconfig.json`, retirando `tsconfig.strict.json` y las opciones `allowJs`/`checkJs` (MHB-34).
- Activación de modo bloqueante con `--require-zero` en el comando `bun run check:inventory` respetando la allowlist cerrada para asegurar cero regresión a JavaScript en desarrollo local y en el pipeline de CI (MHB-34).

- Restricción del workflow de auto-merge de Dependabot con rebase (`--rebase`), eliminación del paso de aprobación ciega y exclusión de dependencias críticas del pipeline de email (`@maizzle/*`, `maizzle`, `tailwindcss`, `postcss`, `autoprefixer`, `juice`, `handlebars`) para revisión manual obligatoria (MHB-45).

- `maizzle.config.js`: `css.inline.removeInlinedSelectors` vuelve a `true` (default de Maizzle). El valor `false` anterior conservaba en el `<style>` de salida todos los selectores aunque ya estuvieran aplicados inline, duplicando el CSS y superando en 4 de 6 templates el límite de 8192 bytes por bloque que aplica Gmail; `dist/*.html` regenerado sin cambios de variables ESP ni de diseño (MHB-44).
- `tailwind.email.config.js`: aplica el preset `tailwindcss-preset-email` para que los colores salgan en HEX en lugar de la sintaxis CSS Color 4 `rgb(r g b / a)` (no soportada por Outlook de escritorio ni otros clientes). Neutraliza las diferencias de diseño del preset (screens desktop-first, `maxWidth.2xl`, `fontSize` sin `lineHeight`, `fontFamily` y `letterSpacing` en `em`) para no alterar el diseño existente; `dist/*.html` regenerado, 0 `rgb(… /` y 0 `rem`/`em` en CSS (MHB-44).
- Los 3 valores `rem` escritos a mano en `src/emails/templates/{user-created,welcome}/index.html` pasan a `px` (o se eliminan por ser redundantes con la clase `pb-4` que ya los fijaba con `!important`); `tracking-widest` sobre `text-sm` en `user-created` pasa a un valor arbitrario `tracking-[1.4px]` porque no coincide con el resto de usos a `text-xs` (MHB-44).
- Sustitución de 12 imágenes SVG remotas de Iconify por iconos PNG @2x (`<x-email-icon>`) en layouts y plantillas (`main.html`, `welcome`, `user-created`) servidos desde jsDelivr sobre el propio repositorio, garantizando compatibilidad con Gmail y Outlook de escritorio sin alterar el modo oscuro; icono de saludo en `welcome` unificado a Lucide `hand` (MHB-44).
- Actualización de `scripts/validators/dist-baseline/baseline.json` autorizada por el contrato del ID con los nuevos hashes de `dist/*.html`, confirmando variables ESP `{{ }}` idénticas por template (MHB-44).
- Estandarización de 48 nombres de archivo a `kebab-case` eliminando prefijos
  redundantes de carpeta padre y unificación de barrels `index.ts` puros (MHB-39).
- Higiene de dependencias: se retiran `maizzle` (CLI), `fs-extra` y `glob` en favor de `node:fs`, `bun run build` compila con la API programática de `@maizzle/framework` (salida `dist/` idéntica), las dependencias de build pasan a `dependencies`, `@types/node` se fija a 24.x y se retira `maizzle` de Dependabot (MHB-43).

### Mejorado

- CI paralelizado en jobs `Format & Lint`, `Typecheck`, `Test` y `Build & Validate`
  con check agregado `CI Pipeline`, cancelación de ejecuciones obsoletas, caché de
  `node_modules` y sin ejecuciones duplicadas push/PR en ramas de feature (MHB-41).

- Integración con Mailtrap simplificada: autenticación flexible con `MAILTRAP_API_TOKEN` o `MAILTRAP_API_KEY`, descubrimiento automático del inbox de Sandbox vía API de cuentas y fallback transparente a Mailtrap Email Sending API sin requerir `MAILTRAP_INBOX_ID` obligatorio.
- Activación de linting con tipos en ESLint sobre `tsconfig.strict.json` para
  reglas estrictas de promesas y tipos redundantes con cero advertencias (MHB-39).
- Manejo de `res.headersSent` y envoltorio seguro en `asyncHandler` para APIs
  locales de Vite (MHB-39).

### Corregido

- Salida con código de error (`process.exit(1)`) en los comandos CLI `validate-email`
  (ante errores de compatibilidad) y `check-size` (al exceder 102 KB) para bloquear
  efectivamente ante fallos en CI (MHB-41).
- Saneamiento incompleto en `stripPropsScript` que podía reintroducir un bloque
  `<script>` anidado tras un único reemplazo (CodeQL `js/incomplete-multi-character-sanitization`, MHB-41).
- Validación por subcadena del destinatario de mail-tester.com que podía
  burlarse con dominios maliciosos que la contuvieran en otra posición
  (CodeQL `js/incomplete-url-substring-sanitization`, MHB-41).
- Bloque `permissions: contents: read` explícito en `ci.yml` y `audit.yml`
  para limitar el alcance por defecto del `GITHUB_TOKEN`
  (CodeQL `actions/missing-workflow-permissions`, MHB-41).
- Editar `maizzle.config.ts` o `tailwind.email.config.ts` ahora recarga el preview e invalida su caché: las fuentes vigiladas (`EMAIL_SOURCE_PATHS`) dejan de apuntar a `tailwind.email.config.js`, inexistente desde MHB-34 (MHB-43).

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
