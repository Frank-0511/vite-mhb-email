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
| MHB-43, MHB-36                     | Mover     | Pasan a la Fase D y forman la release `v1.4.0`.                                                        |
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
| D    | MHB-43 | Higiene de dependencias                       | Pendiente | Satisfecha (MHB-34 completada) |
| D    | MHB-36 | Compatibilidad multi-package-manager          | Pendiente | MHB-43                         |
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

- **Contenido de la release:** todo lo completado y mergeado en `master` desde `v1.2.0` (`git log v1.2.0..master`: migración TypeScript completa hasta MHB-34, gobernanza MHB-40, contrato de salida MHB-41, protección de `master` MHB-45, compatibilidad HTML MHB-44, API local MHB-46 y contrato ESP MHB-47) más MHB-14.
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
- **Versión decidida (2026-10-08):** `v1.3.0` (minor). Desde `v1.2.0` no se eliminó ni renombró ningún comando público; solo se añadieron (`benchmark`, `generate:icons`, `esp:manifest`, `check:dist-baseline`, `update:dist-baseline` y `check:inventory`, verificado con `git show v1.2.0:package.json`). Si la verificación detecta una eliminación o renombre público, escalar antes de etiquetar.
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

- **Contenido de la release:** MHB-43, MHB-36 y, si su disparador se cumple antes del congelamiento, MHB-48.
- **Orden:** MHB-43 → MHB-36 → MHB-49; MHB-48 en paralelo con MHB-43 y MHB-36 por no compartir superficie.
- **Entregables:** dependencias mínimas clasificadas por rol, build sin CLI `maizzle`, compatibilidad con npm, yarn, pnpm y bun, y release `v1.4.0`.
- **Riesgos:** la API programática de Maizzle no reproduce `dist/`; incompatibilidades sutiles entre package managers; romper un comando público.
- **Criterio de salida:** MHB-36 confirma que el proyecto funciona con los 4 managers con `dist/` idéntico y `v1.4.0` publicada por MHB-49.

### MHB-43 — Higiene de dependencias

- **Objetivo observable:** que cada dependencia tenga al menos un consumidor real, esté en la sección que corresponde a su rol y tenga tipos alineados con el runtime declarado, reduciendo lo que MHB-36 debe llevar a cuatro package managers.
- **Criterio de clasificación:** el paquete es `private: true`, no se publica ni se despliega, así que la separación no cambia lo que instala un `bun install` completo; sí cambia un `--production`/`--omit=dev` y documenta qué necesita la herramienta para funcionar. `dependencies`: lo que exigen los comandos de uso (`dev`, `build`, `build-selective`, `cli`, `generate:email`, `export:screenshot`, envíos de prueba). `devDependencies`: calidad y tooling de desarrollo (lint, formato, tests, typecheck, hooks, `a11y-check`, tipos).
- **Diagnóstico al 2026-09-23:** 2 `dependencies` (`handlebars`, `lucide`) y 26 `devDependencies`; todas tienen consumidor salvo el CLI `maizzle`, que solo se invoca vía `execSync("maizzle build")` en `scripts/build/build.ts`. Paquetes de uso clasificados como desarrollo: `@maizzle/framework`, `vite`, `tailwindcss`, `postcss`, `autoprefixer`, `fs-extra`, `glob`, `puppeteer` y `nodemailer`. `@types/node@26` no coincide con `engines.node >=24`. El Node local observado es 22.23.1, por debajo de `engines`.
- **Superficies autorizadas:** `package.json`, `bun.lock`, `scripts/build/build.ts`, los módulos que importan `fs-extra` (16 no-test) o `glob` (7 no-test, incluido `maizzle.config.js`) al 2026-09-24, revalidar tras MHB-34, `maizzle.config.*`, un helper de JSON/filesystem en `scripts/shared/` si tiene ≥ 2 consumidores, sus tests, `README.md` (requisitos) y `docs/implementation/STATUS.md`.
- **Dependencias y precondiciones:** MHB-34 completada (configuraciones ya en su forma final) y MHB-41 completada (`check:dist-baseline` demuestra que el HTML no cambia).
- **Pasos técnicos:**
  1. Tabla de inventario: paquete, consumidores, rol, sección actual y sección propuesta.
  2. Sustituir `execSync("maizzle build")` por la API programática de `@maizzle/framework` y eliminar el paquete `maizzle` (CLI). Si la API no produce un `dist/` idéntico, escalar y conservar el CLI.
  3. Sustituir `fs-extra` por `node:fs`/`node:fs/promises` (`mkdir` con `recursive`, `rm` con `recursive` y `force`, `existsSync`, lectura/escritura JSON) y eliminarlo.
  4. Sustituir `glob` por `globSync` de `node:fs` (verificado en Bun 1.3.13 y Node 22.23.1 el 2026-09-23) y eliminarlo.
  5. Reclasificar según el criterio: pasan a `dependencies` los paquetes de uso que queden (`@maizzle/framework`, `vite`, `tailwindcss`, `postcss`, `autoprefixer`, `puppeteer`, `nodemailer`); `axe-core` y el tooling de calidad siguen en `devDependencies`.
  6. Alinear `@types/node` con el major mínimo de `engines.node` y documentar en `README.md` el Node requerido.
  7. `bun install` para regenerar `bun.lock` y `bun audit` sin vulnerabilidades nuevas.
