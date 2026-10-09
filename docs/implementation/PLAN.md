# Plan de implementación — EmailForge Toolkit

Este documento contiene únicamente el trabajo pendiente. El baseline funcional
publicado es `v1.2.0`; los artefactos de Git y `STATUS-HISTORY.md` conservan la
trazabilidad de los IDs cerrados.

## Objetivo vigente

Publicar el trabajo acumulado desde `v1.2.0` en releases incrementales, una por
fase. Primero se cierra la puerta de calidad con evidencia en clientes reales y
se publica `v1.3.0`; después se reduce y desacopla el tooling (dependencias y
multi-package-manager) para publicar `v1.4.0`. La migración de stack de estilos
y la demo de portafolio se planifican como fases propias.

## Matriz de reestructuración del plan (2026-10-08)

| Ítem                               | Decisión  | Tratamiento vigente                                                                                    |
| ---------------------------------- | --------- | ------------------------------------------------------------------------------------------------------ |
| Fases                              | Ajustar   | Cada fase termina con su propio ID de release; no se espera al backlog completo para publicar.         |
| MHB-44, MHB-46, MHB-47, MHB-42, 34 | Retirar   | Completadas; sus contratos salen del plan y su contenido forma parte de `v1.3.0`.                      |
| MHB-14                             | Conservar | Último ID de la Fase C; su cierre habilita la release `v1.3.0`.                                        |
| MHB-15                             | Ajustar   | Release `v1.3.0`; depende solo de MHB-14 (resto de su alcance ya completado).                          |
| MHB-43                             | Retirar   | Completada (2026-10-08) antes del congelamiento de MHB-15; entra en `v1.3.0`.                          |
| MHB-36                             | Mover     | Fase D; forma la release `v1.4.0`.                                                                     |
| MHB-48                             | Mover     | Fase D si su disparador externo se cumple antes del congelamiento de MHB-49; si no, release siguiente. |
| MHB-49                             | Crear     | Release `v1.4.0` tras MHB-36.                                                                          |
| MHB-38                             | Mover     | Fase E propia, dentro de su ventana (≥ 2027-01-15).                                                    |
| MHB-50                             | Crear     | Release de la Fase E tras MHB-38; versión SemVer decidida al congelar.                                 |
| MHB-16, MHB-23                     | Mover     | Fase F (demo y portafolio), ejecutable en paralelo desde `v1.3.0`.                                     |

No se reabre ninguna tarea completada. Cada ID conserva una rama, revisión y
cierre independientes.

## Backlog activo

| Fase | ID     | Entregable                                    | Estado    | Dependencia vigente            |
| ---- | ------ | --------------------------------------------- | --------- | ------------------------------ |
| C    | MHB-14 | Evidencia de uso y compatibilidad             | Pendiente | Satisfecha                     |
| C    | MHB-15 | Release `v1.3.0`                              | Pendiente | MHB-14                         |
| D    | MHB-36 | Compatibilidad multi-package-manager          | Pendiente | Satisfecha (MHB-43 completada) |
| D    | MHB-48 | Actualización a TypeScript 7                  | Pendiente | Disparador externo             |
| D    | MHB-49 | Release `v1.4.0`                              | Pendiente | MHB-15 y MHB-36                |
| E    | MHB-38 | Migración en bloque a Maizzle 6 y Tailwind v4 | Pendiente | MHB-36 y ventana ≥ 2027-01-15  |
| E    | MHB-50 | Release de la migración de stack              | Pendiente | MHB-49 y MHB-38                |
| F    | MHB-16 | Demo candidata pre-renderizada                | Opcional  | MHB-15                         |
| F    | MHB-23 | Ampliar biblioteca de componentes             | Opcional  | Caso de uso aprobado           |

## Invariantes de calidad, arquitectura y refactor integrado

A partir de `v1.2.0`, todo trabajo técnico en EmailForge Toolkit debe regirse por estos principios obligatorios. No se crean tareas de refactor aisladas: la mejora estructural y el saneamiento de deuda técnica se ejecutan de forma continua como parte de cada entrega activa.

### 1. Reglas de codificación y límites estrictos

- **Límites de tamaño de archivo:** ningún archivo fuente (no-test) puede superar 250 líneas de código. Los archivos de test no deben superar 400 líneas (si crecen, deben dividirse por suite de pruebas o escenario).
- **Límites de directorio:** ningún directorio debe contener más de 8 archivos fuente sin estructurarse en subdirectorios temáticos por dominio (los tests co-locados no se contabilizan para este límite, pero no justifican directorios planos desordenados).
- **Responsabilidad única:** un archivo resuelve una sola responsabilidad. Si un módulo realiza parsing Y formateo, o validación Y reporte, debe dividirse en módulos especializados.
- **Shared first:** antes de implementar una función utilitaria o helper, revisar `scripts/shared/` o `src/web/shared/utils/`. Si existe, reutilizarla; si no existe pero tiene potencial reutilizable (≥2 consumidores), ubicarla en `shared/`. No hardcodear constantes de almacenamiento (`storage-keys.ts`), breakpoints, magic numbers (e.g. `1024` para KB) ni cabeceras HTTP. En el frontend, el acceso al DOM y llamadas remotas deben usar exclusivamente `dom-helpers.ts` (`queryRequired`, `querySafe`) y `http-helpers.ts` (`fetchJSON`, `postJSON`, `debounce`).
- **Menos es más:** preferir eliminar código obsoleto o simplificar flujos antes que crear abstracciones preventivas o capas intermedias de una sola línea sin valor agregado.
- **Convención de nombres:** archivos en `kebab-case`, constantes exportadas en `UPPER_SNAKE_CASE`, funciones en `camelCase`, Web Components con prefijo `ef-`, y tests co-locados con sufijo `.test.ts`.

### 2. Arquitectura de carpetas escalable (patrón feature-module)

Toda feature frontend o paquete de scripts debe organizarse bajo una jerarquía predecible y replicable a cualquier nivel de profundidad:

```text
feature-o-paquete/
├── main.ts (o index.ts)      # Punto de entrada cohesivo: solo bootstrap y exports
├── feature.html              # Markup exclusivo si aplica
├── styles/                   # Hojas de estilo divididas por dominio temático
│   ├── layout.css
│   └── theme.css
└── modules/ (o subcarpetas)  # Lógica modular organizada por subdominio
    ├── controls/
    │   ├── component.ts
    │   └── component.test.ts
    └── render/
        ├── render-api.ts
        └── render-api.test.ts
```

Criterios para crear subdirectorios:

- Más de 8 archivos fuente en un mismo directorio.
- Tres o más archivos que compartan un prefijo temático (e.g. `esp-*`, `copy-html-*`).
- Extracción de un módulo en múltiples piezas auxiliares.

### 3. Re-análisis obligatorio de mantenibilidad por tarea

Todo plan de implementación y contrato técnico futuro debe incluir obligatoriamente una sección de **Análisis de mantenibilidad**:

1. Inventario de archivos intervenidos y líneas de código.
2. Identificación de responsabilidades por archivo y plan de división si superan 250 líneas o mezclan dominios.
3. Detección de duplicación o constantes hardcodeadas y plan de migración a `shared/`.
4. Revisión de carpetas planas y plan de subdirectorios.

El cumplimiento de estos criterios es condición indispensable para que un revisor independiente marque una tarea como `Completada`.

## Fase C — Evidencia y release v1.3.0

