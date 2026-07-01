# Plan técnico de implementación — EmailForge Toolkit (`vite-mhb-email`)

## Context

`vite-mhb-email` es una herramienta de desarrollo de emails HTML que ya integra
Bun + Vite + Maizzle + Handlebars + Tailwind, con dashboard, preview en vivo,
biblioteca de componentes, CLI de 8 acciones, validador de compatibilidad y
pipeline de build a `dist/<template>.html`. El brief de producto (EmailForge
Toolkit) **no pide reescribir nada**: pide estabilizar y terminar lo existente,
con foco en compilación/exportación, validación de variables, preview
responsivo, biblioteca de componentes, CLI, compatibilidad con clientes, DX de
instalación, pruebas/CI y calidad del README. El objetivo de este plan es llevar
el repo desde "boilerplate maduro sin red de seguridad" hasta "producto de
portafolio publicable", empezando por un **primer hito pequeño y publicable**
(Release + README + capturas), sin demo desplegada todavía y manteniéndose como
template clonable (decisiones confirmadas con el usuario).

**Restricciones duras (del brief):** no reemplazar Bun, Vite, Maizzle,
Handlebars ni Tailwind salvo incompatibilidad demostrable; conservar patrones
útiles existentes; nada de tareas tipo "crear dashboard" o "mejorar
arquitectura"; separar claramente MVP, mejoras posteriores y opcional.

---

## 1. Resumen del estado actual

### Stack real (verificado en `package.json`)

| Pieza       | Versión                                                | Notas                                                                |
| ----------- | ------------------------------------------------------ | -------------------------------------------------------------------- |
| Bun         | 1.2.2 (`packageManager`)                               | runtime + package manager; lockfile `bun.lockb`                      |
| Vite        | 8.0.10                                                 | dev server del dashboard/preview/library                             |
| Maizzle     | `@maizzle/framework` 5.5.0 (+ pkg `maizzle` 1.1.0 CLI) | build de email                                                       |
| Handlebars  | 4.7.9                                                  | datos de preview (no consume `{{ }}` del ESP)                        |
| Tailwind    | 3.4.19                                                 | dos configs: `tailwind.config.js` (web) y `tailwind.email.config.js` |
| ESLint      | 10.2.1 (flat config)                                   | + `eslint-config-prettier`                                           |
| Prettier    | 3.8.3                                                  |                                                                      |
| Lint extra  | htmlhint 1.9.2, markdownlint-cli2 0.22.1               |                                                                      |
| Husky       | 9.1.7 + lint-staged 16.4.0                             | pre-commit / pre-push                                                |
| Node engine | `>=20`                                                 |                                                                      |

- **Lenguaje:** JavaScript ESM con JSDoc. **No hay TypeScript ni `tsconfig.json`**
  (`// @ts-check` solo aparece en `eslint.config.js`). No hay typecheck.

### Estructura (resumen)

- `src/emails/` — `layouts/` (`main.html`, `layout-tenpo.html`), `partials/`
  (atomic-ish: `molecules/`, `organisms/` con `index.html` + `schema.json`),
  `styles/tailwind.email.css`, `templates/` (`example`, `user-created`,
  `welcome`, cada uno con `index.html` + `data.json`).
- `src/web/` — app del dashboard: `features/{home,library,preview}` + `shared/`.
  El preview tiene `viewport-controls.js` (**selector desktop/mobile/custom ya
  implementado**), `editor.js`, `iframe-manager.js`, `theme-manager.js`,
  `copy-html-modal.js`, `render-api.js`, `save-reset.js`.
- `scripts/` — `build/`, `cli/` (modular: `index/actions/ui/helpers`),
  `exporters/` (compilers/renderers/file-manager), `generators/`, `mail/`,
  `shared/` (handlebars, paths, env, path-safety…), `vite/` (`plugins/`, `api/`,
  `services/maizzle-compiler.js`).
- `docs/` — `AGENTS.md` + `agent-skills/` (stack, quality-gates,
  email-compatibility, web-preview-dashboard, refactor-type-safety, workflow-git).

### Scripts existentes

`dev`, `build` (`lint` + `scripts/build/build.js`), `build-selective`,
`check-size`, `validate-email`, `cli`, `lint` (html/js/md/json), `format`,
`format:check`, `prepare` (husky), `g:email`, `agents:sync`.
**No existe script `test` ni `typecheck`.**

### Funcionalidades que YA existen y se conservan

- Dashboard + preview en vivo con compilación on-the-fly vía `/api/render`
  (`scripts/vite/api/render.js` → `services/maizzle-compiler.js`) y caché de
  preview por `template+theme+dataHash`.
- **Selector de viewport responsivo** (desktop/mobile/custom) con su test.
- Dark/light theme en preview (transforma `prefers-color-scheme` sin tocar fuentes).
- Biblioteca de componentes con `schema.json` por componente y form-renderer.
- Validador de compatibilidad email con 12 reglas nombradas y severidades
  (`scripts/build/validate-email-html.js`).
- Pipeline de build: Maizzle → flatten a `dist/<t>.html` → `check-html-size` →
  validate. Conserva `{{ }}` del ESP (config `expressions.missingLocal`).
- CLI de 8 acciones (dev, build, crear template, Mailtrap, Mail-Tester, inbox
  real, export PNG, validar) con aviso de `.env` faltante y `--help`.
- Exportación PNG (`scripts/exporters/`) con fallbacks wkhtmltoimage → puppeteer.
- Copy-HTML modal + selective build API.
- `path-safety.js` (validación de nombres de template y path traversal) — patrón
  útil a conservar.

---

## 2. Diferencias respecto al objetivo

Clasificación de cada elemento del brief.

### Ya implementado

- Base de stack completa (Bun, Vite, Maizzle, Handlebars, Tailwind).
- Dashboard + preview; biblioteca de componentes; CLI; exportación.
- **Selector de viewport escritorio/móvil** (ya existe; no rehacer).
- Separar compilación / validación / preview / exportación (arquitectura ya
  separada — conservar).
- Verificar enlaces, imágenes y HTML inválido (reglas en el validador).
- Toggle de tema claro/oscuro.

### Implementado parcialmente

