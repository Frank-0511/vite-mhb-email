# Plan de implementación — EmailForge Toolkit

Este documento contiene únicamente el trabajo pendiente. El baseline funcional
publicado es `v1.2.0`; los artefactos de Git y `STATUS-HISTORY.md` conservan la
trazabilidad de los IDs cerrados.

## Objetivo vigente

Publicar el trabajo acumulado desde `v1.2.0` en releases incrementales, una por
fase. Primero se cierra la puerta de calidad automatizable y se publica `v1.3.0`;
la comprobación manual en clientes de correo se ejecuta en una etapa final (MHB-51); después se reduce y desacopla el tooling (dependencias y
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

| Fase | ID     | Entregable                                       | Estado      | Dependencia vigente            |
| ---- | ------ | ------------------------------------------------ | ----------- | ------------------------------ |
| C    | MHB-14 | Comprobación de uso y compatibilidad             | Completada  | Satisfecha                     |
| C    | MHB-15 | Release `v1.3.0`                                 | Completada  | MHB-14                         |
| D    | MHB-36 | Compatibilidad multi-package-manager             | Completada  | Satisfecha (MHB-43 completada) |
| D    | MHB-48 | Actualización a TypeScript 7                     | Pendiente   | Disparador externo             |
| D    | MHB-61 | Versión mínima de Node.js 24.22.3                | En revisión | Ninguna                        |
| D    | MHB-62 | Actualización de dependencias sin saltos mayores | En revisión | MHB-61                         |
| D    | MHB-49 | Release `v1.4.0`                                 | Pendiente   | MHB-15, MHB-36 y MHB-61        |
| E    | MHB-38 | Migración en bloque a Maizzle 6 y Tailwind v4    | Pendiente   | MHB-36 y ventana ≥ 2027-01-15  |
| E    | MHB-50 | Release de la migración de stack                 | Pendiente   | MHB-49 y MHB-38                |
| F    | MHB-16 | Demo candidata pre-renderizada                   | Opcional    | MHB-15                         |
| F    | MHB-23 | Ampliar biblioteca de componentes                | Opcional    | Caso de uso aprobado           |
| G    | MHB-51 | Verificación manual final en clientes            | Pendiente   | MHB-15, MHB-49 y MHB-50        |
| H    | MHB-52 | PoC aislada de Vite+                             | Propuesta   | Acuerdo explícito              |
| H    | MHB-53 | Paridad Oxfmt vs Prettier                        | Propuesta   | MHB-52                         |
| H    | MHB-54 | Oxlint en paralelo (modo sombra)                 | Propuesta   | MHB-52                         |
| H    | MHB-55 | Reparto Oxlint + ESLint reducido                 | Propuesta   | MHB-54                         |
| H    | MHB-56 | Hooks y staged                                   | Propuesta   | MHB-55 y MHB-53                |
| H    | MHB-57 | Adaptación de CI                                 | Propuesta   | MHB-55 y MHB-56                |
| H    | MHB-58 | TypeScript 7 (reemplaza disparador de MHB-48)    | Propuesta   | MHB-55                         |
| H    | MHB-59 | Gentleman: instrucciones, skills y scripts       | Propuesta   | MHB-53 y MHB-55                |
| H    | MHB-60 | Release del tooling                              | Propuesta   | MHB-55 a MHB-59                |

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

## Fase C — Comprobación y release v1.3.0

- **Contenido de la release:** todo lo completado y mergeado en `master` desde `v1.2.0` (`git log v1.2.0..master`: migración TypeScript completa hasta MHB-34, gobernanza MHB-40, contrato de salida MHB-41, protección de `master` MHB-45, compatibilidad HTML MHB-44, API local MHB-46 y contrato ESP MHB-47, higiene de dependencias MHB-43) más MHB-14.
- **Orden:** MHB-14 → MHB-15.
- **Riesgos:** afirmar resultados de clientes sin pruebas; incluir secretos en capturas o documentación; publicar sin el checklist Go/No-Go.
- **Criterio de salida:** MHB-14 cerrada con controles automatizados reproducibles y `v1.3.0` publicada por MHB-15; la comprobación manual en clientes de correo queda en MHB-51.

### MHB-14 — Comprobación de uso y compatibilidad

- **Objetivo observable:** producir checklist reproducible de accesibilidad y matriz fechada de clientes reales. La ejecución en clientes de correo se traslada a MHB-51 (etapa final).
- **Superficies autorizadas:** protocolo/checklist, capturas, matriz documental y templates de producto.
- **Dependencias y precondiciones:** MHB-44 completada, para que la comprobación en clientes reales se tome sobre el HTML ya corregido (colores, unidades e imágenes); el flujo de producto permanece disponible y se dispone de los clientes/dispositivos declarados.
- **Pasos técnicos:** definir criterios de teclado/lector, ejecutar protocolo en Gmail, Outlook y Apple Mail, y registrar límites.
- **Criterios de aceptación:** cada prueba tiene fecha, cliente, criterio y resultado; no se sustituyen clientes reales por un validador estático.
- **Validación automática:** validadores disponibles y lint de matriz, sin presentarlos como prueba real.
- **Validación manual:** teclado y lector según protocolo. Clientes de correo: MHB-51.
- **Resultado requerido:** matriz por cliente/criterio, limitaciones declaradas en `STATUS.md`.
- **Riesgos y reversión:** afirmar cobertura no realizada o filtrar datos; usar cuentas/fixtures seguros y marcar no verificado.
- **Envíos reales:** los correos de prueba pueden enviarse con la integración ESP (SendGrid) del usuario usando `dist/<template>.html`, solo con autorización explícita por envío, destinatarios de prueba propios y sin API keys, tokens ni direcciones reales en capturas, `STATUS.md` o el repositorio. Esa integración vive fuera de este repositorio y no se incorpora a él.
- **Exclusiones específicas:** no certificar accesibilidad ni compatibilidad universal.
- **Implementador:** perfil de comprobación/compatibilidad, alto.
- **Revisor independiente:** orquestador o revisor con acceso a clientes.
- **Condición de escalamiento:** falta acceso a cliente/dispositivo o aparecen datos sensibles.

### MHB-15 — Release v1.3.0

- **Objetivo observable:** publicar `v1.3.0` con README, CHANGELOG, versión, tag y release coherentes con el trabajo completado desde `v1.2.0`.
- **Estado:** `Completada` (2026-11-21). Tag `v1.3.0` en `81d2b7c` y release publicada.
- **Superficies autorizadas:** README, CHANGELOG, versión/package metadata, capturas, notas de release y documentación relacionada.
- **Dependencias y precondiciones:** MHB-14 completada (el resto del contenido de la release ya está `Completada`), CI verde en `master` y decisión explícita del usuario antes de publicar o etiquetar; preservar el baseline publicado `v1.2.0`.
- **Versión decidida (2026-10-08):** `v1.3.0` (minor). La API pública son los comandos listados en `CLAUDE.md` (`dev`, `build`, `test`, `lint`, `typecheck`, `validate-email`, `check:dist-baseline`, `format:check`, etc.); el resto de scripts de `package.json` son herramientas internas que pueden cambiar en un minor con nota de migración en `CHANGELOG.md`. Desde `v1.2.0` no cambió ningún comando de esa lista.
- **Congelamiento de alcance:** al pasar MHB-15 a `En progreso` se congela el alcance. Un hallazgo nuevo se registra como ID de la Fase D y no bloquea la release, salvo que rompa un gate de MHB-41 (hashes de `dist/`, variables ESP `{{ }}`, `validate-email`), la suite o el build; solo esos casos bloquean y se corrigen dentro del alcance congelado. Un ID de la Fase D mergeado antes del congelamiento forma parte de `v1.3.0` y se declara en sus notas.
- **Pasos técnicos:**
  - Aplicar la skill `release-management`: checklist Go/No-Go con cada ID de la release `Completada` y CI verde en `master`.
  - Reconciliar narrativa y resultados; mover `[Unreleased]` a `[1.3.0]` en CHANGELOG; actualizar `package.json`; preparar tag/release solo tras revisión.
  - Incluir en CHANGELOG y notas de release una sección «Contrato de salida para integradores»: resultado de `check:dist-baseline` frente a `v1.2.0` (diferencias justificadas por template, introducidas por MHB-44) y confirmación de que las variables ESP `{{ }}` de cada template se conservan, con referencia al manifiesto `dist/esp-manifest.json` (MHB-47).
- **Criterios de aceptación:** documentación, versión, tag y release coinciden; las capturas son actuales y los límites no se presentan como hechos no probados; la sección de contrato de salida existe y coincide con la salida de `check:dist-baseline`.
- **Validación automática:** lint Markdown, suite, build, `validate-email`, `check:dist-baseline` y comprobación de consistencia de versión.
- **Validación manual:** revisar README, capturas, changelog, SHA/tag y notas antes de publicar.
- **Resultado requerido:** SHA, tag, URL de release, diff final y checklist Go/No-Go firmado por el orquestador.
- **Riesgos y reversión:** publicar una afirmación adelantada; detener antes de acciones externas y revertir documentación local si corresponde.
- **Exclusiones específicas:** no publicar automáticamente ni modificar tags o releases ya publicados.
- **Implementador:** perfil documentación/release, medio.
- **Revisor independiente:** orquestador.
- **Condición de escalamiento:** cualquier publicación, tag, versión o resultado no sustentado, o un hallazgo que se proponga incluir pese al congelamiento de alcance.

## Fase G — Verificación final en clientes

- **Contenido:** MHB-51, ejecución manual del protocolo de clientes de correo para todas las etapas, después de la última release planificada.
- **Orden:** tras MHB-15, MHB-49 y MHB-50.
- **Riesgos:** afirmar compatibilidad con clientes no probados; detectar regresiones tarde, cuando ya hay releases publicadas.

### MHB-51 — Verificación manual final en clientes de correo

- **Objetivo observable:** registrar en `docs/guides/COMPATIBILITY-MATRIX.md` la ejecución fechada del protocolo en Gmail web/app, Outlook.com, Outlook Windows y Apple Mail macOS/iOS para los 4 templates publicados.
- **Superficies autorizadas:** `docs/guides/COMPATIBILITY-MATRIX.md`, `docs/implementation/STATUS.md`.
- **Criterios de aceptación:** cada fila tiene fecha, cliente, criterio, resultado (E0 a E3) y nota sanitizada; las filas no ejecutadas siguen `No verificado` y se declaran.
- **Validación manual:** ejecución por el usuario en dispositivos reales.
- **Resultado requerido:** matriz por cliente y criterio, limitaciones declaradas en `STATUS.md`.
- **Riesgos y reversión:** afirmar cobertura no realizada; filtrar datos. Usar cuentas y fixtures seguros.
- **Exclusiones específicas:** no certificar compatibilidad universal.
- **Condición de escalamiento:** falta acceso a cliente o dispositivo, o aparecen datos sensibles.

## Fase D — Portabilidad y release v1.4.0

- **Contenido de la release:** MHB-36 y, si su disparador se cumple antes del congelamiento, MHB-48 (MHB-43 ya entra en `v1.3.0`).
- **Orden:** MHB-36 → MHB-49; MHB-48 en paralelo con MHB-36 por no compartir superficie.
- **Entregables:** compatibilidad con npm, yarn, pnpm y bun, tests en Vitest y release `v1.4.0`.
- **Riesgos:** incompatibilidades sutiles entre package managers o drift transitivo sin lockfile; romper un comando público.
- **Criterio de salida:** MHB-36 confirma que el proyecto funciona con los 4 managers; `dist/` idéntico al baseline en el carril congelado con bun.lock y `v1.4.0` publicada por MHB-49.

### MHB-36 — Compatibilidad multi-package-manager

- **Objetivo observable:** cualquier desarrollador clona el proyecto y trabaja con npm, yarn, pnpm o bun sin que ninguno sea obligatorio. Los scripts se ejecutan con `node` (type stripping nativo), los tests con Vitest y la CLI lanza procesos con el package manager detectado.
- **Estado:** `Completada` (2026-10-09). Verificada en local y CI con los 4 gestores (Bun, npm, Yarn 4 y pnpm); integrada en master e incluida en la release `v1.3.0`.
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
- **Resultado requerido:**
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
- **Alternativa (Fase H):** MHB-58 cubre este mismo objetivo vía Oxlint type-aware y reemplazaría este ID si la Fase H se ejecuta; no se ejecutan ambos.
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
- **Resultado requerido:** versiones antes/después, salida de `typecheck` y `lint`, diff de `package.json` y `tsconfig*.json`.
- **Riesgos y reversión:** cambios de diagnósticos o de resolución de módulos que revelen errores nuevos; API del compilador ausente. Un único commit de versión, revertible por separado.
- **Exclusiones específicas:** no cambiar `strict`, `verbatimModuleSyntax` ni `erasableSyntaxOnly`, no migrar otras dependencias y no tocar templates ni `dist/`.
- **Análisis de mantenibilidad:** si el guard de árbol de archivos deja de depender de la API `ts`, se elimina el acoplamiento con el compilador.
- **Implementador:** perfil TypeScript/tooling, medio.
- **Revisor independiente:** revisor técnico de tooling distinto del implementador.
- **Condición de escalamiento:** `typescript-eslint` no soporta TS 7, la API `ts` no existe o falla un gate global.

### MHB-61 — Versión mínima de Node.js 24.22.3

- **Objetivo observable:** el proyecto declara `Node.js >= 24.22.3` como mínimo y las herramientas de versión (`nvm`, `fnm`, `asdf`, `mise` u otras que lean `.node-version`) fijan exactamente `24.22.3`, de modo que un clon nuevo trabaja con una versión de Node que cumple el requisito de las dependencias vigentes.
- **Motivo:** `engines.node` era `>=24`, que admitía 24.0 a 24.22.2; esas versiones quedan por debajo del mínimo que se quiere garantizar. Se declara el mínimo exacto y se agrega `.node-version` para los gestores que no leen `.nvmrc`.
- **Estado:** implementado en la rama `feature/mhb-61` (commit `69d1ee0`); `En revisión`; pendiente de revisión independiente y de confirmar CI.
- **Superficies autorizadas:** `package.json` (`engines.node`), `.nvmrc`, `.node-version` (nuevo), `README.md` (dos menciones de requisitos), `CHANGELOG.md` (`[Unreleased]`), `.github/workflows/ci.yml` y `.github/workflows/audit.yml` (versión de Node desde `.nvmrc`), `docs/implementation/STATUS.md`.
- **Dependencias y precondiciones:** ninguna.
- **Cambios realizados:**
  1. `package.json`: `engines.node` de `>=24` a `>=24.22.3`.
  2. `.nvmrc`: de `24` a `24.22.3`.
  3. `.node-version`: archivo nuevo con `24.22.3`.
  4. `README.md`: «Requisitos locales» y «Requisitos» indican `>= 24.22.3`.
  5. `CHANGELOG.md`: entrada «Cambiado» en `[Unreleased]`.
- **CI:** `ci.yml` y `audit.yml` usan `node-version-file: ".nvmrc"`, de modo que el runner instala exactamente `24.22.3`; se confirma en la primera PR.
- **Criterios de aceptación:**
  - `package.json`, `.nvmrc` y `.node-version` declaran la misma versión mínima (`24.22.3`), comprobable con `rg -n "24\\.22\\.3" package.json .nvmrc .node-version README.md`.
  - `bun install --frozen-lockfile` y `bun run check:dist-baseline` verdes con Node `24.22.3`.
  - CI usa una versión de Node `>= 24.22.3`.
  - `README.md` y `CHANGELOG.md` coinciden con el mínimo declarado.
- **Validación automática:** instalación congelada, lint, typecheck, test, `format:check`, build, `validate-email`, `check:dist-baseline`, `check-size`, `check:task-branch` y `git diff --check`, todos con Node `24.22.3`.
- **Validación manual:** `nvm use` y `fnm use` en un clon limpio seleccionan `24.22.3`.
- **Resultado requerido:** versión de Node usada en cada control, diff de los cinco archivos y salida de CI.
- **Riesgos y reversión:** quien tenga Node 24.0 a 24.22.2 recibe aviso de `engines` o falla en gestores con `engine-strict`; `.node-version` y `.nvmrc` fijan una versión exacta que obliga a actualizar a futuro. Un único commit, revertible por separado. El cambio eleva el requisito de runtime declarado; la versión se mantiene en `v1.4.0` (decisión registrada en MHB-49).
- **Exclusiones específicas:** no cambiar dependencias, `@types/node`, `tsconfig*.json`, templates ni `dist/`.
- **Análisis de mantenibilidad:** una sola versión mínima repetida en tres archivos; no se agrega lógica nueva.
- **Implementador:** perfil tooling/documentación, bajo.
- **Revisor independiente:** revisor técnico de tooling distinto del implementador.
- **Condición de escalamiento:** `dist/` cambia, una dependencia exige otra versión de Node, o CI no ofrece `24.22.3`.

### MHB-62 — Actualización de dependencias sin saltos mayores

- **Objetivo observable:** subir a su última versión estable, dentro del mismo major, las dependencias y devDependencies que no requieren cambios de código, con `dist/` idéntico y todos los gates en verde.
- **Alcance (versiones exactas, fijadas como el resto del proyecto):**
  - Herramientas de desarrollo: `axe-core` 4.14.1, `eslint` 10.15.0, `globals` 17.14.0, `lint-staged` 17.6.2, `markdownlint-cli2` 0.24.2, `prettier` 3.10.1, `stylelint` 18.1.0 (major, probado sin cambios de config), `stylelint-config-standard` 41.1.0 (par obligatorio de `stylelint` 18), `typescript-eslint` 8.73.0, `vitest` 5.1.1.
  - Runtime y build: `nodemailer` 10.6.1, `lucide` 1.77.0, `puppeteer` 25.18.1, `vite` 8.3.8.
  - Pipeline de email (revisión manual obligatoria): `postcss` 8.5.33, `autoprefixer` 10.7.0.
- **Superficies autorizadas:** `package.json`, `bun.lock`, `CHANGELOG.md` (`[Unreleased]`), `docs/implementation/PLAN.md` y `docs/implementation/STATUS.md`.
- **Dependencias y precondiciones:** MHB-61 (Node `>= 24.22.3`; `stylelint` 18 exige `^24.15`).
- **Diagnóstico:** probado en un clon temporal con Node `24.22.3`: `lint`, `typecheck`, `test`, `format:check`, `build`, `check:dist-baseline`, `validate-email` y `check-size` en verde, sin cambios de configuración.
- **Pasos:** tres commits revertibles por separado: (1) herramientas de desarrollo, (2) runtime y build, (3) pipeline de email; los gates se corren tras cada commit.
- **Criterios de aceptación:**
  - `bun run check:dist-baseline` verde y `git diff --exit-code -- dist/` sin cambios tras cada commit.
  - `bun install --frozen-lockfile`, `lint`, `typecheck`, `test`, `format:check`, `build`, `validate-email` y `check-size` verdes.
  - `bun run check:a11y` verde, o declarado como no ejecutado con su causa.
  - `rg -n "eslint-disable|@ts-ignore|@ts-expect-error" scripts src` sin entradas nuevas.
- **Validación manual:** ninguna.
- **Resultado requerido:** tabla de versiones antes y después y resultado de cada control.
- **Riesgos y reversión:** `lucide` puede alterar iconos si se regeneran (`generate:icons` no se ejecuta); `puppeteer` y `axe-core` solo quedan cubiertos por tests mockeados salvo que se ejecute `check:a11y`. Cada commit se revierte por separado.
- **Exclusiones específicas:** no actualizar `@maizzle/framework`, `tailwindcss`, `typescript`, `@types/node` ni cambiar configs; no regenerar iconos ni `dist/`.
- **Análisis de mantenibilidad:** sin código nuevo; solo versiones.
- **Implementador:** perfil tooling, bajo.
- **Revisor independiente:** revisor técnico de tooling distinto del implementador.
- **Condición de escalamiento:** `dist/` cambia, un gate falla o una dependencia exige cambio de configuración.

### MHB-49 — Release v1.4.0

- **Objetivo observable:** publicar `v1.4.0` con el alcance de la Fase D.
- **Superficies autorizadas:** las mismas que MHB-15.
- **Dependencias y precondiciones:** MHB-15 publicada, MHB-36, MHB-61 y MHB-62 completadas, CI verde en `master` y decisión explícita del usuario antes de publicar o etiquetar.
- **Versión propuesta:** `v1.4.0` (minor), porque el soporte multi-package-manager es aditivo. Pasar a `v2.0.0` solo si algún ID de la fase eliminó o renombró un comando público o elevó el requisito de runtime declarado en `engines`. **Decisión (usuario): MHB-61 eleva `engines.node` de `>=24` a `>=24.22.3` y se mantiene `v1.4.0` (minor), por tratarse de un parche dentro de Node 24; el CHANGELOG `[1.4.0]` debe declarar el nuevo mínimo.**
- **Procedimiento:** idéntico a MHB-15 (congelamiento de alcance, `release-management`, Go/No-Go, CHANGELOG `[1.4.0]` y sección «Contrato de salida para integradores» frente a `v1.3.0`, que debe declarar `dist/` idéntico). Las notas documentan la instalación con los 4 managers, la política de lockfile único (`bun.lock`) y la migración de tests a Vitest.
- **Criterios de aceptación, validación, resultados, riesgos y exclusiones:** los de MHB-15, añadiendo, desde un checkout limpio del tag, la instalación congelada con bun y la instalación desde cero con npm, ambas con `check:dist-baseline` verde.
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
- **Resultado requerido:** anexo con versiones y fechas revalidadas, resultado del checkpoint F2, salida de auditoría por template, diff justificado de `dist/`, matriz de dependencias eliminadas e instaladas y ADR.
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
- **Superficies autorizadas:** build estático, configuración de demo/despliegue aprobada, rutas de navegación y documentación de resultados.
- **Dependencias y precondiciones:** MHB-15 completada; aprobación explícita de proveedor/credenciales si fueran necesarios.
- **Pasos técnicos:** comparar output, configurar demo mínima, ejecutar smoke y registrar SHA desplegado.
- **Criterios de aceptación:** demo candidata coincide con HTML compilado, funciona en desktop/móvil y se enlaza para verificación.
- **Validación automática:** smoke de build estático, enlaces y checks aplicables.
- **Validación manual:** navegar la demo solo lectura en desktop/móvil.
- **Resultado requerido:** URL candidata, SHA desplegado y checklist.
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
- **Resultado requerido:** schema, build verde y resultados de validación.
- **Riesgos y reversión:** ampliar hacia un builder o duplicar componentes; mantener cada adición aislada y reversible.
- **Exclusiones específicas:** no construir editor/builder de emails.
- **Implementador:** perfil email/UI, medio.
- **Revisor independiente:** revisor de email/UI.
- **Condición de escalamiento:** el alcance se amplía hacia un builder o requiere nueva arquitectura.

## Fase H — Migración de tooling a Vite+ (propuesta, sin fecha)

Fase de análisis y plan; **no autoriza ningún cambio**. Se ejecuta solo con acuerdo explícito. Cada ID conserva rama, revisión y cierre independientes. Etiquetas de evidencia: CONFIRMADO / COMPATIBLE CON AJUSTES / NO COMPATIBLE / NO VERIFICADO / RECOMENDACIÓN.

### Veredicto de viabilidad

- **RECOMENDACIÓN: viable solo como enfoque híbrido (B), por etapas y reversible. No migrar en bloque ni adoptar Oxlint exclusivo (A).**
- **CONFIRMADO:** `no-restricted-syntax` (selectores AST) no existe en Oxlint (oxc#7342, "unable to support"). Sostiene 12 guards del repo (`selectors.ts:17-105`, `eslint.config.js:104-169`: enum, reexports, magic strings, `types.ts`/`constants.ts` sin runtime, claves de localStorage). Existe un plugin JS comunitario que re-expone la regla de ESLint, pero los JS plugins de Oxlint son alpha. Por tanto ESLint **no puede retirarse** hoy sin perder garantías.
- **CONFIRMADO:** `check-file` (carpetas en kebab-case y blocklist de nombres, `eslint.config.js:182-196`) no tiene equivalente exacto; `unicorn/filename-case` solo cubre archivos. Se conserva en ESLint o en `file-tree.test.ts`.
- **COMPATIBLE CON AJUSTES:** Oxlint cubre reglas nativas y las type-aware vía `tsgolint` (59/61 reglas según la documentación de Oxc) sin depender de `typescript-eslint`. Esto desbloquea TypeScript 7 en lo que respecta al lint tipado (peer actual de `typescript-eslint`: `<6.1.0`), pero **no** basta: `file-tree.test.ts:9,174-187` importa la API `ts` (`createSourceFile`, `isExportDeclaration`, `SyntaxKind`) y el paquete `typescript@7` no expone `main` (diagnóstico de MHB-48). Esa dependencia debe resolverse aparte.
- **COMPATIBLE CON AJUSTES:** Vite+ (`vp`) empaqueta Vite, Vitest, Oxlint, Oxfmt y el runner; fija su propio Vitest (docs: 5.1.0; repo: `vitest 5.0.5`, `package.json:124`) y reemplaza `vite` por un alias propio (repo: `vite 8.3.5`, `:137`). Impacto sobre `scripts/vite/plugins/*`, el render Handlebars y Maizzle 5.5: **NO VERIFICADO**; requiere PoC en directorio temporal (MHB-52).
- **COMPATIBLE CON AJUSTES:** Requisitos. Vite+ declara Node 22+; Vitest 5 requiere `^22.18 || ^24.11 || >=26`; el repo declara `engines.node >=24` (`package.json:33`, `.nvmrc:1`), que admite 24.0–24.10 y por tanto queda por debajo del requisito de Vitest 5 (ya hoy). Bun (`bun@1.3.13`, `ci.yml:43`) solo se usa como gestor; si `vp` lo soporta como gestor sin tocar el lockfile: **NO VERIFICADO**. Versión actual de Vite+ (docs muestran 1.7.0; RFC menciona 2.0.0-beta.0): **NO VERIFICADO**.
- **NO COMPATIBLE (sin reemplazo):** HTMLHint, Stylelint, markdownlint, axe-core, contraste, tamaño HTML, validadores JSON y de compatibilidad de email. Oxlint/Oxfmt no cubren CSS/HTML/MD para lint. Se conservan tal cual.
- **NO VERIFICADO:** diff real de Oxfmt contra Prettier 3.9.10 (Oxfmt declara base 3.10.1) sobre md/json/yaml/css/html del repo. Si hay diferencias no deseadas, **conservar Prettier** (decisión en MHB-53).
- **Regla de gobierno:** ningún comando `vp` sustituye los scripts públicos (`build`, `lint`, `format`, `format:check`, `test`, `typecheck`, `check:a11y`, `check:dist-baseline`); los scripts internos pueden delegar en `vp`, el nombre público no cambia. `build` sigue siendo `node scripts/build/build.ts` (Maizzle 5.5; sin Maizzle 6).

### Comparativa de enfoques

| Enfoque             | Garantías                                                                                   | Riesgo                                                            | Veredicto                                              |
| ------------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------ |
| A) Oxlint exclusivo | Pierde `no-restricted-syntax`, `check-file`; regex de `no-restricted-imports` sin verificar | Alto: se rompen 12 guards arquitectónicos                         | NO COMPATIBLE hoy                                      |
| B) Oxlint + ESLint  | Oxlint: reglas nativas y type-aware. ESLint reducido: solo AST, `check-file`, aislamiento   | Medio: reglas duplicadas si no se parte el conjunto por ownership | **RECOMENDACIÓN** (con matriz de ownership sin solape) |
| C) ESLint principal | Cobertura total actual                                                                      | Bloquea TS 7 (peer `<6.1.0`), lint tipado lento                   | Línea base y rollback                                  |