- **Criterios de aceptación:**
  - `rg -n "fs-extra|from \"glob\"|maizzle build" scripts src` y `package.json` sin `fs-extra`, `glob` ni `maizzle`.
  - Toda dependencia restante tiene consumidor en la tabla y está en la sección de su rol.
  - En un checkout limpio, `bun install --frozen-lockfile --production` seguido de `bun run build` termina en verde y `check:dist-baseline` confirma `dist/` idéntico.
  - `@types/node` coincide con el major mínimo de `engines.node`.
- **Validación automática:** `bun install --frozen-lockfile`, lint, typecheck, test, `format:check`, build, `validate-email`, `check:dist-baseline`, `check-size` y `git diff --check`.
- **Validación manual:** `bun run dev` (Home, Preview y Library), `export:screenshot` de un template y un flujo de `cli` hasta la selección de template.
- **Evidencia requerida:** tabla de inventario antes/después, diff de `package.json`, salida del build en modo producción y de `check:dist-baseline`.
- **Riesgos y reversión:** la API programática de Maizzle 5 difiere del CLI en rutas o en configuración; diferencias sutiles de `fs-extra` (por ejemplo, `remove` sobre rutas inexistentes). Un commit por paquete eliminado, cada uno revertible.
- **Exclusiones específicas:** no actualizar versiones (lo hace Dependabot), no cambiar majors de Maizzle ni Tailwind, no eliminar `postcss`, `autoprefixer` ni `tailwindcss` (los retira MHB-38), no añadir dependencias ni tocar `trustedDependencies` (MHB-36).
- **Análisis de mantenibilidad:** menos dependencias y un spawn de shell menos en el build; el helper JSON/filesystem solo se crea si reemplaza ≥ 2 consumidores reales de `fs-extra`.
- **Implementador:** perfil tooling, medio.
- **Revisor independiente:** revisor técnico de build.
- **Condición de escalamiento:** la API programática de Maizzle no reproduce `dist/`, algún `globSync` nativo difiere en resultados, o eliminar un paquete exige cambiar un comando público.

### MHB-36 — Compatibilidad multi-package-manager

