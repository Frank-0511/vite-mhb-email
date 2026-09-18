# MHB-29 a MHB-34 — Migración total a TypeScript Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrar gradualmente todo el JavaScript propio de EmailForge Toolkit a TypeScript estricto, sin cambiar comportamiento, contratos públicos ni output de email.

**Architecture:** MHB-13 crea un baseline `checkJs` completo antes de renombrar archivos. MHB-29 habilita convivencia temporal; MHB-30 a MHB-33 convierten capas en orden de dependencias; MHB-34 elimina `allowJs`/`checkJs`, activa rigor global y exige inventario JavaScript propio en cero.

**Tech Stack:** Bun 1.3.13, Node.js 24, TypeScript 6.0.3, ESM, Vite 8, Maizzle 5, Handlebars, Bun Test, ESLint 10.

**Spec:** `docs/implementation/PLAN.md`

## Global Constraints

- Usar Bun; no npm, npx, Yarn ni pnpm.
- Preservar `bun run build`, `bun run build-selective <template>` y todos los comandos públicos.
- Preservar `[[ page.* ]]`, `{{ }}` y placeholders SendGrid Legacy `-variable-`.
- Mantener validación runtime en todo límite externo aunque exista un tipo estático.
- Un renombre `.js`/`.mjs` → `.ts` no autoriza cambios de comportamiento ni refactors no requeridos.
- No introducir React, JSX, decorators ni emisión JavaScript versionada.
- Ejecutar cada MHB en `feature/<id-en-minusculas>` y entregarla a `En revisión`; un revisor distinto dicta `Completada`.
- Capturar hashes de `dist/*.html` antes y después de toda tarea que alcance build, render o UI.
- No empezar MHB-33 hasta cerrar MHB-28 y MHB-32.
- No empezar MHB-15 hasta cerrar MHB-14 y MHB-34.

---

### Task 1: MHB-13 — Baseline completo de `checkJs`

**Files:**

- Modify: `tsconfig.json`
- Create when required: `types/assets.d.ts`
- Create when required: `types/vite-env.d.ts`
- Modify: `scripts/**/*.js`, `scripts/**/*.mjs`, `src/**/*.js`
- Modify: root `*.config.js` files only for annotations; do not rename them
- Test: all existing `*.test.js`
- Modify: `docs/implementation/STATUS.md`

**Interfaces:**

- Consumes: MHB-20 integration baseline and current ESM imports.
- Produces: a zero-diagnostic JavaScript baseline and exact inventory consumed by MHB-29.

- [ ] **Step 1: Record the baseline inventory and diagnostics**

Run:

```bash
rg --files -g '*.js' -g '*.mjs' -g '!dist/**' | sort
bun run typecheck
bun run test
```

Expected: inventory saved in the MHB-13 evidence; official typecheck and 494-test-or-higher suite pass before scope expansion.

- [ ] **Step 2: Expand typecheck scope before fixing diagnostics**

Modify `tsconfig.json` includes so root configs, `scripts/**`, `src/**` and tests are checked with the appropriate Node/DOM libraries. Add ambient modules only for real non-code boundaries:

```ts
declare module "*.css";

interface ImportMeta {
  readonly hot?: import("vite").ViteHotContext;
}
```

Run `bun run typecheck` and record the failing diagnostic count and file distribution.

- [ ] **Step 3: Correct JSDoc and declarations by directory**

Resolve errors in this order: root configs, `scripts/shared`, `scripts/build`, `scripts/validators`, remaining `scripts`, `src/web`, tests. Use `unknown` plus runtime narrowing at external boundaries; do not replace validation with assertions.

- [ ] **Step 4: Verify the complete JavaScript baseline**

Run:

```bash
bun run lint
bun run typecheck
bun run test
bun run format:check
bun run build
bun run validate-email
git diff --check
```

Expected: all commands pass and no file has been renamed to `.ts`.

- [ ] **Step 5: Record performance and handoff**

Record Bun, Node, OS, command, repetitions, median/range and the final directory inventory in `docs/implementation/STATUS.md`; set MHB-13 to `En revisión`.

- [ ] **Step 6: Commit the independently reviewable baseline**

```bash
git add tsconfig.json types scripts src docs/implementation/STATUS.md
git commit -m "chore: establish complete JavaScript type baseline"
```