Cómo demostrar que no se pierde cobertura (aplica a toda etapa de lint): (1) corpus de **mutantes**: un fixture por regla que debe fallar con ESLint antes del cambio y con la herramienta nueva después (ya existe base en `eslint-guards.test.ts:50-395`; se amplía a runner agnóstico); (2) lint de `scripts/ src/web/ src/emails/` con ambas herramientas y `diff` de hallazgos = 0 sobre el código actual; (3) test de **ownership**: cada regla activa figura en exactamente una herramienta (sin duplicados ni huecos); (4) el test de política de `ignores` (`eslint-guards.test.ts:369-395`) se replica para la config de Oxlint.

### Matriz de reglas ESLint → Oxlint

| Regla / guard (origen)                                                                                                                          | Propósito                        | Equivalente Oxlint                                    | Nivel de equivalencia                                                                              | Tipos  | Solución propuesta                                                |
| ----------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ------ | ----------------------------------------------------------------- |
| `eqeqeq`, `prefer-const`, `no-var` (`eslint.config.js:71-73`)                                                                                   | Higiene JS                       | `eslint/eqeqeq`, `prefer-const`, `no-var`             | Mismo nombre; opciones por probar                                                                  | No     | Mover a Oxlint tras mutantes                                      |
| `@typescript-eslint/no-unused-vars` (`:97`)                                                                                                     | Variables sin usar, `^_` en args | `eslint/no-unused-vars` / `typescript/no-unused-vars` | Parcial; patrón `argsIgnorePattern` por verificar                                                  | No     | Mover tras verificar opciones                                     |
| `@typescript-eslint/no-explicit-any` (`:98`)                                                                                                    | Prohibir `any`                   | `typescript/no-explicit-any`                          | Alta                                                                                               | No     | Mover a Oxlint                                                    |
| `consistent-type-imports` (`:99-102`)                                                                                                           | `import type` separado           | `typescript/consistent-type-imports`                  | Alta; `fixStyle` por verificar                                                                     | No     | Mover; Oxlint no sustituye `verbatimModuleSyntax` (TS)            |
| `no-warning-comments` (`@typedef`, `:103`)                                                                                                      | Prohibir `@typedef` en `.ts`     | `eslint/no-warning-comments`                          | Parcial; `location: anywhere` por verificar                                                        | No     | Mover si pasa mutante; si no, test propio                         |
| `no-floating-promises`, `no-misused-promises`, `await-thenable`, `no-redundant-type-constituents`, `require-await`, `return-await` (`:105-116`) | Corrección async/tipos           | Mismas reglas `typescript/*` vía `tsgolint`           | Alta por nombre; **comportamiento y opciones NO VERIFICADOS** (`checksVoidReturn`, `in-try-catch`) | **Sí** | Oxlint type-aware solo tras PoC y mutantes; hasta entonces ESLint |
| Sin `enum` (`selectors.ts:46`)                                                                                                                  | Aislamiento de capa sintáctica   | `typescript/no-enum`? (nombre similar)                | NO VERIFICADO; no declarar equivalente                                                             | No     | Mantener en ESLint (AST) salvo prueba                             |
| Sin reexports fuera de `index.ts` (`selectors.ts:56-70`)                                                                                        | Barrels puros                    | Ninguno                                               | NO COMPATIBLE                                                                                      | No     | ESLint (`no-restricted-syntax`) o `file-tree.test.ts`             |
| `types.ts` sin runtime / `constants.ts` sin funciones (`:73-105`)                                                                               | Roles de archivo                 | Ninguno                                               | NO COMPATIBLE                                                                                      | No     | ESLint reducido                                                   |
| Magic strings `/api/`, `X-ESP-Validation`, `RENDER_FAILED`, eventos (`:17-36`)                                                                  | Contratos compartidos            | Ninguno                                               | NO COMPATIBLE                                                                                      | No     | ESLint reducido                                                   |
| Claves `localStorage` literales (`:38-43`)                                                                                                      | Storage keys centralizadas       | Ninguno                                               | NO COMPATIBLE                                                                                      | No     | ESLint reducido                                                   |
| Imports de Node en `src/web` (`isolation-rules.ts:41-63`)                                                                                       | Aislamiento frontend             | `eslint/no-restricted-imports`                        | Parcial: `patterns[].regex` NO VERIFICADO                                                          | No     | Mover solo si el regex funciona; si no, ESLint                    |
| Aislamiento `contracts/` (`isolation-rules.ts:8-39`)                                                                                            | Contratos hoja sin Node ni `../` | `eslint/no-restricted-imports`                        | Parcial: igual que arriba                                                                          | No     | Igual                                                             |
| `check-file` nombres/carpetas kebab-case y blocklist (`:182-196`)                                                                               | Convención de nombres            | `unicorn/filename-case` (solo archivos)               | Parcial: sin carpetas ni blocklist                                                                 | No     | ESLint reducido o ampliar `file-tree.test.ts`                     |
| Entorno `globals` node/browser (`:42-66`)                                                                                                       | Globales por capa                | `env`/`globals` de Oxlint                             | Alta                                                                                               | No     | Configurar equivalente                                            |