- **Flujo elegir→editar→preview→exportar:** existe pero la "descarga del HTML
  final y sus recursos" se cubre solo con copy-to-clipboard; falta botón de
  descarga.
- **Cambiar entre HTML renderizado y código fuente:** hay editor de datos +
  iframe; el toggle "render vs source" debe verificarse/completarse.
- **Mostrar errores de compilación con ubicación y causa:** `/api/render`
  devuelve `500 "Internal server error"` genérico — no expone causa/ubicación a
  la UI.
- **Validar variables faltantes antes de exportar:** Maizzle deja `{{ var }}`
  intacto y `missingLocal` no valida nada; no hay cruce `{{var}}` vs `data.json`.
- **Pruebas:** existe `viewport-controls.test.js` (`bun:test`) pero **sin runner
  conectado** (no hay script `test`, no entra en lint ni CI).
- **Documentación:** README sólido pero faltan tabla de compatibilidad de
  clientes embebida, guía de creación de componentes y capturas embebidas.
- **Ejemplos reales:** solo `welcome` es profesional; `example` es scaffold
  (`title: "{{title}}"`), `user-created` es genérico.

### Pendiente

- Tres plantillas profesionales: **recuperación de contraseña, recibo,
  newsletter** (welcome ya existe → 4 en total).
- **Contratos tipados** para plantillas, componentes y datos (typedefs central).
- **Typecheck** (no hay tsconfig/checkJs ejecutable en CI).
- **CI** (lint, typecheck, tests, build): `.github/` solo tiene
  `copilot-instructions.md` y un `skills/` vacío. **No hay workflows.**
- Pruebas de integración (build pipeline, export/render).
- Tiempos de arranque/compilación documentados.
- Release versionada + changelog.

### Debe reconsiderarse