- **Objetivo observable:** permitir que cualquier desarrollador clone el proyecto y trabaje con npm, yarn, pnpm o bun indistintamente, sin que ninguno sea obligatorio.
- **Motivación:** el código runtime ya usa exclusivamente APIs estándar de Node.js (cero `Bun.*`), pero scripts, tests, CI/CD, hooks y documentación están acoplados a Bun como único package manager.
- **Superficies autorizadas:** `package.json`, módulos que lanzan procesos o citan comandos del package manager (al 2026-09-23: `scripts/cli/actions.ts`, `scripts/cli/process-runner.ts`, `scripts/cli/template-prompts.ts`, `scripts/build/ensure-build.ts` (antes `build-helper.ts`), `scripts/perf/measure-benchmarks.ts`, `scripts/perf/benchmark-runner.ts` y `scripts/export/renderers.ts`; `scripts/cli/helpers.ts` ya no existe; lista revalidada el 2026-09-24 tras los renombres de MHB-39), `.yarnrc.yml` (nuevo), `lint-staged` config, todos los archivos de test `*.test.ts` (conteo inventariado al iniciar), `bunfig.toml`, `types/bun-test.d.ts`, `vitest.config.*` (nuevo), `.github/workflows/ci.yml`, `.github/workflows/audit.yml`, `.husky/*`, `AGENTS.md`, `CLAUDE.md`, `README.md`, skills bajo `docs/ai/skills/`, documentación de implementación y un helper nuevo `scripts/shared/env/detect-pm.ts`.
- **Dependencias y precondiciones:** MHB-34 completada para evitar doble churn durante la migración TypeScript; MHB-43 completada (sin el CLI `maizzle` ni otras dependencias sobrantes que migrar entre managers); MHB-41 completada (baseline de `dist/` y gates de email en CI que deben sobrevivir al cambio de runtime); todos los tests ya convertidos a `.ts`; `tsconfig.json` con `verbatimModuleSyntax` y `erasableSyntaxOnly` y guard `consistent-type-imports` activo (MHB-34/MHB-37), de modo que el código propio sea ejecutable con type stripping de Node 24 (validado en MHB-42); allowlist cerrada de MHB-42 (`eslint.config.js` y wrapper `maizzle.config.js`) respetada en la comprobación multi-manager.
- **Pasos técnicos:**
  - **F0 — Inventario:** contar scripts de `package.json` que invocan `bun`, archivos de test que importan `bun:test` (74 al 2026-09-24) y puntos que lanzan procesos o citan un package manager (incluido el mensaje legacy `'yarn build'` de `scripts/cli/template-prompts.ts`); revalidar las rutas de este contrato; registrar el conteo en `STATUS.md`.
  - **F0b — Política de lockfiles:** decidir con el usuario qué lockfiles se versionan. Propuesta: solo `bun.lock` como fuente de verdad; npm, yarn y pnpm se prueban en CI instalando desde cero, y `.yarnrc.yml` fija `nodeLinker: node-modules` para evitar Plug'n'Play, incompatible con Vite y Maizzle.
  - **F0c — Plataformas soportadas:** decidir con el usuario si Windows entra en el soporte (hoy no se prueba: CI solo en `ubuntu-latest` y desarrollo en macOS). Si entra, añadir `windows-latest` a la matriz de CI y revisar rutas, `spawn` y fin de línea; si no, declararlo como no soportado en `README.md`.
  - **F1 — Scripts genéricos y detección de PM:** reemplazar los scripts de `package.json` que usan `bun script.ts` por `node script.ts` (type stripping nativo de Node 24, sin loaders ni dependencias nuevas); eliminar `"packageManager": "bun@1.3.13"` y `trustedDependencies` (Bun-only); actualizar `lint-staged`; crear `scripts/shared/env/detect-pm.ts` que detecte el PM activo via `process.env.npm_config_user_agent` o presencia de lockfiles.
  - **F2 — CLI y build helper agnósticos:** reemplazar las invocaciones fijas a `bun` en los módulos inventariados en F0 por detección dinámica del PM; actualizar mensajes de error; hacer graceful fallback en benchmarks si `bun -v` no está disponible; eliminar mensaje legacy `"yarn build"` en helpers.
  - **F3 — Migración de tests a Vitest:** agregar `vitest` como devDependency; crear `vitest.config.ts`; cambiar imports de `"bun:test"` a `"vitest"` en todos los archivos de test inventariados (`mock()` → `vi.fn()`, `spyOn()` → `vi.spyOn()`, `mock.module()` → `vi.mock()`); eliminar `bunfig.toml` y `types/bun-test.d.ts`; actualizar `package.json` scripts de test.
  - **F4 — CI/CD y hooks:** reemplazar `oven-sh/setup-bun` por `actions/setup-node` con Node 24 en los 2 workflows, conservando todos los pasos añadidos por MHB-41 y MHB-34 (`validate-email`, `check:dist-baseline`, `check-size`, `lint:contrast`, `a11y-check`, `check:inventory --require-zero` y `git diff --exit-code -- dist/`); actualizar comandos de hooks Husky a genéricos.
  - **F5 — Documentación y governance:** reescribir la invariante de Bun en AGENTS.md, CLAUDE.md, README.md y todas las skills bajo `docs/ai/skills/` (10 al 2026-09-24); actualizar tablas de comandos; documentar instalación con los 4 managers.