### Oxfmt vs Prettier y lint-staged

- Alcance real de formato (`package.json:50-51`, `lint-staged` `:58-104`): ts, html, css, json, md, yml, `*.code-workspace`. Config actual `.prettierrc.json`: `semi`, comillas dobles, `printWidth 100`, `trailingComma all`, `endOfLine lf`; `.prettierignore` (dist, node_modules, .yarn, yarn.lock, .atl).
- **NO VERIFICADO:** salida de Oxfmt sobre los archivos reales. Procedimiento (MHB-53): copia en `mktemp -d`, formatear con ambas herramientas y `diff`; cualquier diferencia no pedida => conservar Prettier para ese tipo de archivo (híbrido por extensión es aceptable).
- `vp staged` (bloque `staged` en `vite.config.ts`) sustituiría a `lint-staged`; mismo mapa glob→comandos que `package.json:58-104`, sin perder `htmlhint`, `stylelint --fix`, `markdownlint-cli2 --fix`, `validate-json`.

### Etapas (ordenadas por riesgo; cada una es un futuro ID ODD)

Cada etapa conserva: rama `feature/<id>`, un commit revertible, CHANGELOG `[Unreleased]` si hay efecto observable, `STATUS.md` y revisión independiente. Validación automática común (**VC**): `bun install --frozen-lockfile`, `bun run lint`, `bun run typecheck`, `bun run test`, `bun run format:check`, `bun run build`, `bun run validate-email`, `bun run check:dist-baseline`, `bun run check-size`, `bun run check:a11y`, `git diff --check`.