### Task 2: MHB-29 — Mixed TypeScript execution foundation

**Files:**

- Modify: `tsconfig.json`
- Create as needed: `tsconfig.node.json`, `tsconfig.web.json`, `tsconfig.test.json`
- Modify: `package.json`, `eslint.config.js`, lockfile only if a direct loader dependency is proven necessary
- Modify/Create: `types/*.d.ts`
- Create: `scripts/validators/check-typescript-migration.ts`
- Create: `scripts/validators/check-typescript-migration.test.ts`
- Modify: `docs/implementation/STATUS.md`

**Interfaces:**

- Consumes: exact MHB-13 inventory and ambient declarations.
- Produces: strict `.ts` support and a deterministic remaining-JavaScript counter used by MHB-30 to MHB-34.

- [ ] **Step 1: Write the failing inventory-guard test**

Test that the guard classifies first-party `.js`/`.mjs` by `scripts`, `src`, and root config, while excluding `dist`, dependencies and read-only synchronized material. Run:

```bash
bun test scripts/validators/check-typescript-migration.test.ts
```

Expected: FAIL because the guard does not exist.

- [ ] **Step 2: Implement the deterministic inventory guard**

Export a pure function returning this contract:

```ts
export interface MigrationInventory {
  total: number;
  byArea: Readonly<Record<string, number>>;
  files: readonly string[];
}
```

The CLI exits zero while migration remains in progress and accepts `--require-zero` for MHB-34.

- [ ] **Step 3: Separate Node, browser and test compiler contexts**

Keep shared strict options in `tsconfig.json`; give Node configs `types: ["node"]`, browser config `lib: ["ES2022", "DOM", "DOM.Iterable"]`, and tests the Bun test declarations actually required by the suite.

- [ ] **Step 4: Prove each loader with one non-production pilot**

Use the guard and its test as the `.ts` pilot. Verify Bun, Node 24, Vite, ESLint, Maizzle, Tailwind and PostCSS configuration loading without changing product source extensions.

- [ ] **Step 5: Run the complete mixed-mode gate**

```bash
bun run lint
bun run typecheck
bun run test
bun run format:check
bun run build
bun run validate-email
git diff --check
```

- [ ] **Step 6: Record loader matrix and commit**

Update STATUS with tool, command, TypeScript loading mechanism and result; set MHB-29 to `En revisión`.

```bash
git add tsconfig*.json package.json bun.lock eslint.config.js types scripts/validators docs/implementation/STATUS.md
git commit -m "build: establish mixed TypeScript execution"
```

### Task 3: MHB-30 — Core, build, ESP and validators

**Files:**

- Rename and modify: `scripts/shared/**/*.js` → `.ts`
- Rename and modify: `scripts/build/**/*.js` → `.ts`
- Rename and modify: `scripts/esp/**/*.js` → `.ts`
- Rename and modify: `scripts/validators/**/*.js` → `.ts`
- Rename and modify: `src/emails/**/*.test.js` → `.test.ts`
- Modify: all direct importers and `package.json` command paths
- Modify: `docs/implementation/STATUS.md`

**Interfaces:**

- Consumes: MHB-29 strict configs and inventory guard.
- Produces: typed domain/build/validation contracts for MHB-31 and MHB-32.

- [ ] **Step 1: Capture build hashes and focused test baseline**

Run build, validation, focused suites for the four directories and hash every tracked `dist/*.html`.

- [ ] **Step 2: Migrate `scripts/shared` with its tests**

Rename implementation and test pairs together, export shared types only when consumed outside the defining module, update imports, then run focused tests and typecheck.

- [ ] **Step 3: Migrate `scripts/esp` and `scripts/build`**

Preserve runtime parsing and delimiter behavior. After each directory, run focused tests plus `bun run build` and compare `dist` hashes.

- [ ] **Step 4: Migrate validators and the email partial test**

Keep rule severities and public result shapes unchanged. Run every validator test and `bun run validate-email`.

- [ ] **Step 5: Prove the layer is complete**

Run the full gate and verify the migration inventory has zero JS/MJS in all MHB-30-owned paths.

- [ ] **Step 6: Update STATUS and commit**