- **Contenido de la release:** todo lo completado y mergeado en `master` desde `v1.2.0` (`git log v1.2.0..master`: migración TypeScript completa hasta MHB-34, gobernanza MHB-40, contrato de salida MHB-41, protección de `master` MHB-45, compatibilidad HTML MHB-44, API local MHB-46 y contrato ESP MHB-47, higiene de dependencias MHB-43) más MHB-14.
- **Orden:** MHB-14 → MHB-15.
- **Riesgos:** afirmar evidencia de clientes sin pruebas; incluir secretos en capturas o documentación; publicar sin el checklist Go/No-Go.
- **Criterio de salida:** MHB-14 cerrada con evidencia enlazable y `v1.3.0` publicada por MHB-15.

### MHB-14 — Evidencia de uso y compatibilidad

- **Objetivo observable:** producir checklist reproducible de accesibilidad y matriz fechada de clientes reales.
- **Superficies autorizadas:** protocolo/checklist, capturas, matriz documental y templates de producto.
- **Dependencias y precondiciones:** MHB-44 completada, para que la evidencia en clientes reales se tome sobre el HTML ya corregido (colores, unidades e imágenes); el flujo de producto permanece disponible y se dispone de los clientes/dispositivos declarados.
- **Pasos técnicos:** definir criterios de teclado/lector, ejecutar protocolo en Gmail, Outlook y Apple Mail, y registrar límites.
- **Criterios de aceptación:** cada prueba tiene fecha, cliente, criterio, resultado y evidencia; no se sustituyen clientes reales por un validador estático.
- **Validación automática:** validadores disponibles y lint de matriz, sin presentarlos como prueba real.
- **Validación manual:** teclado, lector y clientes de correo según protocolo.
- **Evidencia requerida:** matriz por cliente/criterio, capturas sin secretos y limitaciones.
- **Riesgos y reversión:** afirmar cobertura no realizada o filtrar datos; usar cuentas/fixtures seguros y marcar no verificado.
- **Envíos reales:** los correos de prueba pueden enviarse con la integración ESP (SendGrid) del usuario usando `dist/<template>.html`, solo con autorización explícita por envío, destinatarios de prueba propios y sin API keys, tokens ni direcciones reales en capturas, `STATUS.md` o el repositorio. Esa integración vive fuera de este repositorio y no se incorpora a él.
- **Exclusiones específicas:** no certificar accesibilidad ni compatibilidad universal.
- **Implementador:** perfil de evidencia/compatibilidad, alto.
- **Revisor independiente:** orquestador o revisor con acceso a clientes.
- **Condición de escalamiento:** falta acceso a cliente/dispositivo o aparecen datos sensibles.

### MHB-15 — Release v1.3.0

- **Objetivo observable:** publicar `v1.3.0` con README, CHANGELOG, versión, tag y release coherentes con el trabajo completado desde `v1.2.0`.
- **Superficies autorizadas:** README, CHANGELOG, versión/package metadata, capturas, notas de release y documentación relacionada.
- **Dependencias y precondiciones:** MHB-14 completada (el resto del contenido de la release ya está `Completada`), CI verde en `master` y decisión explícita del usuario antes de publicar o etiquetar; preservar el baseline publicado `v1.2.0`.
- **Versión decidida (2026-10-08):** `v1.3.0` (minor). La API pública son los comandos listados en `CLAUDE.md` (`dev`, `build`, `test`, `lint`, `typecheck`, `validate-email`, `check:dist-baseline`, `format:check`, etc.); el resto de scripts de `package.json` son herramientas internas que pueden cambiar en un minor con nota de migración en `CHANGELOG.md`. Desde `v1.2.0` no cambió ningún comando de esa lista.
- **Congelamiento de alcance:** al pasar MHB-15 a `En progreso` se congela el alcance. Un hallazgo nuevo se registra como ID de la Fase D y no bloquea la release, salvo que rompa un gate de MHB-41 (hashes de `dist/`, variables ESP `{{ }}`, `validate-email`), la suite o el build; solo esos casos bloquean y se corrigen dentro del alcance congelado. Un ID de la Fase D mergeado antes del congelamiento forma parte de `v1.3.0` y se declara en sus notas.
- **Pasos técnicos:**
  - Aplicar la skill `release-management`: checklist Go/No-Go con cada ID de la release `Completada` y CI verde en `master`.
  - Reconciliar narrativa y evidencia; mover `[Unreleased]` a `[1.3.0]` en CHANGELOG; actualizar `package.json`; preparar tag/release solo tras revisión.
  - Incluir en CHANGELOG y notas de release una sección «Contrato de salida para integradores»: resultado de `check:dist-baseline` frente a `v1.2.0` (diferencias justificadas por template, introducidas por MHB-44) y confirmación de que las variables ESP `{{ }}` de cada template se conservan, con referencia al manifiesto `dist/esp-manifest.json` (MHB-47).
- **Criterios de aceptación:** documentación, versión, tag y release coinciden; las capturas son actuales y los límites no se presentan como hechos no probados; la sección de contrato de salida existe y coincide con la salida de `check:dist-baseline`.
- **Validación automática:** lint Markdown, suite, build, `validate-email`, `check:dist-baseline` y comprobación de consistencia de versión.
- **Validación manual:** revisar README, capturas, changelog, SHA/tag y notas antes de publicar.
- **Evidencia requerida:** SHA, tag, URL de release, diff final, checklist de capturas y checklist Go/No-Go firmado por el orquestador.
- **Riesgos y reversión:** publicar una afirmación adelantada; detener antes de acciones externas y revertir documentación local si corresponde.
- **Exclusiones específicas:** no publicar automáticamente ni modificar tags o releases ya publicados.
- **Implementador:** perfil documentación/release, medio.
- **Revisor independiente:** orquestador.
- **Condición de escalamiento:** cualquier publicación, tag, versión o evidencia no sustentada, o un hallazgo que se proponga incluir pese al congelamiento de alcance.

## Fase D — Portabilidad y release v1.4.0

- **Contenido de la release:** MHB-36 y, si su disparador se cumple antes del congelamiento, MHB-48 (MHB-43 ya entra en `v1.3.0`).
- **Orden:** MHB-36 → MHB-49; MHB-48 en paralelo con MHB-36 por no compartir superficie.
- **Entregables:** compatibilidad con npm, yarn, pnpm y bun, tests en Vitest y release `v1.4.0`.
- **Riesgos:** incompatibilidades sutiles entre package managers o drift transitivo sin lockfile; romper un comando público.
- **Criterio de salida:** MHB-36 confirma que el proyecto funciona con los 4 managers; `dist/` idéntico al baseline en el carril congelado con bun.lock y `v1.4.0` publicada por MHB-49.

### MHB-36 — Compatibilidad multi-package-manager

- **Objetivo observable:** cualquier desarrollador clona el proyecto y trabaja con npm, yarn, pnpm o bun sin que ninguno sea obligatorio. Los scripts se ejecutan con `node` (type stripping nativo), los tests con Vitest y la CLI lanza procesos con el package manager detectado.
- **Diagnóstico al 2026-10-08 (post MHB-43):**
  - Con Node 22.23.1 local, `node` ejecuta sin cambios `build`, `validate-email`, `check:dist-baseline`, `check-size`, `lint` y `check:a11y`, y `dist/` queda idéntico.
  - Acoplamiento a Bun:
    - 19 scripts `bun <archivo>.ts` en `package.json`, el encadenado `lint` con `bun run` y la entrada de `lint-staged` para `data.json`.
    - 4 hooks Husky y el shebang `#!/usr/bin/env bun` de `scripts/ai/check-task-branch.ts`.
    - 4 `run("bun", …)` en `scripts/cli/actions.ts` y el `spawn("bun", …)` de `scripts/build/ensure-build.ts`.
    - Comandos `bun` en `scripts/perf/measure-benchmarks.ts` y el mensaje legacy `'yarn build'` en `scripts/cli/template-prompts.ts`.
    - Unos 25 mensajes o comentarios de uso con `bun run …`.
    - `"packageManager": "bun@1.3.13"`, que hace que pnpm aborte localmente con «This project is configured to use bun».
  - Tests: 103 archivos `*.test.ts` más `src/web/features/preview/modules/runtime/test-helpers.ts` importan `bun:test`, con 795 tests. Usan `mock` (7), `spyOn` (6), el tipo `Mock` (5), el matcher `toBeString` exclusivo de Bun (2 archivos) e `import.meta.dir` exclusivo de Bun (`scripts/vite/plugins/dashboard.test.ts`). No usan `mock.module`. 3 archivos usan `process.chdir`.
  - `overrides.postcss` (`8.5.23`) contradice la dependencia directa `postcss@8.5.28`; npm la rechaza (`EOVERRIDE`).
  - `.env` lo carga Bun automáticamente; con Node solo lo carga `loadEnv()` en `scripts/shared/env/env.ts`, que ya usan los envíos de correo (sin cambio necesario).