- **Referencias a clone/challenge:** `src/emails/layouts/layout-tenpo.html` y la
  referencia "tenpo" en `partials/organisms/supporting-section/index.html`
  violan la regla de publicación ("repositorio sin referencias a cursos,
  challenges o clones"). Renombrar/genericar.
- **`analysis_results.md` en la raíz** (artefacto de análisis, lint-ignored):
  mover a `docs/` o eliminar.
- **`example` / `user-created`:** decidir si se reemplazan por las 4 plantillas
  profesionales o se conservan como fixtures de prueba (recomendado: mover a
  fixtures de test, no como plantillas "de producto").
- **Demo desplegada:** el preview depende de `/api/render` (servidor). Confirmado
  diferir a fase posterior con previews estáticos pre-renderizados.
- **`private: true` / npm:** confirmado mantener como **template clonable**, no
  publicar a npm (empaquetado npm queda fuera de alcance).

### Contradicciones repo ↔ Markdown (señaladas)

- El brief dice "Dashboard y vista previa" como base conservada y pide "demo
  pública del dashboard". Técnicamente el dashboard **no es estático**: el
  preview requiere runtime Node/Bun para `/api/render`. → resuelto difiriendo la
  demo y planificando previews estáticos.
- El brief pide "paquete o CLI instalable de forma reproducible"; el repo es
  `private: true`. → resuelto como template clonable + lockfile (reproducible vía
  clon limpio), sin publicar.
- El brief lista "validación y exportación de emails" como ya conservada, pero la
  validación **no bloquea** el build (ver Riesgos R1) y no valida variables.

---

## 3. Decisiones técnicas

| ID  | Decisión                           | Elección                                                                                                                                                   | Justificación                                                                                                                                                              |
| --- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Runner de tests                    | **`bun test`** (built-in)                                                                                                                                  | El único test existente ya usa `bun:test`; el proyecto es Bun-first; cero dependencias nuevas. Se descarta Vitest (lo sugería `analysis_results.md`) para no añadir stack. |
| D2  | Contratos tipados                  | **JSDoc + `tsconfig.json` con `checkJs`/`allowJs`** + devDep `typescript` solo para `tsc --noEmit`                                                         | Cumple "contratos tipados" y "typecheck en CI" sin migrar a `.ts`. Respeta "no reescribir" y "estabilizar lo que existe". El repo ya está lleno de JSDoc.                  |
| D3  | Gate de validación en build        | El validador de compatibilidad **falla el build con severidad ERROR**; WARNING/INFO no bloquean (configurable)                                             | Hoy `build.js` ignora el retorno del validador (R1). "El HTML exportado funciona en los clientes documentados" exige gate real.                                            |
| D4  | Validación de variables faltantes  | Validador propio que cruza placeholders `{{ var }}` del template contra claves de `data.json` y reporta faltantes/sobrantes; severidad WARNING por defecto | Cumple "las variables faltantes se reportan antes de exportar" sin acoplarse a un ESP concreto.                                                                            |
| D5  | CI                                 | **GitHub Actions** con Bun (`oven-sh/setup-bun`), jobs: lint → typecheck → test → build                                                                    | Único proveedor ya implícito (repo en GitHub). Reproduce los comandos locales.                                                                                             |
| D6  | Distribución                       | **Template clonable** (git + `bun install`), se mantiene `private: true`                                                                                   | Decisión del usuario.                                                                                                                                                      |
| D7  | Demo                               | **Diferida**; primer hito = GitHub Release + README + capturas                                                                                             | Decisión del usuario; mantiene el primer hito pequeño.                                                                                                                     |
| D8  | Plantillas de producto vs fixtures | 4 plantillas profesionales (`welcome`, `password-reset`, `receipt`, `newsletter`); `example`/`user-created` → fixtures de test o eliminadas                | Brief: "ejemplos reales: bienvenida, recuperación de contraseña, recibo y newsletter".                                                                                     |
| D9  | Errores de compilación en UI       | `/api/render` devuelve JSON estructurado `{ error, cause, location }` con HTTP 422; el preview lo renderiza                                                | Brief: "mostrar errores de compilación con ubicación y causa".                                                                                                             |

**Suposiciones no bloqueantes documentadas:**

- (S1) El `emailType: transactional` del frontmatter (ya usado por la regla
  `unsubscribe-link`) se reutiliza para clasificar `password-reset` y `receipt`.
- (S2) Las plantillas usan los componentes existentes (`x-hero`,
  `key-value-card`, `supporting-section`) antes de crear nuevos.
- (S3) `markdownlint` seguirá ignorando artefactos largos; al mover
  `analysis_results.md` se actualiza el glob de `lint:md`.

---

## 4. Riesgos

| ID  | Riesgo                                                                                                                        | Impacto                                                               | Mitigación                                                                                               |
| --- | ----------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| R1  | `build.js` ejecuta `validateEmailHtml()` pero **descarta el retorno** → el build "pasa" aunque haya errores de compatibilidad | Alto: contradice criterio "el HTML funciona en clientes documentados" | F0-T2 introduce el gate (D3) con tests de regresión                                                      |
| R2  | Conectar `bun test` puede recolectar `node_modules` o archivos no-test                                                        | Medio                                                                 | Definir patrón/dir de tests y excluir `node_modules` (F0-T1)                                             |
| R3  | Activar `checkJs` global puede arrojar cientos de errores de tipo preexistentes y frenar CI                                   | Medio-alto                                                            | Empezar con `checkJs` acotado por `include` y `// @ts-nocheck` puntual; endurecer por carpeta en F2 (D2) |
| R4  | El gate de validación (D3) podría romper el build por reglas WARNING ya presentes en plantillas actuales                      | Medio                                                                 | Solo ERROR bloquea; correr validador sobre `dist/` actual antes de activar y corregir errores previos    |
| R5  | Husky/lint-staged + CI duplican trabajo o difieren de versiones                                                               | Bajo                                                                  | CI usa los mismos scripts `package.json`; no se cambian hooks salvo añadir `test` opcional               |
| R6  | El validador de variables (D4) puede dar falsos positivos con helpers Handlebars (`{{#each}}`, `{{else}}`)                    | Medio                                                                 | Lista de tokens reservados + parseo que ignore bloques/helpers; cubrir con tests                         |
| R7  | `dist/` está en el árbol de trabajo (no en `.gitignore`) y puede ensuciar diffs/CI                                            | Bajo-medio                                                            | Confirmar política de `dist/` (ignorar vs commitear) en F0-T5                                            |
| R8  | Rutas WSL/Windows mixtas (`//wsl.localhost/...`) y `path.split("/")` en validador/maizzle.config                              | Bajo                                                                  | Mantener separador POSIX como hoy; no introducir rutas Windows en scripts                                |
| R9  | Render API expone `cause` de errores Maizzle → posible fuga de rutas absolutas en la demo futura                              | Bajo                                                                  | Sanitizar paths en el payload de error (F1-T2)                                                           |

---

## 5. Fases

> Cada fase deja el proyecto **funcionando y verificable** (`bun install` →
> `bun run dev` / `bun run build` siguen verdes). Checkpoints de revisión humana
> entre fases.

- **Fase 0 — Estabilización mínima publicable (MVP del primer hito).**
  Red de seguridad + gates + CI + limpieza de referencias + README/capturas →
  **Release v1.1.0**. Pequeño y publicable. → **Checkpoint 0**.
- **Fase 1 — Completar el flujo de producto.**
  Validación de variables, errores de compilación en UI, descarga de HTML, las 4
  plantillas profesionales, docs de compatibilidad y de componentes →
  **Release v1.2.0**. → **Checkpoint 1**.
- **Fase 2 — Contratos tipados + cobertura de pruebas.**
  Typedefs centrales + `checkJs` endurecido; unit + integración (build/export);
  tiempos documentados → **Release v1.3.0**. → **Checkpoint 2**.
- **Fase 3 — Posterior / opcional.**
  Demo estática pre-renderizada + deploy; más componentes; (opcional, fuera de
  MVP) empaquetado npm.

### Política de ramas y versiones

- Cada tarea del roadmap debe comenzar desde `master` actualizado en una rama
  nueva con el nombre `feature/<codigo-de-tarea>` en minúsculas, por ejemplo
  `feature/f0-t5`.
- Una rama contiene únicamente los cambios de su tarea. Tras implementación,
  validación y revisión independiente, se integra directamente en `master`; no
  se mantienen ramas intermedias por fase.
- Las tareas individuales no incrementan la versión del proyecto. Los commits,
  PRs y `STATUS.md` proporcionan la trazabilidad entre releases.
- La última tarea de cada fase incluye el incremento minor de SemVer, la
  actualización del changelog y la creación del tag y GitHub Release:

  | Fase | Última tarea | Versión |
  | ---- | ------------ | ------- |
  | 0    | F0-T6        | v1.1.0  |
  | 1    | F1-T9        | v1.2.0  |
  | 2    | F2-T6        | v1.3.0  |

- La versión de la Fase 3 se define cuando se apruebe su alcance opcional. Las
  correcciones sobre una release ya publicada incrementan el patch, por ejemplo
  `v1.1.0` → `v1.1.1`.
- Los cambios ya integrados directamente en `master` se conservan; esta política
  aplica a las tareas pendientes y no autoriza reescribir el historial.

---

## 6. Tareas detalladas

> Formato por tarea: Objetivo · Justificación · Archivos · Pasos · Dependencias ·
> Aceptación · Pruebas · Validación · Riesgos · Fuera de alcance.
> Cada tarea cabe en una sesión de implementación.

### FASE 0 — Estabilización mínima publicable

#### F0-T1 — Conectar runner de tests (`bun test`)

- **Objetivo:** que `bun run test` ejecute los tests existentes y futuros.
- **Justificación:** hay un test huérfano; sin runner no hay red de seguridad ni CI.
- **Archivos:** `package.json` (script `test`, `test:watch`); posible
  `bunfig.toml` para acotar el patrón de tests; `src/web/features/preview/viewport-controls.test.js`.
- **Pasos:** añadir `"test": "bun test"`; configurar inclusión de `**/*.test.js`
  excluyendo `node_modules`/`dist`; verificar que el test de viewport pasa.
- **Dependencias:** ninguna.
- **Aceptación:** `bun run test` descubre y ejecuta ≥1 test y termina en verde;
  no recolecta `node_modules`.
- **Pruebas:** el test existente debe pasar; añadir un test trivial de humo en
  `scripts/shared/` para confirmar descubrimiento fuera de `src/web`.
- **Validación:** `bun run test`.
- **Riesgos:** R2.
- **Fuera de alcance:** escribir la suite completa (F2).

#### F0-T2 — Gate de validación de compatibilidad en build

- **Objetivo:** que `bun run build` **falle** si hay issues de severidad ERROR.
- **Justificación:** R1; criterio "el HTML funciona en clientes documentados".
- **Archivos:** `scripts/build/build.js`, `scripts/build/validate-email-html.js`
  (exponer conteo por severidad), `scripts/build/check-html-size.js` (revisar si
  también debe ser gate).
- **Pasos:** refactorizar `validateEmailHtml()` para devolver
  `{ errors, warnings, infos }`; en `build.js`, `process.exit(1)` si `errors>0`;
  flag `--allow-warnings` (default) para no romper por WARNING; mensaje claro.
- **Dependencias:** ninguna (idealmente antes de CI F0-T4).
- **Aceptación:** con un ERROR inyectado el build sale con código ≠0; sin errores
  sale 0; WARNINGs no rompen por defecto.
- **Pruebas:** test unitario de `validateEmailHtml` sobre HTML fixture con/sin
  ERROR (verifica conteos); test de que `build.js` propaga el código de salida.
- **Validación:** `bun run build` sobre plantillas actuales (corregir ERRORs
  previos primero — R4).
- **Riesgos:** R4.
- **Fuera de alcance:** nuevas reglas de validación (D4 está en F1-T1).

#### F0-T3 — Typecheck con JSDoc + `tsconfig` (`checkJs`)

- **Objetivo:** `bun run typecheck` valida tipos vía JSDoc sin migrar a TS.
- **Justificación:** D2; brief pide "contratos tipados" y CI con typecheck.
- **Archivos:** nuevo `tsconfig.json`; `package.json` (devDep `typescript`,
  script `"typecheck": "tsc --noEmit"`); ajustes JSDoc puntuales.
- **Pasos:** `tsconfig` con `allowJs`, `checkJs`, `noEmit`, `module: nodenext`,
  `include` **acotado** inicialmente a `scripts/shared/**` y `scripts/build/**`
  (R3); resolver errores reales o `// @ts-nocheck` temporal documentado.
- **Dependencias:** ninguna.
- **Aceptación:** `bun run typecheck` pasa en verde sobre el `include` definido.
- **Pruebas:** N/A (el typecheck es la prueba); CI lo ejecuta.
- **Validación:** `bun run typecheck`.
- **Riesgos:** R3.
- **Fuera de alcance:** cobertura de tipos de todo el repo (se endurece en F2-T1).

#### F0-T4 — Workflow de CI (GitHub Actions)

- **Objetivo:** CI con lint + typecheck + test + build en cada push/PR.
- **Justificación:** brief y regla de publicación exigen CI.
- **Archivos:** nuevo `.github/workflows/ci.yml`.
- **Pasos:** `oven-sh/setup-bun@v2` con `bun-version: 1.2.2`; `bun install
--frozen-lockfile`; pasos `bun run lint`, `bun run typecheck`, `bun run test`,
  `bun run build`; cache de Bun.
- **Dependencias:** F0-T1, F0-T2, F0-T3.
- **Aceptación:** el workflow corre verde en un PR de prueba; falla si cualquier
  paso falla.
- **Pruebas:** PR de validación; (opcional) `act` local.
- **Validación:** estado verde en GitHub Actions.
- **Riesgos:** R5.
- **Fuera de alcance:** deploy/release automatizado (F3 / manual en F0-T6).

#### F0-T5 — Limpieza de referencias a clone/challenge y artefactos

- **Objetivo:** eliminar referencias "tenpo"/clones y artefactos sueltos.
- **Justificación:** regla de publicación: "sin referencias a cursos, challenges
  o clones".
- **Archivos:** `src/emails/layouts/layout-tenpo.html` (renombrar a genérico,
  p.ej. `layout-alt.html` o eliminar si no se usa salvo en supporting-section),
  `src/emails/partials/organisms/supporting-section/index.html` (quitar mención),
  `analysis_results.md` (mover a `docs/internal/` o eliminar), `package.json`
  `lint:md` glob, `.gitignore` (decidir `dist/` — R7), grep de otras menciones.
- **Pasos:** localizar usos (`grep -ri tenpo`), renombrar/genericar, actualizar
  imports/refs, correr lint/build para confirmar que nada se rompe.
- **Dependencias:** ninguna.
- **Aceptación:** `grep -ri "tenpo\|challenge\|curso\|clone" src docs README.md`
  sin coincidencias relevantes; `bun run build` verde.
- **Pruebas:** build + validate tras el rename.
- **Validación:** `bun run lint && bun run build`.
- **Riesgos:** R7, R8.
- **Fuera de alcance:** rediseñar el layout (solo renombrar/genericar).

#### F0-T6 — README, capturas, CHANGELOG y Release v1.1.0 (gate del hito)

- **Objetivo:** primer hito publicable: README pulido + capturas reales +
  changelog + GitHub Release.
- **Justificación:** D7; regla de publicación (README con problema/solución/
  arquitectura/ejecución + capturas + CI badge).
- **Archivos:** `README.md` (badge CI, sección problema/solución, capturas
  embebidas, comandos `test`/`typecheck`), `screenshots/` (capturas reales del
  dashboard y de un email renderizado en desktop/móvil), nuevo `CHANGELOG.md`,
  `package.json` (versión `1.1.0`) y metadata de GitHub (description/topics).
- **Pasos:** generar capturas (dashboard, preview desktop, preview móvil, email);
  insertarlas; documentar problema/solución/arquitectura; añadir badge de CI;
  actualizar la versión a `1.1.0`; redactar `CHANGELOG.md` (Keep a Changelog)
  v1.1.0; crear tag/Release `v1.1.0`.
- **Dependencias:** F0-T1..T5 (para que README refleje CI/tests reales).
- **Aceptación:** README incluye capturas y badge verde; `CHANGELOG.md` lista
  v1.1.0; `package.json`, tag y GitHub Release coinciden en `v1.1.0`;
  `bun install && bun run dev` desde clon limpio funciona.
- **Pruebas:** smoke manual de clon limpio (instalación, dev, build).
- **Validación:** `bun install --frozen-lockfile && bun run build`.
- **Riesgos:** capturas desactualizadas (regenerar al cierre de cada fase).
- **Fuera de alcance:** demo desplegada (F3).

> **🚦 Checkpoint 0 — Revisión humana.** Verificar Release v1.1.0, CI verde,
> README con capturas, build con gate. No avanzar a Fase 1 sin aprobación.

---

### FASE 1 — Completar el flujo de producto

#### F1-T1 — Validador de variables faltantes (`{{ var }}` vs `data.json`)

- **Objetivo:** reportar variables del template no presentes en `data.json` (y
  viceversa) antes de exportar.
- **Justificación:** D4; criterio "las variables faltantes se reportan antes de
  exportar".
- **Archivos:** nuevo `scripts/build/validate-variables.js`; integración en
  `scripts/build/build.js` y en el preview (`scripts/vite/api/render.js`);
  reutilizar `scripts/shared/handlebars.js` y `paths.js`.
- **Pasos:** extraer tokens `{{ ... }}` del `index.html` ignorando helpers/bloques
  Handlebars y delimitadores Maizzle `[[ ]]`; cruzar contra claves de
  `data.json`; emitir issues (faltantes WARNING, sobrantes INFO); exponer función
  reutilizable.
- **Dependencias:** F0-T1 (tests), F0-T2 (patrón de severidades/gate).
- **Aceptación:** template con `{{ foo }}` sin `foo` en `data.json` produce un
  WARNING accionable (archivo, variable, sugerencia).
- **Pruebas:** unit con fixtures (faltante, sobrante, helper `{{#each}}`,
  `{{ esp_var }}` intencional) — cubre R6.
- **Validación:** `bun run validate-email` (o nuevo `validate-variables`) +
  `bun run test`.
- **Riesgos:** R6.
- **Fuera de alcance:** autocompletar/migrar datos.

#### F1-T2 — Errores de compilación con causa y ubicación en la UI

- **Objetivo:** que el preview muestre causa + ubicación cuando Maizzle falla.
- **Justificación:** D9; brief "mostrar errores de compilación con ubicación y
  causa".
- **Archivos:** `scripts/vite/api/render.js` (responder 422 JSON
  `{ error, cause, location }` sanitizado), `src/web/features/preview/render-api.js`
  y `iframe-manager.js`/`main.js` (renderizar el estado de error).
- **Pasos:** capturar el error de `compileTemplate`, extraer mensaje/línea si
  Maizzle/Handlebars la provee, sanitizar rutas absolutas (R9), responder JSON;
  en el cliente, mostrar panel de error en vez de iframe en blanco.
- **Dependencias:** ninguna (idealmente tras F0).
- **Aceptación:** un template con sintaxis inválida muestra en el dashboard el
  mensaje y, si está disponible, la ubicación; sin exponer rutas absolutas.
- **Pruebas:** test del handler (mock de `compileTemplate` que lanza) verificando
  status 422 y forma del payload.
- **Validación:** `bun run dev` + provocar error manual; `bun run test`.
- **Riesgos:** R9.
- **Fuera de alcance:** editor con subrayado de errores inline.

#### F1-T3 — Botón "Descargar HTML final" en el preview

- **Objetivo:** descargar el HTML compilado del template desde el dashboard.
- **Justificación:** brief "incluir una opción para descargar el HTML final".
- **Archivos:** `src/web/features/preview/` (botón + handler, junto a
  `copy-html-modal.js`); reutilizar `scripts/vite/api/copy-html.js` /
  `render.js`.
- **Pasos:** añadir botón "Descargar" que pida el HTML renderizado (misma fuente
  que copy-html) y dispare descarga `Blob` como `<template>.html`.
- **Dependencias:** patrón de copy-html existente.
- **Aceptación:** el botón descarga un `.html` válido equivalente al copiado.
- **Pruebas:** unit de la utilidad que arma el `Blob`/nombre (si se extrae
  helper); resto manual.
- **Validación:** `bun run dev` + descargar y abrir el archivo.
- **Riesgos:** bajo.
- **Fuera de alcance:** empaquetar recursos/imágenes en zip (mejora posterior).

#### F1-T4 — Toggle "render vs código fuente" (verificar/completar)

- **Objetivo:** alternar entre HTML renderizado y código fuente en el preview.
- **Justificación:** brief "permitir cambiar entre HTML renderizado y código
  fuente".
- **Archivos:** `src/web/features/preview/{iframe-manager,editor,main}.js`,
  `preview.html`, `styles.css`.
- **Pasos:** auditar si ya existe; si no, añadir toggle que muestre el HTML como
  texto (escapado) reusando la respuesta de `/api/render`.
- **Dependencias:** F1-T2 (misma fuente de HTML).
- **Aceptación:** el usuario alterna vista renderizada/código sin recompilar de
  más; estado persistente durante la sesión.
- **Pruebas:** unit de la función de estado del toggle (estilo
  `viewport-controls.test.js`).
- **Validación:** `bun run dev`.
- **Riesgos:** bajo.
- **Fuera de alcance:** resaltado de sintaxis.

#### F1-T5 — Plantilla `password-reset` (transaccional)

- **Objetivo:** plantilla profesional de recuperación de contraseña.
- **Justificación:** brief: ejemplos reales incluyen recuperación de contraseña.
- **Archivos:** nuevo `src/emails/templates/password-reset/{index.html,data.json}`;
  reutilizar `x-main`, componentes existentes (S2).
- **Pasos:** `bun run g:email password-reset`; redactar contenido (CTA con
  `{{ reset_url }}`, expiración, aviso de seguridad); `emailType: transactional`
  (S1); `data.json` completo.
- **Dependencias:** F1-T1 (debe pasar validación de variables), F0-T2 (gate).
- **Aceptación:** compila a `dist/password-reset.html`; `validate-email` sin
  ERRORs; `validate-variables` sin faltantes; se ve bien en desktop/móvil.
- **Pruebas:** incluida en el integration test de build (F2-T4).
- **Validación:** `bun run build`.
- **Riesgos:** R4.
- **Fuera de alcance:** branding específico de cliente.

#### F1-T6 — Plantilla `receipt` (transaccional)

- **Objetivo:** plantilla profesional de recibo/orden.
- **Justificación:** brief: ejemplos reales incluyen recibo.
- **Archivos:** nuevo `src/emails/templates/receipt/{index.html,data.json}`;
  reutilizar `key-value-card` para líneas de detalle.
- **Pasos:** generar template; tabla de ítems + totales con `{{ }}`;
  `emailType: transactional`; `data.json` con ítems de ejemplo.
- **Dependencias:** F1-T1, F0-T2.
- **Aceptación:** igual que F1-T5 para `dist/receipt.html`.
- **Pruebas:** integration build (F2-T4).
- **Validación:** `bun run build`.
- **Riesgos:** tablas anidadas (regla `nested-tables-depth`).
- **Fuera de alcance:** cálculo dinámico de totales.

#### F1-T7 — Plantilla `newsletter` (marketing, con unsubscribe)

- **Objetivo:** plantilla profesional de newsletter.
- **Justificación:** brief: ejemplos reales incluyen newsletter.
- **Archivos:** nuevo `src/emails/templates/newsletter/{index.html,data.json}`.
- **Pasos:** generar; secciones de contenido + `x-hero`; **link de
  unsubscribe** obligatorio (no transaccional → regla `unsubscribe-link`).
- **Dependencias:** F1-T1, F0-T2.
- **Aceptación:** `dist/newsletter.html` sin ERRORs y con unsubscribe; sin
  WARNING de unsubscribe.
- **Pruebas:** integration build (F2-T4).
- **Validación:** `bun run build`.
- **Riesgos:** R4.
- **Fuera de alcance:** sistema de bloques de contenido configurable.

#### F1-T8 — Reconsiderar `example` / `user-created`

- **Objetivo:** dejar exactamente las 4 plantillas de producto; reubicar el resto.
- **Justificación:** D8; evitar plantillas placeholder en el "producto".
- **Archivos:** `src/emails/templates/example/`, `.../user-created/`; posible
  `test/fixtures/`.
- **Pasos:** mover `example` (y/o `user-created`) a fixtures de test o
  eliminarlos; actualizar referencias (dashboard lista por carpeta), CLI y docs.
- **Dependencias:** F1-T5..T7 (no quedarse sin plantillas), F2-T4 (si pasan a
  fixtures).
- **Aceptación:** el dashboard muestra solo las 4 plantillas de producto; build
  verde; tests verdes.
- **Pruebas:** ajustar tests que referencien esas plantillas.
- **Validación:** `bun run build && bun run test`.
- **Riesgos:** referencias colgantes (R8).
- **Fuera de alcance:** rediseñar el listado del dashboard.

#### F1-T9 — Documentación y Release v1.2.0 (gate de fase)

- **Objetivo:** añadir tabla de compatibilidad de clientes de correo y guía para
  crear componentes reutilizables; publicar el cierre de la fase como v1.2.0.
- **Justificación:** brief (documentación): tabla de compatibilidad + guía de
  componentes; política de versionado por fase.
- **Archivos:** `README.md` y/o `docs/` (nueva `docs/email-clients.md`,
  `docs/components-guide.md`), `CHANGELOG.md` y `package.json`; apoyarse en
  `docs/agent-skills/email-compatibility.md` y en los `schema.json` existentes.
- **Pasos:** redactar tabla (Outlook/Gmail/Apple Mail/Yahoo × features soportadas
  alineadas a las reglas del validador); guía paso a paso de un componente con
  `index.html` + `schema.json`; actualizar la versión y changelog a `1.2.0`;
  crear tag y GitHub Release `v1.2.0`.
- **Dependencias:** plantillas finales (F1-T5..T8) para ejemplos reales.
- **Aceptación:** `markdownlint` verde; la guía permite crear un componente nuevo
  siguiendo solo la doc; `package.json`, changelog, tag y GitHub Release
  coinciden en `v1.2.0`.
- **Pruebas:** `bun run lint:md`.
- **Validación:** `bun run format:check`, `bun run lint` y `bun run build`.
- **Riesgos:** bajo.
- **Fuera de alcance:** matriz de compatibilidad basada en pruebas reales en cada
  cliente (manual, posterior).

> **🚦 Checkpoint 1 — Revisión humana.** 4 plantillas profesionales compilan y
> pasan gates; errores de compilación visibles en UI; descarga y validación de
> variables funcionando; docs de compatibilidad/componentes; Release v1.2.0.
> Regenerar capturas.

---

### FASE 2 — Contratos tipados + cobertura de pruebas

#### F2-T1 — Contratos tipados centrales + `checkJs` endurecido

- **Objetivo:** typedefs para frontmatter de template, `schema.json` de
  componente y `data.json`; ampliar `checkJs` a más carpetas.
- **Justificación:** D2; brief "contratos tipados para plantillas, componentes y
  datos".
- **Archivos:** nuevo `scripts/types.js` (o `types.d.ts`) con `@typedef`s
  (`TemplateFrontmatter`, `ComponentSchema`, `TemplateData`, `Issue`, `Rule` —
  estos dos ya existen en el validador, centralizarlos); `tsconfig.json` (ampliar
  `include`); anotaciones JSDoc en `scripts/vite/`, `scripts/exporters/`.
- **Pasos:** definir typedefs; importarlos vía JSDoc; ampliar `include`
  carpeta-por-carpeta resolviendo errores; quitar `@ts-nocheck` temporales.
- **Dependencias:** F0-T3.
- **Aceptación:** `bun run typecheck` verde con `include` ampliado a `scripts/**`.
- **Pruebas:** typecheck en CI.
- **Validación:** `bun run typecheck`.
- **Riesgos:** R3.
- **Fuera de alcance:** migración a `.ts`.

#### F2-T2 — Tests unitarios de helpers

- **Objetivo:** cubrir helpers críticos.
- **Justificación:** brief "pruebas unitarias para helpers y compilación".
- **Archivos:** tests junto a `scripts/shared/handlebars.js`, `paths.js`,
  `path-safety.js`, `env.js`, `scripts/build/{validate-json,check-html-size}.js`.
- **Pasos:** tests `bun:test` por helper (casos felices + borde, incl.
  path-traversal en `path-safety`).
- **Dependencias:** F0-T1.
- **Aceptación:** cobertura de las funciones puras listadas; suite verde.
- **Pruebas:** son las pruebas.
- **Validación:** `bun run test`.
- **Riesgos:** bajo.
- **Fuera de alcance:** mocking de red (mail).

#### F2-T3 — Tests unitarios de las reglas del validador

- **Objetivo:** cubrir las 12 reglas de `validate-email-html.js` y el validador
  de variables (F1-T1).
- **Justificación:** el validador es central para "compatibilidad" y "variables
  faltantes".
- **Archivos:** test nuevo para `validate-email-html.js` y `validate-variables.js`
  con fixtures HTML.
- **Pasos:** por regla, fixture que dispara y fixture que no; afirmar severidad y
  mensaje.
- **Dependencias:** F0-T2, F1-T1.
- **Aceptación:** cada regla tiene ≥1 caso positivo y ≥1 negativo verdes.
- **Pruebas:** son las pruebas.
- **Validación:** `bun run test`.
- **Riesgos:** R6.
- **Fuera de alcance:** nuevas reglas.

#### F2-T4 — Test de integración del build pipeline

- **Objetivo:** validar build extremo a extremo en un dir temporal.
- **Justificación:** brief "pruebas de integración para generación y
  exportación".
- **Archivos:** test que ejecuta el build sobre fixtures y asevera salida.
- **Pasos:** compilar plantillas fixture; afirmar `dist/<t>.html` plano, `{{ }}`
  preservadas, `[[ ]]` resueltas, `<!doctype>` presente, sin `<script>`; afirmar
  que el gate (F0-T2) falla con fixture defectuoso.
- **Dependencias:** F0-T2, F1-T5..T8.
- **Aceptación:** test verde; detecta regresión si se rompe flatten o se filtran
  variables.
- **Pruebas:** es la prueba.
- **Validación:** `bun run test`.
- **Riesgos:** lentitud → marcar como suite de integración separada si hace falta.
- **Fuera de alcance:** snapshot pixel del email.

#### F2-T5 — Test de integración de render/export

- **Objetivo:** cubrir `/api/render` (compilación + tema + caché) y el
  compilador de export.
- **Justificación:** generación y exportación son criterios del brief.
- **Archivos:** test para `scripts/vite/api/render.js` (o `maizzle-compiler` +
  `preview-cache`) y `scripts/exporters/compilers.js`.
- **Pasos:** invocar compilación con datos; afirmar HTML, aplicación de tema y
  hit/miss de caché; para export, afirmar HTML con datos Handlebars aplicados.
- **Dependencias:** F1-T2.
- **Aceptación:** suite verde; caché valida por `theme+dataHash`.
- **Pruebas:** es la prueba.
- **Validación:** `bun run test`.
- **Riesgos:** dependencias de binarios (puppeteer/wkhtmltoimage) → testear solo
  la capa de compilación HTML, no el render PNG.
- **Fuera de alcance:** test del binario de screenshot.

#### F2-T6 — Documentar rendimiento y Release v1.3.0 (gate de fase)

- **Objetivo:** medir y documentar tiempos de `dev` startup y `build`; publicar
  el cierre de la fase como v1.3.0.
- **Justificación:** brief "mantener tiempos de arranque y compilación
  documentados" y política de versionado por fase.
- **Archivos:** README/`docs/performance.md`, `CHANGELOG.md`, `package.json`;
  opcional script de medición.
- **Pasos:** medir cold start de `dev` y `build` (n corridas), tabular,
  documentar entorno (Bun/Node/SO); actualizar versión y changelog a `1.3.0`;
  crear tag y GitHub Release `v1.3.0`.
- **Dependencias:** plantillas finales.
- **Aceptación:** tabla de tiempos reproducible en el README/docs;
  `package.json`, changelog, tag y GitHub Release coinciden en `v1.3.0`.
- **Pruebas:** N/A.
- **Validación:** `bun run format:check`, suite CI completa y `bun run build`
  cronometrado.
- **Riesgos:** variabilidad de máquina (documentar entorno).
- **Fuera de alcance:** budget/regresión de performance en CI.

> **🚦 Checkpoint 2 — Revisión humana.** Suite unit+integración verde en CI,
> typecheck ampliado, tiempos documentados y Release v1.3.0. El proyecto cumple
> la "Definición global de terminado" salvo demo desplegada.

---

### FASE 3 — Posterior / opcional

#### F3-T1 — Demo estática pre-renderizada + deploy _(mejora posterior)_

- **Objetivo:** demo pública del dashboard sin runtime de servidor.
- **Justificación:** regla de publicación pide demo desplegada; `/api/render` no
  es estático.
- **Archivos:** script de pre-render (compila cada template a HTML estático en
  build), `src/web/features/preview/render-api.js` (fallback a HTML estático en
  modo demo), workflow de deploy (GitHub Pages/Netlify).
- **Pasos:** en `vite build`, generar HTML por template; servir esos artefactos en
  vez de `/api/render` cuando no hay servidor; deploy.
- **Dependencias:** Fase 1 y 2 completas.
- **Aceptación:** demo navegable muestra ≥4 casos; sin editor en vivo (read-only).
- **Pruebas:** smoke del build estático.
- **Validación:** `bun run build` + abrir artefacto.
- **Riesgos:** divergencia preview-en-vivo vs estático.
- **Fuera de alcance:** editor de datos en la demo pública.

#### F3-T2 — Ampliar biblioteca de componentes _(opcional)_

- **Objetivo:** más componentes con `schema.json` (footer, botón, lista, divider).
- **Justificación:** "biblioteca de componentes" como diferenciador.
- **Dependencias:** F1-T9 (guía).
- **Aceptación:** cada componente nuevo aparece en `/library` con su form.
- **Fuera de alcance:** drag-and-drop builder.

#### F3-T3 — Empaquetado npm con `bin` _(fuera de alcance del MVP — D6)_

- **Nota:** descartado por decisión (template clonable). Documentado solo como
  evolución futura; no se implementa.

---

## 7. Matriz de dependencias

| Tarea       | Depende de          | Habilita                          |
| ----------- | ------------------- | --------------------------------- |
| F0-T1       | —                   | F0-T4, F1-T1, F2-T2/T3/T4/T5      |
| F0-T2       | —                   | F0-T4, F1-T1, F1-T5..T7, F2-T3/T4 |
| F0-T3       | —                   | F0-T4, F2-T1                      |
| F0-T4       | F0-T1, F0-T2, F0-T3 | Checkpoint 0                      |
| F0-T5       | —                   | F0-T6                             |
| F0-T6       | F0-T1..T5           | **Release v1.1.0 / Checkpoint 0** |
| F1-T1       | F0-T1, F0-T2        | F1-T5..T7, F2-T3                  |
| F1-T2       | (F0)                | F1-T4, F2-T5                      |
| F1-T3       | —                   | —                                 |
| F1-T4       | F1-T2               | —                                 |
| F1-T5/T6/T7 | F1-T1, F0-T2        | F1-T8, F2-T4                      |
| F1-T8       | F1-T5..T7           | —                                 |
| F1-T9       | F1-T5..T8           | F3-T2                             |
| F2-T1       | F0-T3               | —                                 |
| F2-T2       | F0-T1               | —                                 |
| F2-T3       | F0-T2, F1-T1        | —                                 |
| F2-T4       | F0-T2, F1-T5..T8    | —                                 |
| F2-T5       | F1-T2               | —                                 |
| F2-T6       | F1-T5..T8           | —                                 |
| F3-T1       | Fase 1 + 2          | demo pública                      |

**Ruta crítica al primer hito:** F0-T1 → F0-T2/T3 → F0-T4 → F0-T5 → F0-T6.

---

## 8. Estrategia de pruebas

- **Runner:** `bun test` (D1). Patrón `**/*.test.js`, excluye `node_modules`/
  `dist`.
- **Unitarias:** helpers puros (`handlebars`, `paths`, `path-safety`, `env`,
  `validate-json`, `check-html-size`), reglas del validador de compatibilidad,
  validador de variables, funciones de estado de UI (viewport/toggle).
- **Integración:** build pipeline (Maizzle → flatten → gate), render/compile API
  (tema + caché), export compiler (Handlebars). Se aíslan en dir temporal; se
  evita depender de binarios de screenshot.
- **Gates como prueba:** F0-T2 (build falla con ERROR) y F1-T1 (variables
  faltantes) tienen tests de regresión.
- **Typecheck:** `tsc --noEmit` vía JSDoc (D2) como prueba estática en CI.
- **Lint:** `bun run lint` (html/js/md/json) se mantiene como hoy.
- **Manual mínimo:** clon limpio (`bun install && bun run dev && bun run build`),
  preview en desktop/móvil, descarga de HTML, provocar error de compilación.
- **CI:** corre lint + typecheck + test + build en cada PR (F0-T4).
- **Cobertura objetivo:** flujo crítico (compilación, validación, exportación)
  cubierto antes del Checkpoint 2; no se fija % numérico estricto.

---

## 9. Estrategia de despliegue

- **Primer hito (D7):** **sin despliegue de demo.** Entrega = GitHub Release
  `v1.1.0` (tag + notas), `CHANGELOG.md`, README con capturas y badge de CI.
- **Reproducibilidad / distribución (D6):** template clonable —
  `git clone && bun install --frozen-lockfile`. `bun.lockb` fija versiones;
  `engines` documenta Node `>=20` / Bun `>=1.0`.
- **CI/CD:** GitHub Actions valida cada cambio (no despliega). Release manual con
  changelog hasta automatizar.
- **Versionado:** SemVer y changelog estilo _Keep a Changelog_. No se incrementa
  versión por tarea: la última tarea de cada fase publica la minor correspondiente
  (`v1.1.0`, `v1.2.0`, `v1.3.0`). Las correcciones de releases publicadas
  incrementan patch.
- **Demo (posterior, F3-T1):** previews estáticos pre-renderizados en GitHub
  Pages/Netlify (read-only), porque `/api/render` requiere runtime.
- **Política de `dist/`:** decidir en F0-T5 (recomendado: no commitear artefactos
  de build; mantener `dist/` reproducible vía `bun run build`).

---

## 10. Definición global de terminado

El proyecto se considera terminado (alineado con los criterios del brief y la
regla de publicación) cuando:

1. `bun install` desde un **clon limpio** + `bun run dev` + `bun run build`
   funcionan sin pasos manuales.
2. Existen **4 plantillas profesionales** (`welcome`, `password-reset`,
   `receipt`, `newsletter`) que compilan a `dist/<t>.html`, preservan `{{ }}` y
   pasan el validador sin ERRORs.
3. Un **usuario nuevo genera un email** desde el dashboard sin tocar el motor.
4. Las **variables faltantes se reportan** antes de exportar (F1-T1).
5. Los **errores de compilación** se muestran con causa/ubicación en la UI
   (F1-T2).
6. El **HTML exportado** pasa el gate de compatibilidad (ERROR=0) (F0-T2/D3).
7. **CI verde**: lint + typecheck + test + build (F0-T4).
8. **Pruebas** del flujo crítico (unit + integración) verdes (Fase 2).
9. **README** con problema/solución/arquitectura/ejecución, **capturas** desktop
   y móvil, tabla de compatibilidad y guía de componentes (F0-T6, F1-T9).
10. **Sin referencias** a cursos/challenges/clones; metadata de GitHub
    actualizada (F0-T5/T6).
11. **Release versionada** con changelog (F0-T6).
12. _(Posterior)_ Demo desplegada con ≥4 casos (F3-T1) — fuera del primer hito.

---

## 11. Preguntas bloqueantes

Las dos decisiones materiales fueron resueltas con el usuario:

- **Demo / hosting:** _sin demo en el primer hito_ (Release + README + capturas);
  demo estática diferida a Fase 3.
- **Distribución:** _template clonable_ (git + `bun install`), sin publicar a npm.

**No quedan preguntas bloqueantes.** Decisiones menores adoptadas como
suposiciones razonables y documentadas (D1–D9, S1–S3); cualquiera puede
revisarse en su checkpoint sin alterar la ruta crítica al primer hito. Punto
abierto no bloqueante a confirmar en F0-T5: **política de `dist/` en el repo**
(commitear vs ignorar) — recomendación: ignorar.