```bash
git add scripts/shared scripts/build scripts/esp scripts/validators src/emails package.json docs/implementation/STATUS.md
git commit -m "refactor: migrate core pipeline to TypeScript"
```

### Task 4: MHB-31 — CLI, export, generators and mail

**Files:**

- Rename and modify: `scripts/cli/**/*.js` → `.ts`
- Rename and modify: `scripts/export/**/*.js` → `.ts`
- Rename and modify: `scripts/generators/**/*.js` → `.ts`
- Rename and modify: `scripts/mail/**/*.js` → `.ts`
- Modify: `package.json`, README command references, imports and `docs/implementation/STATUS.md`

**Interfaces:**

- Consumes: MHB-30 typed build, paths, validation and ESP contracts.
- Produces: typed operational entrypoints consumed by users and MHB-34 documentation closure.

- [ ] **Step 1: Capture positive and negative CLI behavior**

Record command names, arguments, prompts, exit codes and actionable failures for missing arguments, invalid names, missing browser and incomplete mail configuration.

- [ ] **Step 2: Migrate helpers and tests before entrypoints**

Type child processes without shell, prompt answers, filesystem results, Puppeteer injection and Nodemailer errors. Run the focused test after each pair.

- [ ] **Step 3: Migrate entrypoints and update exact command paths**

Change only source extensions in `package.json` and README examples; preserve every script name and argument.

- [ ] **Step 4: Execute safe smokes**

Use temporary directories for generation/build; exercise export startup failure without opening a browser and mail validation without sending messages.

- [ ] **Step 5: Run full gates and inventory check**

Expected: all gates pass and owned paths contain no JS/MJS.

- [ ] **Step 6: Update STATUS and commit**

```bash
git add scripts/cli scripts/export scripts/generators scripts/mail package.json README.md docs/implementation/STATUS.md
git commit -m "refactor: migrate operational tooling to TypeScript"
```

### Task 5: MHB-32 — Vite server, APIs, services and plugins

**Files:**

- Rename and modify: `scripts/vite/**/*.js` → `.ts`
- Rename and modify: `vite.config.js` → `vite.config.ts`
- Modify: imports, tests, package/lint configuration, API documentation and `docs/implementation/STATUS.md`

**Interfaces:**

- Consumes: typed core and CLI-independent contracts from MHB-30/MHB-31.
- Produces: typed API payloads and service interfaces consumed by MHB-33.

- [ ] **Step 1: Capture endpoint and integration baseline**

Record method, route, success/error status, headers and payload for templates, data, render, cache, components and copy-html; run MHB-20 integration evidence.

- [ ] **Step 2: Migrate libraries and services**

Type injected dependencies, cache keys, render results and normalized errors as explicit interfaces/unions; preserve runtime narrowing.

- [ ] **Step 3: Migrate APIs and plugins**

Use Node/Vite request and response types, retain guards for every URL/body value, and update service imports before each focused test.

- [ ] **Step 4: Migrate `vite.config.ts` and verify development loading**

Run a non-browser Vite config/server smoke permitted by the project; do not open the Browser pane.

- [ ] **Step 5: Run API, integration and global gates**

Compare endpoint contracts and output hashes with Step 1. Inventory must show zero JS/MJS in `scripts/vite` and Vite config.

- [ ] **Step 6: Update STATUS and commit**

```bash
git add scripts/vite vite.config.ts package.json docs README.md docs/implementation/STATUS.md
git commit -m "refactor: migrate Vite server to TypeScript"
```

### Task 6: MHB-33 — Web dashboard

**Files:**

- Rename and modify: `src/web/shared/**/*.js` → `.ts`
- Rename and modify: `src/web/features/home/**/*.js` → `.ts`
- Rename and modify: `src/web/features/library/**/*.js` → `.ts`
- Rename and modify: `src/web/features/preview/**/*.js` → `.ts`
- Modify: corresponding HTML module entrypoints, tests and `docs/implementation/STATUS.md`

**Interfaces:**

- Consumes: completed MHB-28 module boundaries and MHB-32 typed API contracts.
- Produces: fully typed Home, Library and Preview for final closure.

- [ ] **Step 1: Capture UI contracts and output hashes**