- **Ensayos verificados el 2026-10-08 en un worktree desechable:**
  - **Migración a Vitest:** el codemod del plan y `vitest@5.0.3` (`pool: "forks"`) dejan 103/103 archivos y 795/795 tests en verde. `tsc` queda con 0 errores tras 2 retoques: `menu-filter.test.ts` y retirar un `@ts-expect-error` sobrante. ESLint queda limpio.
  - **Resolución transitiva sin lockfile (hecho comprobado el 2026-10-09):** el ensayo preliminar con Yarn 4.18.1 no es reproducible sin lockfile. `bun.lock` fija `html-crush@6.1.3`, `email-comb@7.1.3` y `string-strip-html@13.5.3`, mientras que npm ya publicaba `6.3.5`, `7.4.5` y `13.7.7` (todas del 2026-09-29). Un install sin lockfile resuelve esas versiones y cambia el espaciado y saltos de línea de `dist/`, sin perder variables ESP. Yarn requiere `.yarnrc.yml` con `nodeLinker: node-modules` (Plug'n'Play no es compatible con Vite y Maizzle).
- **Decisiones aprobadas (2026-10-08):**
  - **Lockfiles: cada quien decide el suyo.** El repo versiona `bun.lock` porque es el manager del mantenedor; `package-lock.json`, `yarn.lock` y `pnpm-lock.yaml` se ignoran en Git. Quien haga fork puede versionar el suyo. El código no depende de ningún lockfile: la CI instala con yarn, npm y pnpm desde cero en cada PR y exige build, validate-email, check-size, typecheck y test; `check:dist-baseline` es gate estricto solo del carril congelado con bun.
  - **Yarn:** solo `.yarnrc.yml` con `nodeLinker: node-modules`; sin binario versionado ni `yarnPath`. Sin campo `packageManager`, porque bloquea a los demás managers.
  - **Detección del manager:** sin variable `.env`. Se usa `npm_config_user_agent` (el manager que lanzó el script) y, sin él (hooks, `node` directo), `npm`, que viene con Node.
  - Windows no está soportado y se documenta.
  - La CI conserva `oven-sh/setup-bun` solo para la instalación congelada del carril principal, que ejecuta los scripts con Node 24. Un job matricial instala npm, yarn y pnpm desde cero.
  - Un ID, una rama, una PR y un commit por fase, con un subagente nuevo por fase.
  - **PR externas (2026-10-09):** un fork puede usar el manager que quiera en su propio repositorio, pero una PR hacia este repo no puede cambiar la CI ni agregar lockfiles ajenos. En las PR desde forks, GitHub ejecuta el `ci.yml` de la rama de la PR, así que sus checks podrían salir verdes con una CI modificada. Para evitarlo:
    - Se añade el workflow `pr-guard.yml` con `pull_request_target`: se ejecuta desde `master`, no hace checkout del código de la PR y falla si la PR agrega `package-lock.json`, `yarn.lock` o `pnpm-lock.yaml`, o si una PR desde un fork toca `.github/`.
    - Se añade `CONTRIBUTING.md` con esa política.
    - Los workflows de PR externas requieren aprobación manual (aplicado el 2026-10-09: `approval_policy = all_external_contributors`).
    - Se descarta `CODEOWNERS` con revisión obligatoria: no aporta con un mantenedor único y bloquearía el auto-merge de Dependabot, que toca `package.json`, `bun.lock` y `.github/workflows/`.
- **Superficies autorizadas:**
  - Configuración raíz: `package.json`, `bun.lock`, `.yarnrc.yml` (nuevo), `.gitignore`, `vitest.config.ts` (nuevo), `pnpm-workspace.yaml` (nuevo, solo si pnpm lo exige para permitir el build de `puppeteer`); se eliminan `bunfig.toml` y `types/bun-test.d.ts`.
  - Hooks y CI: `.husky/*`, `.github/workflows/ci.yml`, `.github/workflows/audit.yml` y `.github/workflows/pr-guard.yml` (nuevo).
  - Detección y runner: `scripts/shared/env/detect-pm.ts` (nuevo) y `scripts/pm/run-scripts.ts` (nuevo), con sus tests.
  - Módulos con comandos o mensajes del package manager listados en el diagnóstico, con sus tests.
  - Todos los `*.test.ts` y `test-helpers.ts`.
  - Documentación: `docs/ai/AGENTS.md`, `docs/ai/skills/*/SKILL.md` (sincronizados con `agents:sync`), `README.md`, `CONTRIBUTING.md` (nuevo), `CHANGELOG.md`, `docs/implementation/TEST-INVENTORY.md`, `PLAN.md` y `STATUS.md`.
- **Dependencias y precondiciones:** MHB-43 completada y mergeada. Node `>=22.18` local (CI usa 24). npm, yarn y pnpm disponibles para la verificación local en un clon desechable.
- **Pasos técnicos** (detalle ejecutable en `docs/superpowers/mhb-36.md`; un commit por fase):
  - **F0 — Preparación:** rama, estado `En progreso` y línea base.
  - **F1 — Detección:** `detect-pm.ts` (`detectPackageManager`, `formatRunCommand`) y el runner secuencial `scripts/pm/run-scripts.ts`.
  - **F2 — `package.json`, hooks y lockfiles:** scripts con `node`, sin `packageManager`, `engines.bun` ni `overrides` (se conserva `trustedDependencies`), builds de pnpm permitidas solo para `puppeteer`, `.yarnrc.yml`, lockfiles ajenos ignorados y hooks agnósticos.
  - **F3 — CLI y mensajes:** procesos con el manager detectado o `process.execPath`, mensajes con `formatRunCommand` y sin `'yarn build'`.
  - **F4 — Vitest:** `vitest@5.0.3`, `vitest.config.ts`, codemod `bun:test` → `vitest`; se eliminan `bunfig.toml` y `types/bun-test.d.ts`.
  - **F5 — CI:** Node 24 en todos los jobs, job `package-managers` requerido por `CI Pipeline`, `audit.yml` con Node 24 y workflow `pr-guard.yml`.
  - **F6 — Documentación:** invariante de Bun, instalación con los 4 managers, política de lockfiles y de PR externas (`CONTRIBUTING.md`), Windows no soportado, `agents:sync` y `CHANGELOG.md`.
  - **F7 — Verificación final** y entrega `En revisión`. Tras el merge, y con autorización del usuario, marcar `PR Guard` como check requerido de `master`.