#### MHB-52 — PoC aislada de Vite+ (solo lectura sobre el repo)

- **Objetivo:** decidir con evidencia si `vp` convive con Vite 8, Vitest 5, Maizzle 5.5 y los plugins propios.
- **Archivos:** ninguno del repo; copia en `mktemp -d`. Resultado en `STATUS.md`.
- **Dependencias:** ninguna.
- **Cambios de config:** ninguno en el repo.
- **Comandos:** en la copia, instalar `vite-plus`, ejecutar `vp test`, `vp check`, build propio y `check:dist-baseline`; `node --version`, `bun --version`.
- **Riesgos:** alias de `vite` rompe `scripts/vite/plugins/*`; Vitest pinneado difiere; Node 24 <24.11.
- **Validaciones:** `process.chdir` de `env.test.ts:14,19`, `handlebars.test.ts:90,94`, `built-templates.test.ts:12,16` pasan con `pool: "forks"` (no se cambia); `dist/` idéntico; versión real de Vite+ y soporte Bun registrados.
- **Aceptación:** informe go/no-go con resultados de los 4 puntos; cualquier fallo detiene la Fase H.
- **Rollback:** borrar el directorio temporal.

#### MHB-53 — Paridad de formato Oxfmt vs Prettier

- **Objetivo:** decidir por extensión si Oxfmt reemplaza a Prettier.
- **Archivos:** ninguno (análisis) o `package.json`/config de formato si se adopta.
- **Dependencias:** MHB-52 go.
- **Cambios de config:** bloque `fmt` en `vite.config.ts` con las opciones de `.prettierrc.json`; `.prettierignore` migrado.
- **Comandos:** formateo con ambas herramientas en copia temporal y `diff -r`.
- **Riesgos:** diff masivo de formato; divergencias md/yaml/html; ruido en `dist/` si se formatea.
- **Validaciones:** `format:check` verde; diff 0 o cambios aprobados y aislados en commit propio; `dist/` excluido.
- **Aceptación:** `bun run format` y `format:check` conservan nombre y semántica.
- **Rollback:** revertir el commit; Prettier permanece disponible.