- **Criterios de aceptación:**
  - El proyecto se instala, lintea, typecheckea, testea, compila y valida con cada uno de los 4 managers (npm, yarn, pnpm, bun) desde un checkout limpio.
  - Ningún script de `package.json` ni código fuente contiene `"bun"` hardcodeado como único path de ejecución.
  - La suite completa de tests pasa bajo Vitest con Node y con Bun.
  - CI/CD corre en Node 24 sin dependencia de `oven-sh/setup-bun`.
  - Documentación refleja soporte multi-manager.
  - Con cada uno de los 4 managers, `check:dist-baseline` queda verde tras el build: el HTML exportado es idéntico al baseline de MHB-41.
- **Validación automática:** instalar con cada PM y ejecutar `typecheck`, `lint`, `test`, `build`, `validate-email`, `check:dist-baseline`, `format:check` y `agents:check`.
- **Validación manual:** clonar en directorio limpio y verificar el flujo completo con npm y con bun como extremos representativos.
- **Evidencia requerida:** logs de instalación y gates con cada PM; diff de scripts y imports migrados; confirmación de que `dist/*.html` es idéntico con todos los managers.
- **Riesgos y reversión:** romper resolución de módulos en algún PM; diferencias sutiles de comportamiento entre runners de test. Mitigación: ejecutar gates con los 4 managers como matrix CI; cada fase se revierte independientemente.
- **Exclusiones específicas:** no cambiar lógica de negocio, templates de email, output HTML ni APIs; no migrar a un monorepo; no añadir Corepack obligatorio.
- **Análisis de mantenibilidad:** el helper `detect-pm.ts` es un archivo pequeño (~30 líneas) con responsabilidad única; la migración de tests es mecánica (search-and-replace de imports); no se crean abstracciones nuevas innecesarias.
- **Implementador:** perfil tooling/infraestructura, medio-alto.
- **Revisor independiente:** revisor técnico.
- **Condición de escalamiento:** Node no puede ejecutar un `.ts` propio sin loader; un PM no soporta una feature usada por el proyecto (e.g. workspaces, lifecycle scripts); Vitest introduce incompatibilidad con algún mock existente; se requiere cambiar un contrato público; un PM resuelve dependencias transitivas distintas que alteran `dist/` (se decide con el usuario si se fija la versión o se acota el soporte).

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
- **Dependencias y precondiciones:** MHB-15 publicada, MHB-43 y MHB-36 completadas, CI verde en `master` y decisión explícita del usuario antes de publicar o etiquetar.
- **Versión propuesta:** `v1.4.0` (minor), porque el soporte multi-package-manager es aditivo. Pasar a `v2.0.0` solo si algún ID de la fase eliminó o renombró un comando público o elevó el requisito de runtime declarado en `engines`.
- **Procedimiento:** idéntico a MHB-15 (congelamiento de alcance, `release-management`, Go/No-Go, CHANGELOG `[1.4.0]` y sección «Contrato de salida para integradores» frente a `v1.3.0`, que debe declarar `dist/` idéntico). Las notas documentan la instalación con los 4 managers y los cambios de clasificación de dependencias.
- **Criterios de aceptación, validación, evidencia, riesgos y exclusiones:** los de MHB-15, añadiendo la instalación congelada con al menos npm y bun desde un checkout limpio del tag.
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
- **Validación automática:** `bun install --frozen-lockfile`, lint, typecheck, test, `format:check`, build, `validate-email` con `modern-css-inline`, `check-size`, `lint:contrast`, `a11y-check`, `agents:check` y `git diff --check`.
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
| MHB-43 | Gates completos, build con `--production` y `check:dist-baseline`.                   | `dev` (Home/Preview/Library), `export:screenshot` y flujo de `cli`.                  | Tabla de dependencias antes/después y diff de `package.json`.                      |
| MHB-36 | Instalación y gates completos con npm, yarn, pnpm y bun; suite Vitest verde.         | Clonar limpio e instalar con npm y bun como extremos representativos.                | Logs de 4 managers, diff de imports, hashes `dist/` idénticos entre managers.      |
| MHB-48 | Typecheck, lint tipado, suite y `check:dist-baseline` con TS 7.                      | Ninguna.                                                                             | Versiones antes/después y diff de `package.json`/`tsconfig*.json`.                 |
| MHB-49 | Lo de MHB-15 más instalación congelada con npm y bun desde el tag.                   | Lo de MHB-15.                                                                        | SHA, tag, URL de release, diff final y Go/No-Go.                                   |
| MHB-38 | `modern-css-inline`, suite, build, `validate-email`, `check-size` y diff de `dist/`. | Checkpoint PoC, preview, biblioteca, dashboard y Gmail/Outlook con envío autorizado. | Auditoría por template, diff justificado de `dist/`, matriz de dependencias y ADR. |
| MHB-50 | Lo de MHB-15 con diff de `dist/` frente a `v1.4.0`.                                  | Lo de MHB-15.                                                                        | SHA, tag, URL de release, diff justificado y Go/No-Go.                             |
| MHB-16 | Smoke del build estático y enlaces.                                                  | Navegar demo solo lectura en desktop/móvil.                                          | URL candidata, SHA desplegado y checklist.                                         |
| MHB-23 | Tests y validadores aplicables por componente.                                       | Aparición y edición en `/library`.                                                   | Schema, captura y build verde.                                                     |