- **Criterios de aceptación** (cada uno con su comando):
  1. Ningún script de `package.json` invoca `bun`: el comando `node -e` del plan devuelve 0 coincidencias.
  2. Sin `bun` como ruta de ejecución en el código: `rg -n '\bbun\b' scripts src .husky -g '!*.test.ts'` devuelve solo la allowlist cerrada del plan:
     - `detect-pm.ts`, por la lista de managers;
     - `pilot.ts`, por la detección de runtime;
     - `measure-benchmarks.ts`, por la comparación Bun vs Node;
     - `benchmark-runner.ts`, por `bun -v` opcional.
  3. Sin `bun:test`: `rg -l 'bun:test' scripts src types` vacío; `bunfig.toml` y `types/bun-test.d.ts` no existen.
  4. Suite completa en Vitest con el mismo número de tests que la línea base (795, o la cifra registrada en F0), con `bun run test` y con `npm run test`.
  5. `detect-pm.test.ts` cubre user agent de los 4 managers, user agent desconocido o ausente → `npm` y `formatRunCommand`; `run-scripts.test.ts` cubre la ejecución secuencial, la parada en el primer fallo y el uso sin argumentos.
  6. En un clon desechable, cada manager termina en verde `install`, `typecheck`, `test`, `build`, `validate-email` y `check-size`: `bun install --frozen-lockfile`, `yarn install` (Yarn 4.18.1), `npm install` y `pnpm install` (pnpm 12.10.1); `check:dist-baseline` en verde estricto en el carril congelado con bun.
  7. `git status --porcelain` tras instalar con los 4 managers no muestra lockfiles nuevos ni cambios en `bun.lock`.
  8. `ci.yml` define el job `package-managers` (matriz npm/yarn/pnpm) incluido en `needs` y en la verificación de `CI Pipeline`; todos los jobs usan `actions/setup-node` con Node 24. Revisión manual del YAML y CI verde en la PR.
  9. Documentación: `rg -n 'bun:test|bun test\b' README.md docs/ai docs/implementation/TEST-INVENTORY.md` y `rg -n -i 'solo bun|únicamente bun|bun como único' README.md docs/ai` vacíos; `bun run agents:check` en verde. Revisión manual: cada `bun run`/`bun install` restante de `README.md` aparece junto a sus equivalentes multi-manager.
  10. `pr-guard.yml` se dispara con `pull_request_target`, no usa `actions/checkout` y falla ante lockfiles ajenos (cualquier PR) o cambios en `.github/` (PR desde fork): el comando `node -e` del plan lo comprueba. Revisión manual tras el merge: la siguiente PR muestra el check `PR Guard` antes de marcarlo requerido.
- **Validación automática:** con bun: `install --frozen-lockfile`, `lint`, `typecheck`, `test`, `format:check`, `build`, `validate-email`, `check:dist-baseline`, `check-size`, `agents:check` y `git diff --check`. Más el criterio 6 con npm, yarn y pnpm.
- **Validación manual:** `yarn cli` y `bun run cli` hasta el menú. `yarn dev` y `bun run dev` responden 200 en `/` (sin Browser pane). Hook `pre-commit` en un commit real de la rama.
- **Evidencia requerida:**
  - Línea base y resultado (tests, hashes de `dist/`).
  - Tabla de instalación y gates por manager con versiones.
  - Diff de `package.json`, conteo de archivos migrados a Vitest y salida de las allowlists de `rg`.
- **Riesgos y reversión:**
  - Drift transitivo sin lockfile: riesgo aceptado en los managers sin lockfile (variaciones menores de espaciado en HTML que no alteran variables ESP, contratos ni peso); `check:dist-baseline` garantiza reproducibilidad byte a byte en el carril congelado con `bun.lock`.
  - Vitest aísla por archivo y puede exponer estado compartido entre tests: se corrige el test, sin `skip`.
  - pnpm o Yarn rechazan alguna configuración: se escala con el error literal.
  - Cada fase es un commit revertible.
  - `pull_request_target` corre con permisos del repo base: el guard solo lee la lista de archivos por API, con `contents: read` y `pull-requests: read`, y nunca ejecuta código de la PR.
- **Exclusiones específicas:**
  - No cambiar lógica de negocio, templates, output HTML ni APIs.
  - No actualizar versiones de dependencias existentes (salvo retirar el `overrides` contradictorio) ni migrar a monorepo.
  - No exigir Corepack, no soportar Windows y no versionar `package-lock.json` ni `pnpm-lock.yaml`.
  - No tocar `outdated-majors.yml` ni `dependabot.yml`, que siguen sobre `bun.lock`.
- **Análisis de mantenibilidad:**
  - `detect-pm.ts` (~40 líneas) y `run-scripts.ts` (~50) tienen responsabilidad única.
  - `formatRunCommand` sustituye unos 25 literales `bun run …` duplicados.
  - `scripts/shared/env/` pasa a 3 fuentes y `scripts/pm/` es una carpeta nueva con 1 fuente.
  - La migración de tests es mecánica: no se crean helpers de test nuevos.
- **Implementador:** orquestador con perfil tooling/infraestructura, medio-alto, con un subagente nuevo por fase F1–F6.
- **Revisor independiente:** revisor técnico (`task-review`).
- **Condición de escalamiento:**
  - Un manager no instala, falla funcionalmente, pierde variables ESP `{{ }}` o altera `dist/` en el carril congelado con `bun.lock`.
  - Node no ejecuta un `.ts` propio.
  - Vitest exige cambiar lógica no-test.
  - Retirar el `overrides` cambia `dist/` o reintroduce un `postcss < 8.5.23`.
  - Cambia un comando público.
  - Hace falta `skip`, `eslint-disable` o `@ts-expect-error`.

### MHB-48 — Actualización a TypeScript 7

- **Objetivo observable:** subir `typescript` de `6.0.3` a `7.x` con `typecheck`, lint tipado y tests en verde, sin cambiar el HTML de `dist/`.
- **Diagnóstico al 2026-10-01:** `typescript@7.0.2` es `latest` en npm y su paquete no declara `main` (solo el binario `tsc`). `typescript-eslint@8.71.0` (`latest`) y `8.71.1-alpha.5` (`canary`) declaran `peerDependencies.typescript: >=4.8.4 <6.1.0`, de modo que TS 7 no está soportado hoy. El repo importa la API del compilador en `scripts/validators/lint-guards/file-tree.test.ts` (`import ts from "typescript"`).
- **Disparador externo (bloqueante):** una versión estable de `typescript-eslint` cuyo peer `typescript` admita 7.x, o una decisión explícita del usuario de sustituir el lint tipado. Hasta entonces el ID no se inicia ni se asigna.
- **Superficies autorizadas:** `package.json`, `bun.lock`, `tsconfig*.json` solo para opciones deprecadas o removidas por TS 7, `scripts/validators/lint-guards/file-tree.test.ts` (o su sustituto si la API `ts` ya no existe), `docs/implementation/STATUS.md` y `CHANGELOG.md`.
- **Dependencias y precondiciones:** MHB-34 completada (modo estricto ya cerrado, para aislar errores de la versión nueva) y el disparador externo satisfecho.
- **Pasos técnicos:**
  1. Confirmar el peer de `typescript-eslint` y la versión exacta a fijar; si no hay soporte, detener el ID.
  2. Reemplazar `typescript` y `typescript-eslint` a versiones fijas compatibles y regenerar `bun.lock`.
  3. Corregir opciones de `tsconfig*.json` removidas, sin añadir exclusiones ni `@ts-expect-error`.
  4. Resolver la dependencia de la API `ts` en el guard de árbol de archivos: migrarla o sustituirla por un análisis equivalente.
- **Criterios de aceptación:**
  - `bun run typecheck` y `bun run lint` en verde con `typescript` en `7.x`.
  - `bun run test` en verde, incluido el guard de árbol de archivos.
  - `bun run check:dist-baseline` confirma `dist/` idéntico.
  - `rg -n "eslint-disable|@ts-ignore|@ts-expect-error" scripts src` sin entradas nuevas respecto al inicio.