Record required IDs/classes/ARIA, storage keys, API routes and the six width/theme manual cases. Hash `dist/*.html`.

- [ ] **Step 2: Migrate shared utilities and Home**

Use generic DOM query helpers returning precise element types; type IntersectionObserver and iframe loading; convert tests together with modules.

- [ ] **Step 3: Migrate Library**

Define component/schema/form state types, type events via narrowed `currentTarget`, preserve skeleton and selection behavior, then run focused tests.

- [ ] **Step 4: Migrate Preview**

Convert leaf modules before `main.ts`; type editor CDN, HMR, iframe manager, render state, save/reset, viewport and copy/download discriminated results. Preserve all runtime guards.

- [ ] **Step 5: Run automatic and manual UI gates**

Run lint, strict typecheck, tests, format, build, email validation, contrast and a11y. Then execute the documented 375/768/1440 dark/light walkthrough without accepting any visual or email-output change.

- [ ] **Step 6: Verify inventory, update STATUS and commit**

```bash
git add src/web docs/implementation/STATUS.md
git commit -m "refactor: migrate dashboard to TypeScript"
```

### Task 7: MHB-34 — Strict global closure

**Files:**

- Rename and modify: `scripts/ai/**/*.js`, `scripts/ai/**/*.mjs` → `.ts`
- Rename and modify: remaining root `*.config.js` → supported `.ts` equivalents
- Modify: `package.json`, `tsconfig*.json`, ESLint/lint-staged, README and all maintained docs referencing old paths
- Modify: `scripts/validators/check-typescript-migration.ts`
- Modify: `docs/implementation/STATUS.md`

**Interfaces:**

- Consumes: all migrated layers and the MHB-29 inventory guard.
- Produces: strict TypeScript-only first-party repository accepted by MHB-15.

- [ ] **Step 1: List every residual JavaScript file**

Run the inventory guard and `rg --files -g '*.js' -g '*.mjs'`. Classify every result as first-party scope or documented external/generated exclusion; no first-party exception is allowed.

- [ ] **Step 2: Migrate AI tooling and root configs**

Preserve `agents:sync`, `agents:check`, branch guard, ESLint, Maizzle, PostCSS and both Tailwind configs. Verify each tool immediately after its config/entrypoint rename.

- [ ] **Step 3: Remove transitional compiler options**

Set the global compiler contract to:

```json
{
  "strict": true,
  "noImplicitAny": true,
  "strictNullChecks": true,
  "allowJs": false
}
```

Remove `checkJs` and any JavaScript-only includes. Reject unjustified `any`, `@ts-ignore` and untracked loader exceptions.

- [ ] **Step 4: Make zero JavaScript a permanent gate**

Wire `check-typescript-migration.ts --require-zero` into the maintained verification path and add a negative test proving a synthetic `.js` file fails the guard.

- [ ] **Step 5: Update every maintained path reference**

Search README, package scripts, docs, workflows and code for `.js`/`.mjs`; update first-party references while leaving third-party names and historical changelog text intact where accuracy requires it.

- [ ] **Step 6: Run the final acceptance matrix**

```bash
bun install --frozen-lockfile
bun run lint
bun run typecheck
bun run test
bun run format:check
bun run build
bun run validate-email
bun run lint:contrast
bun run a11y-check
bun run agents:check
git diff --check
```

Expected: all pass, final first-party JS/MJS inventory is zero, UI walkthrough passes, and `dist` hashes match the approved baseline.

- [ ] **Step 7: Update STATUS and commit**

Record the zero inventory, complete gate outputs, residual external/generated exclusions and reviewer handoff; set MHB-34 to `En revisión`.

```bash
git add scripts package.json bun.lock tsconfig*.json *.config.ts README.md docs
git commit -m "refactor: complete strict TypeScript migration"
```

## Plan self-review

- Spec coverage: MHB-13 and MHB-29 through MHB-34 each have scope, dependencies, acceptance, verification, evidence and handoff.
- Placeholders: no marker, deferred implementation or unspecified “add tests” step remains.
- Type consistency: `MigrationInventory` and `--require-zero` are introduced in MHB-29 and consumed unchanged in MHB-30 through MHB-34.
- Scope: React, behavioral redesign, release/tag publication and output changes remain excluded.