### Gates globales

- Todos los cambios: `bun run format:check` y `git diff --check`.
- Markdown: `bun run lint:md`.
- JavaScript/TypeScript/configuración: `bun run lint` y `bun run typecheck` según alcance.
- Templates/layouts/CSS/build: `bun run build` y `bun run validate-email`; ERROR bloquea y WARNING/INFO no se ocultan. Desde MHB-41, también `bun run check:dist-baseline`; solo un ID que autorice cambiar `dist/` puede actualizar el baseline.
- Revisión independiente: desde MHB-40, el revisor aplica la skill `task-review`; lo declarado en `STATUS.md` no sustituye la re-ejecución de los gates.
- UI/API: pruebas automatizadas más `bun run dev` y recorrido manual cuando corresponda.
- Antes de cerrar una fase: instalación congelada, lint, typecheck, test, build y formato verdes en la versión de Bun fijada por el proyecto.
- Un control obligatorio `Fallido` o `No ejecutado` impide `Completada`, salvo excepción explícita aprobada por el orquestador con riesgo y nueva acción.

## Orden de ejecución

1. **Fase C:** ejecutar MHB-14 (evidencia en clientes reales sobre el HTML corregido por MHB-44) y después MHB-15 (release `v1.3.0`).
2. **Fase D:** MHB-43 puede ejecutarse en paralelo con MHB-14 por no compartir superficie; si se mergea antes del congelamiento de MHB-15, entra en `v1.3.0`. Después, MHB-36 tras MHB-43 y MHB-49 (release `v1.4.0`) tras MHB-36.
3. MHB-48 (TypeScript 7) solo cuando `typescript-eslint` soporte TS 7; en paralelo con MHB-43 y MHB-36. Entra en la release cuyo congelamiento ocurra después de su cierre.
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

| Línea               | Skills obligatorias                                               | Implementador y propiedad                                               | Revisor                    | Controles                                               | Escalar cuando                                                                          |
| ------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------- | -------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| MHB-43 dependencias | `email-project-stack`, `email-quality-gates`, `task-review`       | Perfil medio; `package.json`, build y consumidores de `fs-extra`/`glob` | Revisor técnico de build   | Build `--production`, `check:dist-baseline` y recorrido | La API de Maizzle no reproduce `dist/` o eliminar un paquete cambia un comando público. |
| MHB-36 multi-PM     | `email-project-stack`, `email-quality-gates`, `task-verification` | Perfil medio-alto; scripts/tests/CI/docs                                | Revisor técnico            | Gates con 4 PMs, Vitest verde, hashes idénticos         | Un PM no soporta una feature o Vitest rompe un mock.                                    |
| MHB-48 TypeScript 7 | `email-project-stack`, `email-quality-gates`, `task-review`       | Perfil medio; `package.json`, `bun.lock`, `tsconfig*.json`              | Revisor técnico de tooling | Typecheck, lint tipado, suite y baseline                | `typescript-eslint` no soporta TS 7 o falta la API `ts`.                                |
| MHB-49 release      | `task-verification`, `release-management`                         | Perfil medio; docs/version/changelog                                    | Orquestador                | Lo de MHB-15 más instalación con npm y bun desde el tag | Lo de MHB-15 o un cambio de comando público.                                            |

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