- **Validación automática:** `bun install --frozen-lockfile`, lint, typecheck, test, `format:check`, build, `validate-email`, `check:dist-baseline` y `git diff --check`.
- **Validación manual:** ninguna.
- **Evidencia requerida:** versiones antes/después, salida de `typecheck` y `lint`, diff de `package.json` y `tsconfig*.json`.
- **Riesgos y reversión:** cambios de diagnósticos o de resolución de módulos que revelen errores nuevos; API del compilador ausente. Un único commit de versión, revertible por separado.
- **Exclusiones específicas:** no cambiar `strict`, `verbatimModuleSyntax` ni `erasableSyntaxOnly`, no migrar otras dependencias y no tocar templates ni `dist/`.
- **Análisis de mantenibilidad:** si el guard de árbol de archivos deja de depender de la API `ts`, se elimina el acoplamiento con el compilador.
- **Implementador:** perfil TypeScript/tooling, medio.
- **Revisor independiente:** revisor técnico de tooling distinto del implementador.
- **Condición de escalamiento:** `typescript-eslint` no soporta TS 7, la API `ts` no existe o falla un gate global.

### MHB-49 — Release v1.4.0

- **Objetivo observable:** publicar `v1.4.0` con el alcance de la Fase D.
- **Superficies autorizadas:** las mismas que MHB-15.
- **Dependencias y precondiciones:** MHB-15 publicada, MHB-36 completada, CI verde en `master` y decisión explícita del usuario antes de publicar o etiquetar.
- **Versión propuesta:** `v1.4.0` (minor), porque el soporte multi-package-manager es aditivo. Pasar a `v2.0.0` solo si algún ID de la fase eliminó o renombró un comando público o elevó el requisito de runtime declarado en `engines`.
- **Procedimiento:** idéntico a MHB-15 (congelamiento de alcance, `release-management`, Go/No-Go, CHANGELOG `[1.4.0]` y sección «Contrato de salida para integradores» frente a `v1.3.0`, que debe declarar `dist/` idéntico). Las notas documentan la instalación con los 4 managers, la política de lockfile único (`bun.lock`) y la migración de tests a Vitest.
- **Criterios de aceptación, validación, evidencia, riesgos y exclusiones:** los de MHB-15, añadiendo, desde un checkout limpio del tag, la instalación congelada con bun y la instalación desde cero con npm, ambas con `check:dist-baseline` verde.
- **Implementador:** perfil documentación/release, medio.
- **Revisor independiente:** orquestador.
- **Condición de escalamiento:** la de MHB-15, o un cambio de comando público detectado al verificar.

## Fase E — Evolución del stack de estilos

- **Contenido:** MHB-38 y su release MHB-50.
- **Ventana:** no antes de 2027-01-15 (límite 2027-06-30), salvo disparador registrado en `STATUS.md`. Hasta entonces el stack sigue en Maizzle 5 + Tailwind v3.
- **Riesgos:** perder `{{ }}`/Handlebars o el inlining; cambios de `dist/` no justificados.
- **Criterio de salida:** MHB-38 cerrada con diff de `dist/` justificado por template y release publicada por MHB-50.

### MHB-38 — Migración en bloque a Maizzle 6 y Tailwind CSS v4

- **Objetivo observable:** migrar en un único cambio el email (Maizzle 5 + Tailwind v3 → Maizzle 6 + Tailwind v4) y el dashboard web (Tailwind v3 + PostCSS → Tailwind v4 + `@tailwindcss/vite`). La migración debe conservar la convención `[[ ]]` para valores de build y `{{ }}` para ESP/Handlebars, y el HTML de `dist/` debe quedar sin `var()` ni colores modernos, con inlining efectivo.
- **Decisión vigente (2026-09-23):** hasta la ventana de ejecución, el proyecto sigue con `@maizzle/framework@5.5.0` y `tailwindcss@3.4.19` en ambas superficies. No se migra el dashboard por separado; el cambio es en bloque. Se descarta la ruta híbrida (Maizzle 5 con CSS de Tailwind v4 precompilado), porque sería trabajo desechable al pasar a Maizzle 6.
- **Motivación:** un intento previo de subir `tailwindcss` a v4 rompió build e inlining. La causa es estructural: `@maizzle/framework@5.5.0` importa el plugin PostCSS de Tailwind v3 (`node_modules/@maizzle/framework/src/posthtml/index.js:15`) y lo aplica a cada `<style>`. Maizzle 5 no puede usar Tailwind v4, y la vía oficial es Maizzle 6.
- **Ventana de ejecución:**
  - **Revisión y PoC:** no antes de **2027-01-15**, salvo disparador.
  - **Fecha límite de migración:** **2027-06-30**.
  - **Estado del soporte (npm, 2026-09-23):** la última versión 5.x es 5.5.0 (2026-02-12) y no hay parches 5.x desde que salió 6.0.0 (2026-06-09). Tailwind `v3-lts` está en 3.4.19 (2025-12-10). Maizzle 6.1.7 (2026-09-16) sigue con un ritmo alto de versiones.
  - **Disparadores que adelantan la ejecución:**
    1. `bun audit` reporta una vulnerabilidad en una dependencia de Maizzle 5 o Tailwind v3 sin corrección compatible.
    2. Maizzle 5 o Tailwind v3 dejan de ser compatibles con el Node, Bun o Vite que exija el proyecto (por ejemplo, en MHB-36).
    3. Se necesita una capacidad que solo exista en Maizzle 6 o Tailwind v4.
    4. Maizzle anuncia una fecha oficial de fin de soporte de la v5.
  - **Señales de madurez para dar Go en la revisión:** 60 días sin cambios que rompan compatibilidad en 6.x y una API programática (`render`/`createRenderer`) documentada y estable.
- **Hallazgos de investigación (2026-09-23):**
  - **Versiones objetivo:** `@maizzle/framework@6.1.7`, `@maizzle/tailwindcss@1.5.6` (preset CSS puro con paleta HEX de v3, utilidades `mso-*`, reset y screens), `tailwindcss@4.3.3` y `@tailwindcss/vite@4.3.3`. Maizzle 6 exige `vite ^8.0.16`; el proyecto usa 8.0.10 y la última es 8.3.0. Todas deben revalidarse al iniciar.
  - **Vue como motor de plantillas:** Maizzle 6 reemplaza PostHTML por Vue SFC sobre Vite (contenido por defecto `emails/**/*.{vue,md}`). Desaparecen los componentes `x-*`, `<if>`/`<each>` y `expressions.delimiters`.
  - **Sin delimitadores configurables:** Maizzle 6 fija las `compilerOptions` de Vue y no expone `delimiters`. Sí expone `config.vite.plugins` y los hooks `beforeRender`, `afterRender`, `afterTransform` y `afterBuild`.
  - **Plugins de email v3:** el proyecto no usa ninguno (`plugins: []`); `@maizzle/tailwindcss/mso` cubre las utilidades Outlook.
  - **Baseline de `dist/*.html`:** 0 `var(--`, 0 `oklch(`/`lch(`/`color-mix(` y 3 `<style>` por template.
- **Superficies autorizadas:**
  - **Email:** `src/emails/**` (templates, layouts, partials y estilos portados a `.vue` + CSS con `@theme`), `maizzle.config.*` y un plugin de delimitadores en `scripts/shared/`.
  - **Build y preview:** `scripts/build/**`, `scripts/vite/**` (compilador de preview, render de componentes de la biblioteca, índice, caché, HMR y `paths`), `src/web/features/preview/modules/runtime/preview-hmr.ts` y la regla `scripts/validators/email-rules/rules/structure/modern-css-inline.ts` con su test.
  - **Dashboard web:** `src/web/shared/styles/tailwind.css`, `vite.config.ts`, `postcss.config.js` y `tailwind*.config.js` (eliminación).
  - **Configuración y documentación:** `package.json`, `bun.lock`, `dist/*.html` regenerado, documentación, skills afectadas vía `agents:sync`, `STATUS.md` y el ADR.
  - **Temporal:** la PoC en `docs/superpowers/mhb-38/`.