#### MHB-54 — Oxlint en paralelo (modo sombra, sin retirar ESLint)

- **Objetivo:** ejecutar Oxlint sobre reglas nativas sin que bloquee, y medir diferencias con ESLint.
- **Archivos:** `vite.config.ts` (bloque `lint`), `package.json`, `scripts/validators/lint-guards/*` (runner agnóstico).
- **Dependencias:** MHB-52 go.
- **Cambios de config:** reglas de la matriz marcadas «Mover» únicamente; sin `ignores` nuevos ni `eslint-disable`.
- **Comandos:** `vp lint` en modo informativo + `eslint` actual.
- **Riesgos:** falsos negativos; duplicación de reglas.
- **Validaciones:** corpus de mutantes y `diff` de hallazgos = 0 sobre código actual; test de ownership.
- **Aceptación:** reporte de paridad por regla; `lint` público sin cambios.
- **Rollback:** eliminar bloque `lint` y script auxiliar.

#### MHB-55 — Reparto de reglas: ESLint reducido + Oxlint (enfoque B)

- **Objetivo:** mover a Oxlint las reglas con paridad demostrada y dejar en ESLint solo AST, `check-file` y aislamiento no verificables.
- **Archivos:** `eslint.config.js`, `vite.config.ts`, `package.json`, `eslint-guards.test.ts` (partir si supera 400 líneas), `docs/implementation/STATUS.md`.
- **Dependencias:** MHB-54.
- **Cambios de config:** quitar de ESLint solo las reglas movidas; `lint` encadena Oxlint y ESLint reducido más HTMLHint, markdownlint, `validate-json`, Stylelint.
- **Riesgos:** regla duplicada o huérfana; pérdida del type-aware si `tsgolint` diverge.
- **Validaciones:** mutantes por regla, ownership, política de `ignores` replicada.
- **Aceptación:** `bun run lint` falla ante cada mutante y pasa en el repo; ninguna regla en dos herramientas.
- **Rollback:** revertir el commit (restaura ESLint completo).