- **Dependencias y precondiciones:** fecha ≥ 2027-01-15 o un disparador registrado en `STATUS.md`; MHB-34 y MHB-36 completadas (configuraciones raíz, loaders y `package.json` estables); `master` limpio y `dist/*.html` con hashes registrados como baseline.
- **Pasos técnicos:**
  - **F0 — Revalidación:** crear `feature/mhb-38` y ejecutar `bun run check:task-branch`. Actualizar versiones, fechas y disparadores en el anexo, y confirmar las señales de madurez. Si no se cumplen, registrar `Bloqueada` con nueva fecha de revisión.
  - **F1 — Gate de auditoría:** implementar la regla `modern-css-inline`:
    - ERROR ante `var(--` en `style`, ante `oklch(`/`lch(`/`oklab(`/`color-mix(` en cualquier CSS y ante colores inline no HEX/`rgb()`.
    - Comprobación de inlining: las utilidades usadas en `<table>`/`<td>`/`<span>`/`<a>` deben estar en `style=""`, y en `<style>` solo pueden quedar media queries, `dark:`, pseudo-clases y resets.
    - Debe pasar sobre el `dist/` actual antes de migrar.
  - **F2 — PoC y checkpoint Go / No-Go:** en `docs/superpowers/mhb-38/poc/` con dependencias propias:
    - Portar `welcome` y su layout a `.vue` e implementar el plugin de delimitadores. El plugin es un transform Vite `enforce: "pre"` sobre `.vue`: protege `{{ … }}` con marcadores, convierte `[[ … ]]` a interpolación Vue, y el hook `afterTransform` restaura los marcadores.
    - Comprobar que `{{ first_name }}` y un bloque `{{#if}}…{{/if}}` salen literales, y que un `[[ ]]` se resuelve.
    - Cubrir en la plantilla: `dark:` por media query, breakpoint `sm: 600px`, `text-xxs`, `mso-*` y modificador de opacidad `/50`.
    - Portar el CSS del dashboard a `@import "tailwindcss"` + `@custom-variant dark` (clase) + `@utility max-h-1000` y comparar selectores generados.
    - Auditar con F1, `validate-email` y `check-size`. Detenerse y presentar el resultado al usuario antes de tocar la superficie productiva.
  - **F3 — Migración de email:** portar layouts, partials (átomos → organismos) y los seis templates a `.vue`, y migrar los tokens de `tailwind.email.config.js` a `@theme` HEX sobre `@maizzle/tailwindcss`. Adaptar `bun run build`, el flatten `dist/<template>.html`, la limpieza de `data.json`, el compilador del preview (Maizzle 6 `render` + Handlebars + sustituciones legacy de SendGrid), el render de componentes de la biblioteca, el índice, la caché y el HMR. Un commit por capa.
  - **F4 — Migración del dashboard:** sustituir PostCSS y `tailwind.config.js` por `@tailwindcss/vite`. Revisar los cambios de v4 con impacto visual: borde por defecto `currentColor`, `ring` de 1px, y renombres de `shadow`, `rounded` y `blur`. Sin cambios visuales en Home, Preview y Library.
  - **F5 — Limpieza de dependencias:** eliminar `postcss`, `autoprefixer`, `tailwind.config.js`, `tailwind.email.config.js` y `postcss.config.js`. Instalar las versiones exactas revalidadas en F0 y regenerar `bun.lock`.
  - **F6 — Verificación y entrega:** ejecutar la matriz completa, comparar `dist/*.html` con el baseline y documentar cada diferencia. Solo con autorización explícita del usuario, enviar pruebas a Gmail (web/Android) y Outlook (Windows clásico y web). Redactar el ADR y dejar `En revisión`.
- **Criterios de aceptación:**
  - `dist/*.html` tiene 0 `var(--` inline, 0 `oklch(`/`lch(`/`oklab(`/`color-mix(`, colores inline en HEX o `rgb()`, y utilidades aplanadas en `style=""`.
  - Toda variable ESP `{{ }}` y bloque Handlebars del baseline aparece literal en `dist/` y el preview los resuelve con `data.json`. El `[[ page.* ]]` o su equivalente se resuelve en build.
  - Las diferencias de `dist/*.html` frente al baseline están justificadas una a una (sin regresión visual ni de peso sobre el umbral de `check-size`).
  - El dashboard no presenta cambios visuales en las seis combinaciones ancho×tema.
  - No quedan `postcss.config.js`, `tailwind*.config.js`, `autoprefixer` ni referencias a Maizzle 5 o Tailwind v3.
- **Validación automática:** `bun install --frozen-lockfile`, lint, typecheck, test, `format:check`, build, `validate-email` con `modern-css-inline`, `check-size`, `check:a11y`, `agents:check` y `git diff --check`.
- **Validación manual:** preview de los seis templates con datos, biblioteca de componentes, HMR al editar template/CSS, dashboard en seis combinaciones ancho×tema y, con envío autorizado, Gmail y Outlook con protocolo fechado.
- **Evidencia requerida:** anexo con versiones y fechas revalidadas, resultado del checkpoint F2, salida de auditoría por template, diff justificado de `dist/`, matriz de dependencias eliminadas e instaladas, capturas del dashboard y ADR.
- **Riesgos y reversión:**
  - **Riesgos:** pérdida silenciosa de variables ESP por el plugin de delimitadores (mitigada con la regla ESP existente y tests del plugin); `color-mix()` filtrado por modificadores de opacidad; API de Maizzle 6 aún inestable; alcance grande.
  - **Reversión:** la rama no se mergea hasta el Go completo. Un commit por fase; revertir el merge restaura Maizzle 5 + Tailwind v3 con el `bun.lock` anterior.
- **Exclusiones específicas:** no cambiar el contrato de variables ESP ni la CLI pública; no rediseñar templates ni el dashboard; no enviar correos sin autorización; no publicar versión, tag ni release.
- **Análisis de mantenibilidad:** el plugin de delimitadores es el único helper nuevo (se justifica por proteger una invariante central y lleva tests). Cada `.vue` y cada módulo respeta ≤250 líneas y ≤8 archivos por carpeta. Los partials conservan la jerarquía atoms/molecules/organisms/templates, y se elimina código muerto de PostHTML (`getEmailComponentFolders` si deja de tener consumidores).
- **Implementador:** perfil email/tooling, alto.
- **Revisor independiente:** revisor build/email distinto del implementador, más un revisor UI para el dashboard.
- **Condición de escalamiento:** el checkpoint F2 no pasa la auditoría o pierde `{{ }}`/Handlebars; Maizzle 6 no ofrece API programática para el preview; la migración exige cambiar la CLI pública; o el alcance obliga a dividir el ID (lo decide el orquestador con el usuario).

### MHB-50 — Release de la migración de stack

- **Objetivo observable:** publicar la release que contiene MHB-38.
- **Superficies autorizadas:** las mismas que MHB-15.
- **Dependencias y precondiciones:** MHB-49 publicada, MHB-38 completada, CI verde en `master` y decisión explícita del usuario.
- **Versión:** se decide al congelar. `v1.5.0` si los comandos públicos, la convención `[[ ]]`/`{{ }}` y las variables ESP del manifiesto se conservan; `v2.0.0` si cambia el formato de los templates fuente para usuarios del toolkit (Maizzle 6 usa Vue SFC) o algún comando público.
- **Procedimiento:** idéntico a MHB-15; la sección «Contrato de salida para integradores» documenta el diff de `dist/` frente a `v1.4.0`, justificado por template, y la conservación de variables ESP.
- **Implementador:** perfil documentación/release, medio.
- **Revisor independiente:** orquestador.
- **Condición de escalamiento:** la de MHB-15.

## Fase F — Demo y portafolio

- **Contenido:** MHB-16 (opcional) y MHB-23 (opcional), más la revisión final independiente del producto.
- **Paralelismo:** se puede ejecutar desde la publicación de `v1.3.0`, sin esperar a las Fases D y E, porque no comparte superficie con ellas. Si la demo se publica antes de una release posterior, se actualiza tras esa release.
- **Riesgos:** divergencia entre demo y HTML compilado; ampliar la biblioteca hacia un builder.
- **Criterio de salida:** la revisión final aprueba el caso según «Criterios para estar listo para portafolio»; cada opcional aprobado cumple su propia aceptación.

### MHB-16 — Demo candidata pre-renderizada

- **Objetivo observable:** decidir y probar una demo solo lectura sin divergencia frente al HTML compilado.
- **Superficies autorizadas:** build estático, configuración de demo/despliegue aprobada, rutas de navegación y documentación de evidencia.
- **Dependencias y precondiciones:** MHB-15 completada; aprobación explícita de proveedor/credenciales si fueran necesarios.
- **Pasos técnicos:** comparar output, configurar demo mínima, ejecutar smoke y registrar SHA desplegado.
- **Criterios de aceptación:** demo candidata coincide con HTML compilado, funciona en desktop/móvil y se enlaza para verificación.
- **Validación automática:** smoke de build estático, enlaces y checks aplicables.
- **Validación manual:** navegar la demo solo lectura en desktop/móvil.
- **Evidencia requerida:** URL candidata, SHA desplegado y checklist.
- **Riesgos y reversión:** divergencia, coste o exposición de datos; no desplegar sin aprobación y retirar la configuración candidata de forma recuperable. `vite.config.ts` fija `build.outDir: "../../dist"` con `emptyOutDir: true`: un `vite build` del dashboard vaciaría el `dist/` de email versionado. Antes de cualquier build estático, usar un `outDir` propio y comprobar `check:dist-baseline`.
- **Exclusiones específicas:** no publicar el caso como destacado ni añadir backend.
- **Implementador:** perfil de deploy/preview, alto.
- **Revisor independiente:** orquestador.
- **Condición de escalamiento:** proveedor, credenciales, coste o publicación externa.

### MHB-23 — Ampliar biblioteca de componentes

- **Objetivo observable:** añadir componentes email-safe con schema y presencia en `/library`.
- **Superficies autorizadas:** partials/componentes, schemas, library, pruebas y documentación de componentes.
- **Dependencias y precondiciones:** un caso de uso aprobado para cada componente.
- **Pasos técnicos:** crear componente/schema, registrarlo, construirlo y cubrir su validación/prueba aplicable.
- **Criterios de aceptación:** cada componente adicional es email-safe, tiene schema, aparece en `/library` y pasa controles.
- **Validación automática:** build, schema, validadores y tests aplicables por componente.
- **Validación manual:** abrir library, editar datos y revisar output.
- **Evidencia requerida:** schema, captura, build verde y resultados de validación.
- **Riesgos y reversión:** ampliar hacia un builder o duplicar componentes; mantener cada adición aislada y reversible.
- **Exclusiones específicas:** no construir editor/builder de emails.
- **Implementador:** perfil email/UI, medio.
- **Revisor independiente:** revisor de email/UI.
- **Condición de escalamiento:** el alcance se amplía hacia un builder o requiere nueva arquitectura.

## Contrato obligatorio de cierre

Cada elemento debe conservar en el contrato transferido objetivo, archivos, pasos, dependencias, aceptación, pruebas automáticas, validación manual, riesgos, exclusiones y evidencia esperada. Una skill puede añadir controles, pero no sustituir esos campos ni rebajar su aceptación.

### Estados y revisión independiente

1. `Pendiente`: dependencias o autorización todavía no satisfechas.
2. `En progreso`: implementador asignado y propiedad de archivos registrada.
3. `En revisión`: implementación terminada; se registran diff, comandos, resultados, desviaciones y riesgos. El implementador no puede marcarla `Completada`.
4. `Bloqueada`: un control obligatorio falla o falta evidencia; no se inicia la tarea dependiente.
5. `Completada`: un revisor independiente confirma aceptación, diff, pruebas, lint, typecheck/build cuando correspondan y ausencia de cambios fuera de alcance; el orquestador dicta el veredicto.

### Matriz mínima de comprobación

| IDs    | Prueba automática mínima                                                             | Validación manual                                                                    | Evidencia de cierre                                                                |
| ------ | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| MHB-14 | Validadores disponibles; no sustituyen pruebas reales.                               | Teclado/lector y Gmail/Outlook/Apple Mail con protocolo fechado.                     | Matriz por cliente/criterio, capturas sin secretos y limitaciones.                 |
| MHB-15 | Lint, suite, build y consistencia de versión.                                        | Revisar README, capturas, changelog y release antes de publicar.                     | SHA, tag, URL de release y diff final.                                             |
| MHB-36 | Instalación y gates completos con npm, yarn, pnpm y bun; suite Vitest verde.         | `cli` y `dev` con yarn y bun, y hook `pre-commit`.                                   | Logs de 4 managers, diff de imports, hashes `dist/` idénticos entre managers.      |
| MHB-48 | Typecheck, lint tipado, suite y `check:dist-baseline` con TS 7.                      | Ninguna.                                                                             | Versiones antes/después y diff de `package.json`/`tsconfig*.json`.                 |
| MHB-49 | Lo de MHB-15 más instalación con bun (congelada) y npm desde el tag.                 | Lo de MHB-15.                                                                        | SHA, tag, URL de release, diff final y Go/No-Go.                                   |
| MHB-38 | `modern-css-inline`, suite, build, `validate-email`, `check-size` y diff de `dist/`. | Checkpoint PoC, preview, biblioteca, dashboard y Gmail/Outlook con envío autorizado. | Auditoría por template, diff justificado de `dist/`, matriz de dependencias y ADR. |
| MHB-50 | Lo de MHB-15 con diff de `dist/` frente a `v1.4.0`.                                  | Lo de MHB-15.                                                                        | SHA, tag, URL de release, diff justificado y Go/No-Go.                             |
| MHB-16 | Smoke del build estático y enlaces.                                                  | Navegar demo solo lectura en desktop/móvil.                                          | URL candidata, SHA desplegado y checklist.                                         |
| MHB-23 | Tests y validadores aplicables por componente.                                       | Aparición y edición en `/library`.                                                   | Schema, captura y build verde.                                                     |

### Gates globales

- Todos los cambios: `bun run format:check` y `git diff --check`.
- Markdown: `bun run lint`.
- JavaScript/TypeScript/configuración: `bun run lint` y `bun run typecheck` según alcance.
- Templates/layouts/CSS/build: `bun run build` y `bun run validate-email`; ERROR bloquea y WARNING/INFO no se ocultan. Desde MHB-41, también `bun run check:dist-baseline`; solo un ID que autorice cambiar `dist/` puede actualizar el baseline.
- Revisión independiente: desde MHB-40, el revisor aplica la skill `task-review`; lo declarado en `STATUS.md` no sustituye la re-ejecución de los gates.
- UI/API: pruebas automatizadas más `bun run dev` y recorrido manual cuando corresponda.
- Antes de cerrar una fase: instalación congelada, lint, typecheck, test, build y formato verdes en la versión de Bun fijada por el proyecto.
- Un control obligatorio `Fallido` o `No ejecutado` impide `Completada`, salvo excepción explícita aprobada por el orquestador con riesgo y nueva acción.