#### MHB-56 — Hooks y staged

- **Objetivo:** reemplazar `lint-staged` por `vp staged` y, si se acuerda, Husky por `vp config`, sin perder pasos.
- **Archivos:** `package.json` (`lint-staged`, `prepare`), `vite.config.ts` (`staged`), `.husky/pre-commit`, `.husky/pre-push`.
- **Dependencias:** MHB-55; MHB-53 para el formato.
- **Cambios de config:** mantener `check-task-branch` antes del staged (`pre-commit:1`), `run-scripts.ts lint build` en pre-push, `post-checkout` (`agents:sync`) y `prepare-commit-msg` intactos.
- **Riesgos:** `core.hooksPath=.husky/_` (confirmado en `.git/config:8`); hook roto bloquea commits.
- **Validaciones:** commit de prueba en rama temporal con archivo que viola cada tipo (ts, html, css, md, json); todos se rechazan o corrigen.
- **Aceptación:** mismo mapa glob→comando que `package.json:58-104`.
- **Rollback:** restaurar `lint-staged` y `.husky/pre-commit`.

#### MHB-57 — CI

- **Objetivo:** adaptar `ci.yml` sin perder jobs ni gates.
- **Archivos:** `.github/workflows/ci.yml`.
- **Dependencias:** MHB-55 y MHB-56.
- **Cambios de config:** el job «Format & Lint» (`:23`, `:60`, `:63-64`) sigue llamando `bun run format:check` y `bun run lint`; el agregador `CI Pipeline` (`:174-187`) mantiene los 5 resultados; matriz `package-managers` (`:123-171`) valida que Vite+ no rompe npm/yarn/pnpm.
- **Riesgos:** nombre del check requerido cambia; caché de Bun; instalación del binario `vp`.
- **Validaciones:** PR de prueba con CI completa en verde; `git diff --exit-code -- dist/ bun.lock`.
- **Aceptación:** mismos jobs y gates; `pr-guard.yml`, `audit.yml` sin cambios.
- **Rollback:** revertir el commit del workflow.

#### MHB-58 — TypeScript 7 (reemplaza el disparador de MHB-48)

- **Objetivo:** subir `typescript` a `7.x` con lint tipado vía Oxlint/`tsgolint` y sin la API `ts`.
- **Archivos:** `package.json`, `bun.lock`, `tsconfig.json`, `scripts/validators/lint-guards/file-tree.test.ts`, `docs/implementation/STATUS.md`, `CHANGELOG.md`.
- **Dependencias:** MHB-55 (el lint tipado ya no depende de `typescript-eslint`; si ESLint reducido conserva reglas tipadas, no se cumple y se detiene).
- **Cambios de config:** versión fija de `typescript`; retirar `typescript-eslint` solo si ya no tiene reglas; reescribir el análisis de barrels de `file-tree.test.ts:174-187` sin `import ts` (p. ej. análisis textual/AST ligero).
- **Riesgos:** `tsc` de TS 7 sin `main`; opciones removidas de `tsconfig`; `strict`, `verbatimModuleSyntax`, `erasableSyntaxOnly` no se tocan.
- **Validaciones:** **VC** más `rg -n "eslint-disable|@ts-ignore|@ts-expect-error" scripts src` sin entradas nuevas.
- **Aceptación:** `typecheck` y `lint` verdes con `typescript 7.x`; `dist/` idéntico.
- **Rollback:** revertir el commit de versión (conserva TS 6.0.3).

#### MHB-59 — Gentleman: instrucciones, skills y scripts

- **Objetivo:** reflejar el tooling final sin romper adaptadores.
- **Archivos (fuentes canónicas, nunca los adaptadores):** `docs/ai/AGENTS.md:78-79`; `docs/ai/skills/email-quality-gates/SKILL.md:11-19`, `task-verification/SKILL.md:11,33`, `email-code-conventions/SKILL.md:29`, `task-review/SKILL.md:30,36`, `task-status-management/SKILL.md:38`, `email-refactor-type-safety/SKILL.md:30`; `README.md:437-438`; `vite-mhb-email.code-workspace:24-52,126,130`; `scripts/inventory/check-migration-inventory.ts:17`; `CHANGELOG.md`.
- **Dependencias:** MHB-55 y MHB-53.
- **Cambios de config:** la prohibición de `ignores`, `eslint-disable`, `@ts-ignore` y `@ts-expect-error` se redacta de forma agnóstica a la herramienta (y cubre `oxlint-disable`); la allowlist `.js` (`eslint.config.js`, `maizzle.config.js`) se ajusta si `eslint.config.js` desaparece.
- **Comandos:** `bun run agents:sync`, `bun run agents:check` (con su preflight; nunca el `sync-agents.js` heredado).
- **Riesgos:** adaptadores raíz (`CLAUDE.md`, `.agents/skills` y demás symlinks) desincronizados.
- **Validaciones:** `agents:check` verde; grep sin referencias huérfanas a herramientas retiradas.
- **Aceptación:** ninguna instrucción cita una herramienta que ya no se ejecuta.
- **Rollback:** revertir el commit y volver a sincronizar.

#### MHB-60 — Release del tooling

- **Objetivo:** publicar el cambio de tooling con `dist/` idéntico. Versión SemVer decidida al congelar (probablemente minor; major solo si cambia un comando público o `engines`).
- **Archivos / procedimiento:** los de MHB-15 y `release-management`.
- **Dependencias:** MHB-55 a MHB-59.
- **Aceptación y rollback:** los de MHB-15; decisión explícita del usuario antes de etiquetar.

### Matriz de conservación funcional