## Orden de ejecución

1. **Fase C:** ejecutar MHB-14 (evidencia en clientes reales sobre el HTML corregido por MHB-44) y después MHB-15 (release `v1.3.0`).
2. **Fase D:** MHB-36 puede ejecutarse en paralelo con MHB-14 por no compartir superficie; si se mergea antes del congelamiento de MHB-15, entra en `v1.3.0`. Después, MHB-49 (release `v1.4.0`).
3. MHB-48 (TypeScript 7) solo cuando `typescript-eslint` soporte TS 7; en paralelo con MHB-36. Entra en la release cuyo congelamiento ocurra después de su cierre.
4. **Fase E:** MHB-38 dentro de su ventana (no antes de 2027-01-15, límite 2027-06-30) o antes si se registra un disparador, siempre tras MHB-36; es, junto con un ID que lo autorice explícitamente, la única vía para actualizar el baseline de `dist/`. Después, MHB-50.
5. **Fase F:** MHB-16 y MHB-23 desde la publicación de `v1.3.0`; someter el producto a revisión final independiente antes de declararlo listo para presentarse como caso de portafolio.

### Política de ramas y versiones conservada

- Una tarea por rama `feature/<id-en-minusculas>` y PR directo a `master`; no se mezclan tareas ni se incrementa versión por cada una.
- Cada fase cierra con su propio ID de release (MHB-15 → `v1.3.0`, MHB-49 → `v1.4.0`, MHB-50 → migración de stack); la versión solo cambia dentro de esos IDs.
- `v1.2.0` es el baseline publicado. Cualquier versión, tag o release posterior requiere evidencia de su alcance y aprobación explícita del orquestador.
- Tag, CHANGELOG, versión y release deben apuntar al mismo alcance. Ningún subagente publica o mueve referencias sin aprobación del orquestador.
- `dist/` permanece versionado; las capturas son entregables documentales. `task-verification` debe evitar commits accidentales fuera de tarea.

## Criterios para estar listo para portafolio

- CI cubre las rutas relevantes; lint, typecheck, pruebas, build y formato están verdes en la matriz declarada.
- Todo el código propio del alcance está en TypeScript estricto y el guard de inventario impide reintroducir `.js`/`.mjs`.
- Los templates de producto, preview seguro y descarga de HTML funcionan y están verificados.
- Hay evidencia fechada de accesibilidad, rendimiento y clientes de correo.
- La documentación, versión, tag y release posterior concuerdan; existe una demostración candidata o instrucciones reproducibles para el flujo.
- MHB-16 sigue opcional solo si la puerta final acepta la demostración local reproducible; si esa evidencia es insuficiente, pasa a requerida antes de `Listo para portafolio`.
- La verificación final aprueba el caso. Publicarlo en una superficie externa del portafolio es una acción posterior y separada.

## Impacto de nombre o combinación de repositorios

No se cambia el repositorio ni se combina con otro caso. `EmailForge Toolkit` es el nombre de producto; `vite-mhb-email` conserva su slug, URL y paquete históricos. Toda release posterior usa ambos nombres de forma coherente.

## Diseño de orquestación

Las skills son contratos de procedimiento; los subagentes son ejecuciones temporales. Cada subagente recibe IDs, skills obligatorias, archivos exclusivos, controles y condición de escalamiento. Ninguna identidad se persiste como agente permanente.

### Orquestación — Fase C — Evidencia y release v1.3.0

| Línea                   | Skills obligatorias                              | Implementador y propiedad            | Revisor     | Controles                                                            | Escalar cuando                                                                                |
| ----------------------- | ------------------------------------------------ | ------------------------------------ | ----------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| MHB-14 evidencia manual | `email-compatibility`, `email-preview-dashboard` | Perfil alto; matriz/capturas         | Orquestador | Protocolo fechado, clientes reales y accesibilidad                   | No haya acceso a cliente/dispositivo o aparezcan datos sensibles.                             |
| MHB-15 release          | `task-verification`, `release-management`        | Perfil medio; docs/version/changelog | Orquestador | Suite, inventario TS, `check:dist-baseline`, Go/No-Go, tag y release | Antes de publicación, tag o cambio de versión, o ante un hallazgo que rompa el congelamiento. |

### Orquestación — Fase D — Portabilidad y release v1.4.0

| Línea               | Skills obligatorias                                               | Implementador y propiedad                                        | Revisor                    | Controles                                               | Escalar cuando                                                          |
| ------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------- | -------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------- |
| MHB-36 multi-PM     | `email-project-stack`, `email-quality-gates`, `task-verification` | Orquestador + un subagente nuevo por fase; scripts/tests/CI/docs | Revisor técnico            | Gates con 4 PMs, Vitest verde, hashes idénticos         | Un PM no instala o altera `dist/`, o Vitest exige tocar lógica no-test. |
| MHB-48 TypeScript 7 | `email-project-stack`, `email-quality-gates`, `task-review`       | Perfil medio; `package.json`, `bun.lock`, `tsconfig*.json`       | Revisor técnico de tooling | Typecheck, lint tipado, suite y baseline                | `typescript-eslint` no soporta TS 7 o falta la API `ts`.                |
| MHB-49 release      | `task-verification`, `release-management`                         | Perfil medio; docs/version/changelog                             | Orquestador                | Lo de MHB-15 más instalación con npm y bun desde el tag | Lo de MHB-15 o un cambio de comando público.                            |

### Orquestación — Fase E — Evolución del stack

| Línea            | Skills obligatorias                                                     | Implementador y propiedad                    | Revisor                  | Controles                                           | Escalar cuando                                                           |
| ---------------- | ----------------------------------------------------------------------- | -------------------------------------------- | ------------------------ | --------------------------------------------------- | ------------------------------------------------------------------------ |
| MHB-38 Maizzle 6 | `email-project-stack`, `email-compatibility`, `email-preview-dashboard` | Perfil alto; email, build, preview y estilos | Revisor build/email y UI | Checkpoint PoC, auditoría, diff `dist/` y recorrido | La PoC pierda `{{ }}`/Handlebars o no exista API programática de render. |
| MHB-50 release   | `task-verification`, `release-management`                               | Perfil medio; docs/version/changelog         | Orquestador              | Lo de MHB-15 más diff de `dist/` justificado        | Lo de MHB-15 o cambio del formato de templates fuente.                   |

### Orquestación — Fase F — Demo y portafolio

| Línea              | Skills obligatorias                                                                           | Implementador y propiedad              | Revisor          | Controles                                 | Escalar cuando                                          |
| ------------------ | --------------------------------------------------------------------------------------------- | -------------------------------------- | ---------------- | ----------------------------------------- | ------------------------------------------------------- |
| MHB-16 demo        | `email-project-stack`, `email-preview-dashboard`, skill de despliegue si se aprueba proveedor | Perfil alto; build/config de deploy    | Orquestador      | Smoke, URL, SHA y ausencia de divergencia | Requiera proveedor, credenciales o publicación externa. |
| MHB-23 componentes | `email-compatibility`, `email-preview-dashboard`                                              | Perfil medio; partials/schemas/library | Revisor email/UI | Build, schema, library y visual           | Amplíe el alcance hacia un builder.                     |

El orquestador conserva integración, decisiones transversales, cambios destructivos, versiones, releases y veredictos. Solo paraleliza líneas con archivos exclusivos y al menos dos ámbitos realmente independientes.