| Funcionalidad                                                               | Herramienta actual                                 | Solución futura                                         | Estado                          | Prueba de aceptación                                           |
| --------------------------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------- | ------------------------------- | -------------------------------------------------------------- |
| Reglas JS/TS nativas                                                        | ESLint + typescript-eslint                         | Oxlint                                                  | COMPATIBLE CON AJUSTES          | Mutantes por regla, `diff` de hallazgos = 0                    |
| Lint tipado (promises, async, return-await)                                 | typescript-eslint con `tsconfig.json`              | Oxlint + `tsgolint`                                     | NO VERIFICADO                   | Mutantes tipados; opciones `checksVoidReturn` e `in-try-catch` |
| Guards AST (enum, reexports, magic strings, roles de archivo, localStorage) | ESLint `no-restricted-syntax`                      | ESLint reducido (o plugin JS alpha)                     | NO COMPATIBLE en Oxlint         | `eslint-guards.test.ts` verde                                  |
| Aislamiento contracts/web                                                   | ESLint `no-restricted-imports`                     | Oxlint si el regex funciona; si no, ESLint              | NO VERIFICADO                   | Fixtures de import prohibido fallan                            |
| Nombres de archivos y carpetas                                              | `eslint-plugin-check-file`                         | ESLint reducido o `file-tree.test.ts`                   | NO COMPATIBLE en Oxlint         | Fixture de carpeta no kebab-case falla                         |
| Árbol de archivos (límites, barrels)                                        | `file-tree.test.ts` con API `ts`                   | Mismo test sin `import ts`                              | COMPATIBLE CON AJUSTES (MHB-58) | `bun run test` verde con TS 7                                  |
| Formato                                                                     | Prettier                                           | Oxfmt o Prettier por extensión                          | NO VERIFICADO                   | `diff -r` de formato = 0 en MHB-53                             |
| Lint de HTML                                                                | HTMLHint                                           | Se conserva                                             | Sin cambio                      | `bun run lint`                                                 |
| Lint de CSS                                                                 | Stylelint                                          | Se conserva                                             | Sin cambio                      | `bun run lint`                                                 |
| Lint de Markdown                                                            | markdownlint-cli2                                  | Se conserva                                             | Sin cambio                      | `bun run lint`                                                 |
| Validación JSON                                                             | `validate-json.ts`                                 | Se conserva                                             | Sin cambio                      | `bun run lint`                                                 |
| Accesibilidad                                                               | axe-core + puppeteer (`check-a11y.ts`)             | Se conserva                                             | Sin cambio                      | `bun run check:a11y`                                           |
| Contraste                                                                   | `validate-contrast.ts`                             | Se conserva                                             | Sin cambio                      | `bun run check:a11y`                                           |
| Tamaño HTML                                                                 | `check-html-size.ts`                               | Se conserva                                             | Sin cambio                      | `bun run check-size`                                           |
| Compatibilidad de email                                                     | `validate-email-html.ts` + `email-rules/**`        | Se conserva                                             | Sin cambio                      | `bun run validate-email`                                       |
| Tests e aislamiento `chdir`                                                 | Vitest `pool: "forks"` (`vitest.config.ts:8`)      | `vp test` solo si pasa con `forks`; si no, `vitest run` | NO VERIFICADO                   | Suites con `process.chdir` verdes                              |
| Build, inline CSS, flatten, variables SendGrid                              | `build.ts` + Maizzle 5.5                           | Se conserva                                             | Sin cambio                      | `check:dist-baseline` y `git diff --exit-code -- dist/`        |
| Typecheck                                                                   | `tsc --noEmit` TS 6.0.3                            | `tsc` TS 7 (MHB-58); `vp check` es opcional             | COMPATIBLE CON AJUSTES          | `bun run typecheck`                                            |
| Pre-commit                                                                  | Husky + `check-task-branch` + lint-staged          | `vp staged` (conserva la rama y el mapa)                | NO VERIFICADO                   | Commit de prueba por tipo de archivo                           |
| Pre-push / post-checkout / commit-msg                                       | `run-scripts.ts lint build`, `agents-sync`, filtro | Se conservan                                            | Sin cambio                      | Ejecución de cada hook                                         |
| CI                                                                          | `ci.yml` (5 jobs + agregador)                      | Mismos jobs                                             | COMPATIBLE CON AJUSTES          | PR de prueba verde                                             |
| Matriz multi-package-manager                                                | CI `package-managers` (yarn, npm, pnpm)            | Se conserva                                             | NO VERIFICADO con `vp`          | Job verde; `bun.lock` intacto                                  |
| Instrucciones y skills Gentleman                                            | `docs/ai/**` citan ESLint y Prettier               | Texto actualizado en MHB-59                             | Pendiente                       | `agents:check` y grep sin huérfanos                            |
| Editor                                                                      | `.code-workspace` (Prettier, htmlhint)             | Ajustado según MHB-53                                   | Pendiente                       | Revisión manual declarada                                      |

### Riesgos residuales y exclusiones

- Vite+ reemplaza Vite y fija Vitest: puede chocar con `vite 8.3.5`, `vitest 5.0.5` y los plugins de `scripts/vite/plugins/*`; MHB-52 es el punto de parada.
- `engines.node >=24` queda por debajo de `^24.11` de Vitest 5; decidir elevar a `>=24.11` (cambio de contrato, posible major).
- Hallazgo ajeno: `check-a11y.ts:171` contiene un `@ts-expect-error` que contradice las invariantes; documentarlo como desviación o corregirlo en un ID propio, no en la Fase H.
- Exclusiones: no cambiar `pool: "forks"`, no migrar a Maizzle 6, no tocar templates ni `dist/`, no tocar los adaptadores generados, no sustituir scripts públicos por comandos `vp`, no añadir exclusiones de lint.
- Esta fase no depende del disparador externo de MHB-48; si se ejecuta MHB-58, MHB-48 queda reemplazado.

## Contrato obligatorio de cierre

Cada elemento debe conservar en el contrato transferido objetivo, archivos, pasos, dependencias, aceptación, pruebas automáticas, validación manual, riesgos, exclusiones y resultado esperado. Una skill puede añadir controles, pero no sustituir esos campos ni rebajar su aceptación.

### Estados y revisión independiente

1. `Pendiente`: dependencias o autorización todavía no satisfechas.
2. `En progreso`: implementador asignado y propiedad de archivos registrada.
3. `En revisión`: implementación terminada; se registran diff, comandos, resultados, desviaciones y riesgos. El implementador no puede marcarla `Completada`.
4. `Bloqueada`: un control obligatorio falla o falta un resultado de control; no se inicia la tarea dependiente.
5. `Completada`: un revisor independiente confirma aceptación, diff, pruebas, lint, typecheck/build cuando correspondan y ausencia de cambios fuera de alcance; el orquestador dicta el veredicto.

### Matriz mínima de comprobación

| IDs    | Prueba automática mínima                                                             | Validación manual                                                                    | Resultado de cierre                                                                |
| ------ | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| MHB-14 | Validadores disponibles; no sustituyen pruebas reales.                               | Teclado/lector y Gmail/Outlook/Apple Mail con protocolo fechado.                     | Matriz por cliente/criterio, limitaciones declaradas en `STATUS.md`.               |
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

1. **Fase C: completada.** MHB-14 cerrada y MHB-15 publicada como `v1.3.0` (tag `v1.3.0` en `81d2b7c`, 2026-11-21).
2. **Fase D:** MHB-36 puede ejecutarse en paralelo con MHB-14 por no compartir superficie; si se mergea antes del congelamiento de MHB-15, entra en `v1.3.0`. MHB-61 (versión mínima de Node) no depende de otros IDs y debe cerrarse antes del congelamiento. Después, MHB-49 (release `v1.4.0`).
3. MHB-48 (TypeScript 7) solo cuando `typescript-eslint` soporte TS 7; en paralelo con MHB-36. Entra en la release cuyo congelamiento ocurra después de su cierre.
4. **Fase E:** MHB-38 dentro de su ventana (no antes de 2027-01-15, límite 2027-06-30) o antes si se registra un disparador, siempre tras MHB-36; es, junto con un ID que lo autorice explícitamente, la única vía para actualizar el baseline de `dist/`. Después, MHB-50.
5. **Fase F:** MHB-16 y MHB-23 desde la publicación de `v1.3.0`; someter el producto a revisión final independiente antes de declararlo listo para presentarse como caso de portafolio.
6. **Fase H (propuesta, sin fecha):** solo con acuerdo explícito. Empieza por MHB-52 (PoC aislada); su resultado go/no-go decide si continúan MHB-53 a MHB-60. Es independiente de las Fases D a F y, si se ejecuta MHB-58, MHB-48 queda reemplazado.

### Política de ramas y versiones conservada

- Una tarea por rama `feature/<id-en-minusculas>` y PR directo a `master`; no se mezclan tareas ni se incrementa versión por cada una.
- Cada fase cierra con su propio ID de release (MHB-15 → `v1.3.0`, MHB-49 → `v1.4.0`, MHB-50 → migración de stack); la versión solo cambia dentro de esos IDs.
- `v1.3.0` es el baseline publicado (tag en `81d2b7c`); `v1.2.0` queda como referencia histórica. Cualquier versión, tag o release posterior requiere alcance validado y aprobación explícita del orquestador.
- Tag, CHANGELOG, versión y release deben apuntar al mismo alcance. Ningún subagente publica o mueve referencias sin aprobación del orquestador.
- `dist/` permanece versionado; las capturas son entregables documentales. `task-verification` debe evitar commits accidentales fuera de tarea.

## Criterios para estar listo para portafolio

- CI cubre las rutas relevantes; lint, typecheck, pruebas, build y formato están verdes en la matriz declarada.
- Todo el código propio del alcance está en TypeScript estricto y el guard de inventario impide reintroducir `.js`/`.mjs`.
- Los templates de producto, preview seguro y descarga de HTML funcionan y están verificados.
- Hay resultados fechados de accesibilidad, rendimiento y clientes de correo.
- La documentación, versión, tag y release posterior concuerdan; existe una demostración candidata o instrucciones reproducibles para el flujo.
- MHB-16 sigue opcional solo si la puerta final acepta la demostración local reproducible; si ese resultado es insuficiente, pasa a requerida antes de `Listo para portafolio`.
- La verificación final aprueba el caso. Publicarlo en una superficie externa del portafolio es una acción posterior y separada.

## Impacto de nombre o combinación de repositorios

No se cambia el repositorio ni se combina con otro caso. `EmailForge Toolkit` es el nombre de producto; `vite-mhb-email` conserva su slug, URL y paquete históricos. Toda release posterior usa ambos nombres de forma coherente.

## Diseño de orquestación

Las skills son contratos de procedimiento; los subagentes son ejecuciones temporales. Cada subagente recibe IDs, skills obligatorias, archivos exclusivos, controles y condición de escalamiento. Ninguna identidad se persiste como agente permanente.

### Orquestación — Fase C — Comprobación y release v1.3.0

| Línea                      | Skills obligatorias                              | Implementador y propiedad            | Revisor     | Controles                                                            | Escalar cuando                                                                                |
| -------------------------- | ------------------------------------------------ | ------------------------------------ | ----------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| MHB-14 comprobación manual | `email-compatibility`, `email-preview-dashboard` | Perfil alto; matriz/capturas         | Orquestador | Protocolo fechado, clientes reales y accesibilidad                   | No haya acceso a cliente/dispositivo o aparezcan datos sensibles.                             |
| MHB-15 release             | `task-verification`, `release-management`        | Perfil medio; docs/version/changelog | Orquestador | Suite, inventario TS, `check:dist-baseline`, Go/No-Go, tag y release | Antes de publicación, tag o cambio de versión, o ante un hallazgo que rompa el congelamiento. |

### Orquestación — Fase D — Portabilidad y release v1.4.0

| Línea               | Skills obligatorias                                               | Implementador y propiedad                                                 | Revisor                    | Controles                                               | Escalar cuando                                                          |
| ------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------- | -------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------- |
| MHB-36 multi-PM     | `email-project-stack`, `email-quality-gates`, `task-verification` | Orquestador + un subagente nuevo por fase; scripts/tests/CI/docs          | Revisor técnico            | Gates con 4 PMs, Vitest verde, hashes idénticos         | Un PM no instala o altera `dist/`, o Vitest exige tocar lógica no-test. |
| MHB-48 TypeScript 7 | `email-project-stack`, `email-quality-gates`, `task-review`       | Perfil medio; `package.json`, `bun.lock`, `tsconfig*.json`                | Revisor técnico de tooling | Typecheck, lint tipado, suite y baseline                | `typescript-eslint` no soporta TS 7 o falta la API `ts`.                |
| MHB-61 Node mínimo  | `email-project-stack`, `task-verification`                        | Perfil bajo; `package.json`, `.nvmrc`, `.node-version`, README, CHANGELOG | Revisor técnico de tooling | Gates globales con Node 24.22.3 y CI                    | `dist/` cambia o CI no ofrece Node 24.22.3.                             |
| MHB-62 dependencias | `email-project-stack`, `email-quality-gates`, `task-verification` | Perfil bajo; `package.json`, `bun.lock`, CHANGELOG                        | Revisor técnico de tooling | Gates globales tras cada commit                         | `dist/` cambia o un gate falla.                                         |
| MHB-49 release      | `task-verification`, `release-management`                         | Perfil medio; docs/version/changelog                                      | Orquestador                | Lo de MHB-15 más instalación con npm y bun desde el tag | Lo de MHB-15 o un cambio de comando público.                            |

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

### Orquestación — Fase H — Migración de tooling a Vite+ (propuesta)

| Línea                     | Skills obligatorias                                            | Implementador y propiedad                                     | Revisor                    | Controles                                        | Escalar cuando                                                               |
| ------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------- | -------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------- |
| MHB-52 PoC                | `email-project-stack`, `email-quality-gates`                   | Perfil alto; solo copia temporal                              | Orquestador                | Suite, build y baseline en la copia              | `vp` altere `dist/`, rompa `chdir`/`forks` o los plugins de `scripts/vite/`. |
| MHB-53 formato            | `email-quality-gates`, `task-verification`                     | Perfil medio; config de formato                               | Revisor técnico de tooling | `diff -r` Prettier vs Oxfmt, `format:check`      | Haya diferencias no pedidas en md/yaml/html.                                 |
| MHB-54, MHB-55 lint       | `email-quality-gates`, `email-code-conventions`, `task-review` | Perfil alto; `eslint.config.js`, `vite.config.ts`             | Revisor técnico de tooling | Mutantes por regla, ownership, diff de hallazgos | Una regla pierda cobertura o quede duplicada.                                |
| MHB-56, MHB-57 hooks y CI | `email-project-stack`, `task-verification`                     | Perfil medio; `.husky`, `ci.yml`                              | Revisor técnico de tooling | Commit de prueba por tipo, PR de prueba en verde | Cambie un check requerido o se pierda un hook.                               |
| MHB-58 TypeScript 7       | `email-project-stack`, `email-quality-gates`, `task-review`    | Perfil medio; `package.json`, `tsconfig`, `file-tree.test.ts` | Revisor técnico de tooling | **VC** de la Fase H                              | Quede una regla tipada en ESLint o falle la API `ts`.                        |
| MHB-59 Gentleman          | `task-verification`, `email-code-conventions`                  | Perfil medio; `docs/ai/**`, README                            | Orquestador                | `agents:sync`, `agents:check`, grep de huérfanos | Los adaptadores queden desincronizados.                                      |
| MHB-60 release            | `task-verification`, `release-management`                      | Perfil medio; docs/version/changelog                          | Orquestador                | Lo de MHB-15                                     | Lo de MHB-15 o cambio de `engines`.                                          |

El orquestador conserva integración, decisiones transversales, cambios destructivos, versiones, releases y veredictos. Solo paraleliza líneas con archivos exclusivos y al menos dos ámbitos realmente independientes.
