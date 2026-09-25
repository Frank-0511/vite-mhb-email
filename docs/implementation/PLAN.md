# Plan de implementación — EmailForge Toolkit

Este documento contiene únicamente el trabajo pendiente. El baseline funcional
publicado es `v1.2.0`; los artefactos de Git conservan la trazabilidad previa.

## Objetivo vigente

Cerrar la puerta de calidad del producto con evidencia reproducible de
integración, tipos/rendimiento, accesibilidad en clientes reales y narrativa de
portafolio. Después se completará la migración gradual de todo el código
JavaScript propio a TypeScript estricto antes de preparar la siguiente release.

## Matriz de reestructuración del plan

| Ítem anterior | Decisión   | Tratamiento vigente                                                                             |
| ------------- | ---------- | ----------------------------------------------------------------------------------------------- |
| MHB-14        | Conservar  | Su evidencia manual sigue siendo independiente de la migración de lenguaje.                     |
| MHB-15        | Reemplazar | La release posterior dependerá del cierre total de TypeScript, además de MHB-14.                |
| MHB-16        | Reemplazar | La demo candidata dependerá de MHB-15, que ya incorpora el gate total de migración.             |
| MHB-23        | Conservar  | Sigue opcional y no se mezcla con la conversión de lenguaje.                                    |
| MHB-37        | Crear      | Contratos compartidos, constantes tipadas y guards de higiene de tipos previos a MHB-34.        |
| MHB-38        | Crear      | Migración en bloque a Maizzle 6 + Tailwind v4 (email y dashboard), programada desde 2027-01-15. |
| MHB-40        | Crear      | Gobernanza de agentes y revisión independiente ejecutable, tras MHB-39.                         |
| MHB-41        | Crear      | Gate del contrato de salida (`dist/` y variables ESP) y validadores de email en CI.             |
| MHB-42        | Crear      | Spike de loaders de configuración y decisión cerrada de excepciones antes de MHB-34.            |
| MHB-43        | Crear      | Higiene de dependencias: consumidores reales, clasificación por rol y tipos alineados.          |
| MHB-44        | Crear      | Compatibilidad del HTML exportado: colores, unidades e imágenes aptos para clientes reales.     |
| MHB-45        | Crear      | Protección de `master` y auto-merge de Dependabot restringido al pipeline no crítico.           |
| MHB-46        | Crear      | Guarda contra escrituras cross-site en la API local del servidor Vite.                          |
| MHB-47        | Crear      | Manifiesto de variables por template y perfil de sintaxis ESP (SendGrid).                       |
| MHB-34        | Ajustar    | Depende de MHB-42, adopta su allowlist y reapunta el linting con tipos de MHB-39.               |
| MHB-36        | Ajustar    | Depende de MHB-43; rutas revalidadas, lockfiles y hashes contra el baseline de MHB-41.          |
| MHB-14        | Ajustar    | Tras MHB-44; admite envíos reales con la integración ESP del usuario, con autorización.         |
| MHB-16        | Ajustar    | Riesgo registrado: `vite build` vaciaría `dist/` de email por `outDir` + `emptyOutDir`.         |
| MHB-15        | Ajustar    | Congelamiento de alcance, decisión SemVer y nota de contrato de salida para integradores.       |

No se reabre ninguna tarea completada; su trazabilidad vive en Git. La migración
a TypeScript por capas ya está completa: MHB-37 consolida contratos y constantes
tipadas antes del cierre estricto de MHB-34. Cada ID conserva una rama, revisión
y cierre independientes.

## Backlog activo

| ID     | Entregable                                             | Estado     | Dependencia vigente                   |
| ------ | ------------------------------------------------------ | ---------- | ------------------------------------- |
| MHB-37 | Contratos, constantes tipadas y guards de tipos        | Completada | Satisfecha                            |
| MHB-39 | Convenciones de nombres de archivo y linting con tipos | Completada | MHB-37                                |
| MHB-40 | Gobernanza de agentes y revisión independiente         | Completada | MHB-39                                |
| MHB-41 | Gate del contrato de salida y validadores en CI        | Completada | MHB-40                                |
| MHB-45 | Protección de `master` y política de Dependabot        | Completada | MHB-41                                |
| MHB-44 | Compatibilidad del HTML exportado con clientes reales  | Pendiente  | MHB-45                                |
| MHB-46 | Endurecimiento de la API local del servidor Vite       | Pendiente  | MHB-44                                |
| MHB-47 | Contrato de integración ESP y perfil SendGrid          | Pendiente  | MHB-46                                |
| MHB-42 | Spike de loaders y decisión de excepciones JS          | Pendiente  | MHB-47                                |
| MHB-34 | Cierre total y modo estricto TypeScript                | Pendiente  | MHB-42                                |
| MHB-43 | Higiene de dependencias                                | Pendiente  | MHB-34                                |
| MHB-36 | Compatibilidad multi-package-manager                   | Pendiente  | MHB-43                                |
| MHB-14 | Evidencia de uso y compatibilidad                      | Pendiente  | MHB-44                                |
| MHB-15 | Documentación, capturas y release posterior            | Pendiente  | MHB-14 y MHB-36                       |
| MHB-16 | Demo candidata pre-renderizada                         | Opcional   | MHB-15                                |
| MHB-23 | Ampliar biblioteca de componentes                      | Opcional   | Caso de uso aprobado                  |
| MHB-38 | Migración en bloque a Maizzle 6 y Tailwind v4          | Pendiente  | MHB-34, MHB-36 y ventana ≥ 2027-01-15 |

## Invariantes de calidad, arquitectura y refactor integrado

A partir de `v1.2.0`, todo trabajo técnico en EmailForge Toolkit debe regirse por estos principios obligatorios. No se crean tareas de refactor aisladas: la mejora estructural y el saneamiento de deuda técnica se ejecutan de forma continua como parte de cada entrega activa.

### 1. Reglas de codificación y límites estrictos

- **Límites de tamaño de archivo:** ningún archivo fuente (no-test) puede superar 250 líneas de código. Los archivos de test no deben superar 400 líneas (si crecen, deben dividirse por suite de pruebas o escenario).
- **Límites de directorio:** ningún directorio debe contener más de 8 archivos fuente sin estructurarse en subdirectorios temáticos por dominio (los tests co-locados no se contabilizan para este límite, pero no justifican directorios planos desordenados).
- **Responsabilidad única:** un archivo resuelve una sola responsabilidad. Si un módulo realiza parsing Y formateo, o validación Y reporte, debe dividirse en módulos especializados.
- **Shared first:** antes de implementar una función utilitaria o helper, revisar `scripts/shared/` o `src/web/shared/utils/`. Si existe, reutilizarla; si no existe pero tiene potencial reutilizable (≥2 consumidores), ubicarla en `shared/`. No hardcodear constantes de almacenamiento (`storage-keys.js`), breakpoints, magic numbers (e.g. `1024` para KB) ni cabeceras HTTP. En el frontend, el acceso al DOM y llamadas remotas deben usar exclusivamente `dom-helpers.js` (`queryRequired`, `querySafe`) y `http-helpers.js` (`fetchJSON`, `postJSON`, `debounce`).
- **Menos es más:** preferir eliminar código obsoleto o simplificar flujos antes que crear abstracciones preventivas o capas intermedias de una sola línea sin valor agregado.
- **Convención de nombres:** archivos en `kebab-case`, constantes exportadas en `UPPER_SNAKE_CASE`, funciones en `camelCase`, Web Components con prefijo `ef-`, y tests co-locados con sufijo `.test.js` / `.test.ts`.

### 2. Arquitectura de carpetas escalable (patrón feature-module)

Toda feature frontend o paquete de scripts debe organizarse bajo una jerarquía predecible y replicable a cualquier nivel de profundidad:

```text
feature-o-paquete/
├── main.js (o index.ts)      # Punto de entrada cohesivo: solo bootstrap y exports
├── feature.html              # Markup exclusivo si aplica
├── styles/                   # Hojas de estilo divididas por dominio temático
│   ├── layout.css
│   └── theme.css
└── modules/ (o subcarpetas)  # Lógica modular organizada por subdominio
    ├── controls/
    │   ├── component.js
    │   └── component.test.js
    └── render/
        ├── render-api.js
        └── render-api.test.js
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

## MHB-14 — Evidencia de uso y compatibilidad

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

## MHB-15 — Documentación, capturas y release posterior

- **Objetivo observable:** dejar README, CHANGELOG, versión, tag y release posterior coherentes y sustentados.
- **Superficies autorizadas:** README, CHANGELOG, versión/package metadata, capturas, notas de release y documentación relacionada.
- **Dependencias y precondiciones:** MHB-14, MHB-39, MHB-40, MHB-41, MHB-45, MHB-44, MHB-46, MHB-47, MHB-42, MHB-34, MHB-43 y MHB-36 completadas, además de una decisión explícita antes de publicar o etiquetar; preservar el baseline publicado.
- **Congelamiento de alcance:** al pasar MHB-15 a `En progreso` se congela el alcance de la release. Un hallazgo nuevo se registra como ID de la versión siguiente y no bloquea la release, salvo que rompa un gate de MHB-41 (hashes de `dist/`, variables ESP `{{ }}`, `validate-email`), la suite o el build; solo esos casos bloquean y se corrigen dentro del alcance congelado.
- **Pasos técnicos:**
  - Aplicar la skill `release-management` (MHB-40): checklist Go/No-Go con cada dependencia `Completada` y CI verde en `master`.
  - Decidir el número SemVer con el usuario. Propuesta: `v1.3.0`, porque la CLI pública, los scripts de `package.json` y el contrato de salida no cambian y el soporte multi-package-manager es aditivo. Pasar a `v2.0.0` solo si algún ID eliminó o renombró un comando público.
  - Reconciliar narrativa/evidencia, actualizar versión y changelog del alcance real, preparar tag/release solo tras revisión.
  - Incluir en CHANGELOG y notas de release una sección «Contrato de salida para integradores»: resultado de `check:dist-baseline` frente a `v1.2.0` (hashes idénticos o diferencias justificadas por template) y confirmación de que las variables ESP `{{ }}` de cada template se conservan.
- **Criterios de aceptación:** documentación, versión, tag y release posterior coinciden; las capturas son actuales y los límites no se presentan como hechos no probados; la sección de contrato de salida existe y coincide con la salida de `check:dist-baseline`.
- **Validación automática:** lint Markdown, suite, build, `validate-email`, `check:dist-baseline` y comprobación de consistencia de versión.
- **Validación manual:** revisar README, capturas, changelog, SHA/tag y notas antes de publicar.
- **Evidencia requerida:** SHA, tag, URL de release, diff final, checklist de capturas y checklist Go/No-Go firmado por el orquestador.
- **Riesgos y reversión:** publicar una afirmación adelantada; detener antes de acciones externas y revertir documentación local si corresponde.
- **Exclusiones específicas:** no publicar automáticamente ni modificar tags o releases ya publicados.
- **Implementador:** perfil documentación/release, medio.
- **Revisor independiente:** orquestador.
- **Condición de escalamiento:** cualquier publicación, tag, versión o evidencia no sustentada, o un hallazgo que se proponga incluir pese al congelamiento de alcance.

## Evolución y mantenibilidad

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

## Evolución del stack de estilos

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

## Migración gradual y completa a TypeScript

El alcance final comprende todo archivo JavaScript o MJS propio bajo
`scripts/**`, `src/**` y las configuraciones raíz. Se excluyen dependencias,
outputs generados, `dist/**` y material sincronizado de solo lectura. La
convivencia `.js`/`.mjs`/`.ts` restante es transitoria y MHB-34 la elimina. Cambiar extensión no autoriza cambios funcionales,
rediseños ni alteraciones de los contratos CLI, filesystem, email o ESP.

### MHB-37 — Contratos compartidos, constantes tipadas y guards de higiene de tipos

- **Objetivo observable:** eliminar magic strings que cruzan archivos o la frontera server↔client, sustituir `string` genérico por uniones derivadas en APIs internas y dejar guards de lint que impidan la regresión, sin cambio funcional ni de output.
- **Superficies autorizadas:** `scripts/shared/contracts/**` (nuevo), `src/web/**`, `scripts/vite/**`, `scripts/validators/**`, `scripts/cli/**`, tests asociados, `eslint.config.js`, `package.json` (solo scripts), `docs/ai/skills/email-refactor-type-safety/**`, `AGENTS.md` y adaptadores vía `agents:sync`.
- **Dependencias y precondiciones:** satisfechas (`src/web/**` ya en TypeScript). No toca `tsconfig*.json`, `scripts/ai/**` ni configuraciones raíz, que pertenecen a MHB-34.
- **Decisiones vigentes:**
  - Objetos `as const` con tipo derivado; sin `enum` ni `const enum`. Objeto en `UPPER_SNAKE_CASE` y tipo en `PascalCase` (`VIEW_MODE` / `ViewMode`).
  - Los contratos server↔client viven en `scripts/shared/contracts/` como hoja aislada: sin `node:*`, sin imports fuera de la carpeta y excluida del barrel `scripts/shared/index.ts`, que reexporta módulos Node y no debe entrar al bundle del navegador. Allí vive también `Theme`.
  - Un objeto `as const` solo se crea si el conjunto de valores se usa en ≥2 archivos, cruza server↔client o se persiste/compara contra datos externos; en otro caso basta una unión literal local.
  - Convención de organización:

    | Qué                                                                        | Archivo                                  |
    | -------------------------------------------------------------------------- | ---------------------------------------- |
    | Objetos `as const`, literales, regex, números                              | `constants.ts`                           |
    | Interfaces y uniones derivadas (`import type { X } from "./constants.ts"`) | `types.ts` (cero runtime)                |
    | Type guards                                                                | `guards.ts`                              |
    | Builders de rutas                                                          | `contracts/routes/`                      |
    | `enum` / `const enum`                                                      | Prohibido (`erasableSyntaxOnly`, MHB-34) |

    Ubicación:
    - Server↔client: `scripts/shared/contracts/{constants,types,guards,routes}/<dominio>.ts`.
    - Compartido web: `src/web/shared/{constants,types,guards}/` (`storage-keys.ts` no se mueve).
    - Feature: `features/<f>/constants.ts`, `types.ts`, `guards.ts` (respeta ≤8 archivos por carpeta).
    - Uso en un solo archivo: privado, sin `export`.
      Todo lo que otro archivo importa vive en `constants`/`types`/`guards` y se importa desde ahí. Barrels solo como `index.ts` puro sin implementación.

- **Pasos técnicos:**
  1. Re-scan con `rg` de `@typedef`, `any`, literales `/api/`, storage keys, header `X-ESP-Validation`, códigos de error, eventos (`email-source-changed`, `theme-changed`), firmas `mode|theme|state|status|tab|type|severity: string` y uniones inline repetidas; registrar el inventario antes en `STATUS.md`. Todo hallazgo fuera de estas categorías se escala.
  2. Crear `scripts/shared/contracts/` (`api-routes.ts`, `render-error.ts`, `events.ts`, `theme.ts`); server y client importan el archivo concreto, nunca un barrel.
  3. Por feature y en commits separados (shared → Home → Library → Preview → `scripts/`): crear las constantes que cumplan la regla anterior, tipar firmas `string` → unión, añadir type guards en cada lectura externa y mover tipos solo cuando corresponda.
  4. Activar guards en `eslint.config.js` sin dependencias nuevas: `@typescript-eslint/no-explicit-any`, `@typescript-eslint/consistent-type-imports`, `no-warning-comments` con el término `@typedef` en `**/*.ts`, `no-restricted-syntax` para literales `/api/`, header, códigos de error, eventos y claves de `localStorage` fuera de su ubicación, y `no-restricted-imports` para aislar los contratos y prohibir el barrel de `scripts/shared` en `src/web/**`. Cada guard lleva un fixture de test que demuestra que falla.
  5. Documentar las convenciones en `email-refactor-type-safety` y una línea en Invariantes de `AGENTS.md`; ejecutar `agents:sync` y `agents:check`.
- **Criterios de aceptación:**
  - Ningún literal `/api/`, nombre de header, código de error o nombre de evento compartido aparece fuera de `scripts/shared/contracts/` (salvo tests).
  - `scripts/shared/contracts/**` no importa `node:*` ni rutas externas a la carpeta; `src/web/**` no importa `scripts/shared/index.ts`.
  - Ninguna lectura de `localStorage`, `URLSearchParams`, `dataset` o JSON de red se convierte a unión con `as`; se usa type guard con fallback.
  - Valores de storage keys y rutas idénticos a los actuales (sin reset de preferencias ni cambio de API).
  - Cero `any`, cero `@typedef` en `.ts` y `consistent-type-imports` sin errores.
  - Sin reexports en archivos de implementación; barrels únicamente como `index.ts` puro.
  - Sin alias de símbolos ni tipos/constantes duplicados.
  - Sin `Union | string` que colapse a `string`.
  - Sin constantes ni tipos exportados sin consumidor real.
  - Sin `enum` ni `const enum`.
- **Validación automática:** lint, typecheck, test, formato, build, `validate-email`, `a11y-check`, hashes de `dist/*.html` idénticos al baseline y `git diff --check`.
- **Validación manual:** Preview (render/source, viewport desktop/mobile/custom con persistencia tras recarga, dark/light, copy/download, error de render simulado y HMR) y Library (selección persistida y filtros por tipo).
- **Evidencia requerida:** inventario antes/después del re-scan, lista de constantes creadas con sus consumidores, salida de los fixtures de guards y hashes.
- **Riesgos y reversión:** un typo al mover un literal rompe server o client en silencio → test de contrato que importe desde ambos lados; casts que oculten datos inválidos de storage → type guards obligatorios. Un commit por feature, revertible por separado.
- **Exclusiones específicas:** no cambiar valores persistidos ni endpoints; no crear constantes para literales de un solo archivo; no exportar tipos preventivos; no tocar templates email, Maizzle ni variables ESP; no añadir dependencias; no modificar `tsconfig*.json`.
- **Análisis de mantenibilidad:** los contratos son archivos pequeños de responsabilidad única; la regla de ≥2 consumidores evita abstracciones preventivas; se respetan ≤250 líneas por archivo y ≤8 archivos por directorio.
- **Implementador:** perfil TypeScript transversal, medio.
- **Revisor independiente:** revisor técnico distinto, con foco en la frontera server↔client.
- **Condición de escalamiento:** el re-scan encuentra más del doble de candidatos que el catálogo inicial, se requiere cambiar un valor persistido o un endpoint, o un guard exige dependencia nueva.

#### Re-scan inicial (paso 1)

Ejecutar desde la raíz; el resultado es el inventario "antes" y sustituye
cualquier cifra previa:

```bash
rg -n '@typedef' -g '*.ts' src scripts
rg -n ':\s*any\b|\bas any\b|<any>|Array<any>' -g '*.ts' src scripts
rg -n "[\"'\`]/api/" -g '*.ts' -g '!*.test.ts' src scripts
rg -n 'storage\.(get|set|remove)Item|localStorage|_KEY\s*=' -g '*.ts' -g '!storage-keys.ts' src/web
rg -n 'X-ESP-Validation|RENDER_FAILED|email-source-changed|theme-changed' -g '*.ts' src scripts
rg -n '\b(mode|theme|state|status|tab|type|severity)\??:\s*string\b' -g '*.ts' src scripts
rg -n '"(dark|light)"\s*\|\s*"(dark|light)"' -g '*.ts' src scripts
```

La opcionalidad excesiva (tipos exportados con mayoría de props `?:`) se revisa
a mano sobre los tipos que se toquen; no se automatiza.

#### Catálogo inicial de candidatos

Veredicto previsto según la regla de creación de `as const`; el re-scan lo
confirma o corrige:

| Candidato                                              | Ubicación prevista                                              | Veredicto previsto                                 |
| ------------------------------------------------------ | --------------------------------------------------------------- | -------------------------------------------------- |
| Rutas `/api/*`, header `X-ESP-Validation`              | `scripts/shared/contracts/api-routes.ts`                        | Contrato                                           |
| `RENDER_FAILED`, mensaje y causas seguras de render    | `scripts/shared/contracts/render-error.ts`                      | Contrato                                           |
| `email-source-changed`, `theme-changed`                | `scripts/shared/contracts/events.ts`                            | Contrato                                           |
| `THEME` (`light`, `dark`)                              | `scripts/shared/contracts/theme.ts`                             | Contrato (web + `check-a11y.ts`)                   |
| `VIEW_MODE`, `VIEWPORT_MODE`                           | `preview/modules/controls/`                                     | `as const` (persistidos)                           |
| `COMPONENT_TYPE`, `SEVERITY`                           | `library/modules/`, `scripts/validators/`                       | `as const` (múltiples consumidores)                |
| `MODAL_STATE`, `EXPORT_MODE`, `PREVIEW_SYNC_STATUS`    | `preview/modules/copy-html/`, `preview/modules/runtime/`        | `as const` solo si se confirman ≥2 archivos        |
| `MobileTab`, `FormPropType`, `CreationMode`, `Runtime` | Módulo propietario                                              | Unión local salvo que aparezcan ≥2 archivos        |
| Plantilla de nombre `/^[a-z0-9-]+$/`                   | Reutilizar `scripts/shared/io/path-safety.ts` vía contrato hoja | Mover la regex a contrato si el cliente la importa |
| Clases de toggle duplicadas y `jse-theme-*`            | `src/web/shared/utils/` o módulo editor                         | Extraer solo si siguen duplicadas                  |

Firmas a tipar `string` → unión: `ViewModeController`, `ViewportController`,
callbacks de `theme-manager`, `getTheme` de `render-api` y `activeTab` de
`mobile-tabs`.

#### Idioma y reglas complementarias

```ts
export const VIEW_MODE = { RENDER: "render", SOURCE: "source" } as const;
export type ViewMode = (typeof VIEW_MODE)[keyof typeof VIEW_MODE];

const VIEW_MODES: readonly string[] = Object.values(VIEW_MODE);
export function isViewMode(value: unknown): value is ViewMode {
  return typeof value === "string" && VIEW_MODES.includes(value);
}
```

- El type guard solo se escribe cuando existe lectura externa real
  (storage, URL, `dataset` o red).
- **Opcionalidad:** al tocar un tipo con mayoría de `?:`, hacer requeridas las
  props que siempre se pasan; usar `Partial<T>` explícito para inputs con
  defaults; separar en unión discriminada si mezcla casos; documentar el `?:`
  legítimo.
- **`any`:** `unknown` + narrowing para datos externos; tipo concreto para
  eventos y callbacks; un `any` justificado solo con
  `eslint-disable-next-line` y descripción `-- motivo`.

#### Guards y descartes

| Guard                                  | Regla ESLint                                                                                                                                                                   |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Cero `any`                             | `@typescript-eslint/no-explicit-any: "error"`                                                                                                                                  |
| `import type` consistente              | `@typescript-eslint/consistent-type-imports: "error"`                                                                                                                          |
| Cero `@typedef` en `.ts`               | `no-warning-comments: ["error", { terms: ["@typedef"], location: "anywhere" }]` en `**/*.ts`                                                                                   |
| Contratos solo en su carpeta           | `no-restricted-syntax` con `Literal[value=/^\/api\//]`, `Literal[value='X-ESP-Validation']` y equivalentes; override que lo desactiva en `scripts/shared/contracts/**` y tests |
| Storage keys solo en `storage-keys.ts` | `no-restricted-syntax` sobre literales pasados a `getItem`/`setItem`/`removeItem` en `src/web/**`                                                                              |
| Contratos aislados y sin barrel en web | `no-restricted-imports`: `node:*` y `../*` en `scripts/shared/contracts/**`; `scripts/shared/index.ts` en `src/web/**`                                                         |

Descartados como guard bloqueante por ruido o falsos positivos: ratio de props
opcionales, número de tipos por archivo, strings repetidos en ≥2 archivos y
"`string` donde exista `as const`" (no lo detecta `tsc`; queda como criterio de
revisión).

### MHB-39 — Convenciones de nombres de archivo y linting con tipos

- **Objetivo observable:** estandarizar convenciones de nombres de archivos y carpetas (`kebab-case`, roles reservados, prohibición de nombres genéricos), verificar estructura mediante test de árbol y plugin de ESLint, e incorporar linting con tipos (`no-floating-promises`, `no-misused-promises`, `await-thenable`, `no-redundant-type-constituents`, `require-await`, `return-await`) resolviendo todos los hallazgos en middlewares Vite, listeners web y scripts.
- **Superficies autorizadas:** `scripts/**`, `src/web/**`, `eslint.config.js`, `package.json`, `docs/ai/AGENTS.md`, `docs/ai/skills/**`, `docs/implementation/**`.
- **Dependencias y precondiciones:** MHB-37 completada. Dependencia de desarrollo autorizada: `eslint-plugin-check-file`. Sin modificaciones a `tsconfig*.json`.
- **Pasos técnicos:**
  1. Renombrar con `git mv` archivos según la convención establecida (plugins Vite, entrypoints `main.ts`, módulos `esp/`, scripts de `build/`, fixtures `*.fixtures.ts`, validadores temáticos y submódulos `copy-html/`).
  2. Actualizar referencias e imports en todo el proyecto (`scripts`, `src`, `vite.config.ts`, `package.json`, `docs`).
  3. Instalar `eslint-plugin-check-file` y configurar reglas de nombres (`check-file/filename-naming-convention`, `check-file/folder-naming-convention`, `check-file/filename-blocklist`).
  4. Implementar `scripts/validators/lint-guards/file-tree.test.ts` (≤ 400 líneas) para validar reglas estructurales del árbol.
  5. Activar linting con tipos en `eslint.config.js` (`parserOptions.project: ["./tsconfig.strict.json"]`) con reglas estrictas de promesas y tipos redundantes; retirar selector AST casero `UNION_WITH_STRING_SELECTOR`.
  6. Corregir hallazgos de promesas: envoltorio de middleware asíncrono en `scripts/vite/api/http.ts`, `.catch` explícito o `void` comentado en frontend, y captura de rechazos en scripts.
  7. Crear skill `docs/ai/skills/email-code-conventions/`, actualizar `docs/ai/AGENTS.md` y sincronizar adaptadores con `bun run agents:sync` y `bun run agents:check`.
- **Criterios de aceptación:**
  - Todos los archivos siguen `kebab-case` sin redundancia de carpeta en el nombre ni nombres genéricos fuera de excepciones reservadas.
  - Barrels `index.ts` puros; `main.ts` como entrypoints.
  - Cero promesas flotantes (`no-floating-promises`), cero promesas mal usadas (`no-misused-promises`) y cero `await` redundantes (`await-thenable`).
  - Suite de pruebas de árbol y guards pasando al 100%.
  - Límites de archivo (≤ 250 líneas) y carpeta (≤ 8 archivos) respetados estrictamente.
- **Validación automática:** `bun install --frozen-lockfile`, `bun run lint`, `bun run typecheck`, `bun run test`, `bun run format:check`, `bun run build`, `bun run validate-email`, `bun run agents:check`, `git diff --check`.
- **Validación manual:** verificación de build limpio y respuestas de endpoints Vite.
- **Evidencia requerida:** tabla de renombres aplicados, conteo de hallazgos antes/después por regla con tipos, tiempo de ejecución de `lint:js` y salida de controles.
- **Riesgos y reversión:** un import no actualizado tras `git mv` rompe runtime o tests → mitigado por `typecheck` y suite completa de tests tras cada grupo. Modificaciones aislables por commit.
- **Exclusiones específicas:** no cambiar nombres de scripts públicos en `package.json`; no alterar `dist/*.html`; no modificar `tsconfig*.json`; no añadir lógica funcional adicional.
- **Implementador:** perfil TypeScript transversal / tooling, medio.
- **Revisor independiente:** revisor técnico de arquitectura y tooling.
- **Condición de escalamiento:** un renombre altera el output de build de templates, requiere cambiar scripts públicos de `package.json` o linting con tipos exige cambios en `tsconfig*.json`.

### Resguardo previo a MHB-34 (MHB-40, MHB-41, MHB-45, MHB-44, MHB-46, MHB-47 y MHB-42)

Registrado el 2026-09-23 a partir del análisis de riesgos hacia MHB-15. Causas
observadas: criterios de aceptación en prosa que se endurecieron después de
implementar, exclusiones de ESLint que ocultaron 23 infracciones en MHB-37,
revisión apoyada en lo declarado en `STATUS.md`, skills que contradicen el plan,
contratos pendientes que citan archivos ya borrados o renombrados, ausencia de un
gate automático sobre `dist/*.html` y riesgo de bloqueo en MHB-34 por loaders de
configuración de terceros. El análisis libre posterior añadió: `master` sin
protección con auto-merge de Dependabot, HTML exportado con colores, unidades e
imágenes no soportados por clientes reales, escrituras cross-site posibles en la
API local y ausencia de un contrato de variables consumible por una integración
ESP. Estos IDs se ejecutan en el orden indicado, uno por rama, después de MHB-39;
los IDs se numeran por fecha de registro, no por orden de ejecución.

### MHB-40 — Gobernanza de agentes y revisión independiente

- **Objetivo observable:** que `docs/ai/AGENTS.md` y las skills no contradigan este plan, que los patrones que causaron reaperturas queden prohibidos por regla y que el revisor independiente siga un procedimiento ejecutable en lugar de leer lo declarado por el implementador.
- **Superficies autorizadas:** `docs/ai/AGENTS.md`, `docs/ai/skills/**` (incluidas dos skills nuevas con su `agents/openai.yaml`), adaptadores regenerados con `bun run agents:sync`, `CHANGELOG.md` (solo `[Unreleased]`), `docs/implementation/STATUS.md` y, en este plan, solo referencias a rutas o skills.
- **Dependencias y precondiciones:** MHB-39 completada, porque comparte `docs/ai/AGENTS.md` y `docs/ai/skills/**` y crea `email-code-conventions`.
- **Pasos técnicos:**
  1. **Re-scan de contradicciones tras MHB-39.** Conocidas al 2026-09-23 (revalidar, pueden haberse corregido):
     - `email-refactor-type-safety`: «Conservar JavaScript ESM con JSDoc», «No migrar globalmente a TypeScript» y el uso de `allowJs`/`checkJs`, contrarios a MHB-34.
     - `email-quality-gates`: recomienda «typedefs» y «explicar cualquier `any`», prohibidos en `.ts`.
     - `AGENTS.md`: cita `IMPLEMENTATION-PLAN.md` (inexistente; es `PLAN.md`) y `storage-keys.js` (hoy `.ts`).
     - Las referencias `.js` de las invariantes de este plan quedan para MHB-34, que ya las tiene asignadas.
  2. **Reglas nuevas** en `AGENTS.md` y en las skills que correspondan (`email-quality-gates`, `task-verification`, `task-status-management`):
     - Prohibido añadir `ignores` o exclusiones de ESLint, `eslint-disable`, `@ts-ignore`/`@ts-expect-error`, exclusiones de `tsconfig*.json` o tests `skip`/`todo` sin registrarlos como desviación aprobada en `STATUS.md`.
     - Todo archivo fuente nuevo es `.ts`, salvo la allowlist que fije MHB-42.
     - Cada criterio de aceptación de un ID nuevo o ajustado se asocia a un comando o test que falla cuando no se cumple; lo que no pueda automatizarse se declara como revisión manual.
     - Un ID que borra o renombra archivos actualiza, en el mismo ID, las rutas citadas por los contratos pendientes de este plan.
     - La comparación de `dist/*.html` contra el baseline es un paso obligatorio de verificación (manual hasta que MHB-41 la automatice).
     - Cada ID con efecto observable (comandos, dependencias, output, UI, CI) añade su entrada en `CHANGELOG.md` bajo `[Unreleased]` antes de pasar a `En revisión`; al 2026-09-23 esa sección está vacía pese a MHB-37 y MHB-39, que se registran de forma retroactiva en este ID.
  3. **Skill `task-review`** (revisor independiente):
     - Checkout limpio de la rama y re-ejecución de los gates del ID; lo declarado en `STATUS.md` no cuenta como evidencia.
     - Sobre `git diff master...HEAD`: buscar exclusiones o supresiones nuevas (incluidas excepciones añadidas a `scripts/validators/lint-guards/file-tree.test.ts`) y archivos `.js`/`.mjs` nuevos. Los límites de líneas y de archivos por carpeta ya los verifica ese test desde MHB-39.
     - Hashes de `dist/*.html` y variables ESP frente al baseline.
     - Rutas citadas por contratos pendientes que ya no existen.
     - Cada criterio de aceptación contrastado con su comando.
     - Veredicto `Aprobado`/`Rechazado` con hallazgos accionables.
  4. **Skill `release-management`:** congelamiento de alcance, checklist Go/No-Go, decisión SemVer, consistencia entre `package.json`, CHANGELOG, tag y release, y prohibición de publicar sin aprobación explícita del orquestador.
  5. Registrar ambas skills en la tabla de skills obligatorias de `AGENTS.md` y ejecutar `bun run agents:sync` y `bun run agents:check`.
- **Criterios de aceptación:**
  - `rg -n "Conservar JavaScript ESM|No migrar globalmente|typedefs|IMPLEMENTATION-PLAN|storage-keys\.js" docs/ai` no devuelve resultados.
  - Las reglas del paso 2 aparecen en `AGENTS.md` y en la skill que las aplica.
  - `task-review` y `release-management` existen con `SKILL.md` y `agents/openai.yaml`, figuran en la tabla de `AGENTS.md` y están sincronizadas en todos los targets.
  - El revisor aplica `task-review` en modo de prueba sobre el diff ya mergeado de MHB-39 y adjunta el resultado.
- **Validación automática:** `bun run lint:md`, `bun run format:check`, `bun run agents:check` y `git diff --check`.
- **Validación manual:** lectura cruzada de cada skill modificada contra este plan.
- **Evidencia requerida:** tabla de contradicciones encontradas y corregidas, reglas añadidas con su ubicación y salida del ensayo de `task-review`.
- **Riesgos y reversión:** una regla nueva contradice un contrato vigente o bloquea trabajo legítimo; cada regla se añade en un commit propio y se revierte por separado.
- **Exclusiones específicas:** no cambiar código, `package.json`, CI ni `tsconfig*.json`; no modificar contratos de otros IDs más allá de rutas; no repetir las convenciones de nombres de `email-code-conventions`.
- **Análisis de mantenibilidad:** una skill por responsabilidad; `task-review` y `task-verification` no duplican pasos (verificación del implementador frente a revisión independiente); cada `SKILL.md` se mantiene breve y remite al plan en lugar de copiarlo.
- **Implementador:** perfil gobernanza/documentación, medio.
- **Revisor independiente:** orquestador.
- **Condición de escalamiento:** el preflight de `agents:sync` detecta un conflicto, o una regla exige cambiar el contrato de un ID en curso.

### MHB-41 — Gate del contrato de salida y validadores de email en CI

- **Objetivo observable:** que el CI bloquee cualquier cambio no intencional de `dist/*.html` o de sus variables ESP `{{ }}` y ejecute los validadores de email, protegiendo a los integradores que consumen el HTML exportado (por ejemplo, vía API de SendGrid).
- **Superficies autorizadas:** módulo nuevo `scripts/validators/dist-baseline/` (script, tests, fixtures y archivo de baseline versionado), `package.json` (scripts nuevos `check:dist-baseline` y `update:dist-baseline`), `.github/workflows/ci.yml` (no `audit.yml`), las skills `task-verification` y `task-review` (para referenciar el comando) y `docs/implementation/STATUS.md`.
- **Dependencias y precondiciones:** MHB-40 completada; `master` limpio con `dist/*.html` generado por `bun run build`.
- **Pasos técnicos:**
  1. `check:dist-baseline` lee `dist/*.html` y, por template, calcula el SHA-256 y extrae el conjunto ordenado de expresiones ESP `{{ … }}`. Compara con el baseline y falla con código distinto de cero listando templates añadidos, eliminados, con hash distinto y con variables ESP perdidas o nuevas. Reutiliza helpers de `scripts/shared/` antes de crear otros.
  2. `update:dist-baseline` regenera el baseline de forma explícita. Solo un ID que autorice cambiar `dist/` (hoy MHB-44 y MHB-38) puede ejecutarlo, y debe justificarlo por template en `STATUS.md`.
  3. En `ci.yml`, después de `bun run build`:
     - `git diff --exit-code -- dist/`, para exigir que el `dist/` versionado coincida con el build.
     - `bun run validate-email`, `bun run check:dist-baseline` y `bun run check-size`.
     - `bun run check:inventory` en modo informe; MHB-34 lo endurece a `--require-zero`.
     - `lint:contrast` y `a11y-check` ya corren en `.github/workflows/audit.yml` sobre `master` y los PR; no se duplican, pero sus nombres de job quedan documentados para que MHB-45 los marque como checks requeridos.
  4. Tests del script con fixtures: coincidencia, hash distinto, variable ESP perdida, template añadido y eliminado.
- **Criterios de aceptación:**
  - El baseline inicial coincide con el `dist/` de `master` y la CI de la rama queda verde.
  - Un fixture con una variable `{{ }}` eliminada y otro con un byte distinto hacen fallar `check:dist-baseline` con mensaje accionable.
  - `ci.yml` ejecuta todos los pasos del punto 3 y un `dist/` desincronizado hace fallar el pipeline.
  - Archivos dentro de los límites (≤ 250 líneas no-test, ≤ 400 tests, ≤ 8 archivos por carpeta).
- **Validación automática:** `bun install --frozen-lockfile`, lint, typecheck, test, `format:check`, build, `validate-email`, `check:dist-baseline` y `git diff --check`.
- **Validación manual:** una ejecución de CI en la rama con un commit de prueba que altera `dist/` (revertido después) para comprobar el rojo.
- **Evidencia requerida:** URL de la ejecución de CI verde, URL de la ejecución roja provocada, salida de los fixtures y tiempo añadido al pipeline.
- **Riesgos y reversión:** un build no determinista entre macOS local y Linux de CI produce hashes distintos; en ese caso se escala antes de normalizar. Cada paso de CI va en un commit propio y es revertible.
- **Exclusiones específicas:** no cambiar templates, `dist/*.html` ni reglas de los validadores; no activar `--require-zero`; no cambiar runtime ni package manager del CI (MHB-36); no tocar permisos del workflow.
- **Análisis de mantenibilidad:** un módulo con responsabilidad única (comparar la salida con el baseline); la extracción de variables ESP reutiliza la lógica de la regla de variables ESP existente si es exportable, en lugar de duplicarla.
- **Implementador:** perfil tooling/CI, medio.
- **Revisor independiente:** revisor técnico de build y email.
- **Condición de escalamiento:** hashes no deterministas entre plataformas, un validador que no puede ejecutarse en CI o un cambio de permisos del workflow.

### MHB-45 — Protección de `master` y política de Dependabot

- **Objetivo observable:** que ningún cambio, incluidas las actualizaciones automáticas de dependencias, llegue a `master` sin pasar los checks de CI y auditoría, y que las dependencias del pipeline de email nunca se fusionen solas.
- **Hallazgo (2026-09-23):** `master` no tiene protección de rama (`gh api …/branches/master/protection` → 404) y `.github/workflows/dependabot-automerge.yml` aprueba y fusiona con `--auto` toda actualización minor/patch. Sin checks requeridos, un bump de `@maizzle/framework`, `tailwindcss` o `juice` que altere `dist/*.html` puede fusionarse sin revisión; ya hay 4 merges de Dependabot en `master`. Además, `.github/dependabot.yml` solo cubre el ecosistema `bun`, no `github-actions`.
- **Superficies autorizadas:** `.github/workflows/dependabot-automerge.yml`, `.github/dependabot.yml`, configuración de protección de `master` en GitHub (acción del usuario o con su aprobación explícita) y `docs/implementation/STATUS.md`.
- **Dependencias y precondiciones:** MHB-41 completada (los checks a exigir existen y tienen nombre estable).
- **Pasos técnicos:**
  1. Proponer al usuario la protección de `master`: PR obligatorio, checks requeridos (jobs de `ci.yml` y `audit.yml`), rama actualizada antes de fusionar y sin force-push. La aplica el usuario o se aplica con su aprobación explícita.
  2. Restringir el auto-merge: excluir `@maizzle/*`, `maizzle`, `tailwindcss`, `postcss`, `autoprefixer`, `juice` y `handlebars` (siempre revisión manual) y fusionar el resto solo con checks verdes.
  3. Añadir el ecosistema `github-actions` a `dependabot.yml` y agrupar las actualizaciones de desarrollo para reducir ruido.
- **Criterios de aceptación:**
  - `gh api repos/Frank-0511/vite-mhb-email/branches/master/protection` devuelve los checks requeridos.
  - El workflow de auto-merge contiene la lista de exclusión y no fusiona con checks en rojo.
  - `dependabot.yml` incluye `github-actions`.
- **Validación automática:** `bun run lint` (YAML/JSON aplicables), `bun run format:check` y `git diff --check`.
- **Validación manual:** comprobar en GitHub que un PR con checks en rojo no puede fusionarse.
- **Evidencia requerida:** salida de la API de protección, diff de los workflows y captura o enlace del PR bloqueado.
- **Riesgos y reversión:** bloquear el flujo propio si un check es inestable; la protección se ajusta desde GitHub y los workflows se revierten por commit.
- **Exclusiones específicas:** no cambiar permisos de `GITHUB_TOKEN` más allá de los existentes; no cambiar runtime del CI (MHB-36).
- **Análisis de mantenibilidad:** no aplica a código; la lista de exclusión vive en un solo lugar del workflow.
- **Implementador:** perfil CI/seguridad, medio.
- **Revisor independiente:** orquestador; la configuración de GitHub la confirma el usuario.
- **Condición de escalamiento:** cualquier cambio de configuración del repositorio en GitHub (siempre requiere aprobación explícita del usuario).

### MHB-44 — Compatibilidad del HTML exportado con clientes reales

- **Objetivo observable:** que `dist/*.html` use solo CSS e imágenes que Gmail, Outlook de escritorio y Apple Mail renderizan, y que los validadores lo impidan en adelante. Es el requisito para enviar estos templates en producción vía SendGrid.
- **Hallazgos (2026-09-23), no detectados por los validadores actuales:**
  - Colores con sintaxis CSS Color 4 separada por espacios (`rgb(255 255 255 / 1)`): unas 400 apariciones en los seis templates. Outlook de escritorio (motor Word) y otros clientes solo admiten HEX o `rgb(r, g, b)`, por lo que se pierden fondos y colores de texto.
  - Unidades `rem` en estilos inline (hasta 17 por template); varios clientes no las soportan de forma fiable.
  - Imágenes SVG enlazadas desde `https://api.iconify.design/…`: Gmail y Outlook no muestran SVG, y el correo depende en producción de un servicio de terceros sin SLA.
  - Enlaces de ejemplo (`href="https://example.com"`, `href="#"`) y marca de ejemplo en templates de producto.
  - Causa probable: `tailwind.email.config.js` no usa el preset para email (px en lugar de rem y colores sin variables de opacidad), práctica recomendada por Maizzle para Tailwind v3.
- **Superficies autorizadas:** `tailwind.email.config.js`, `maizzle.config.*`, `src/emails/**` (iconos e imágenes), reglas nuevas en `scripts/validators/email-rules/rules/**` con sus tests, `dist/*.html` regenerado, el baseline de MHB-41 (actualización autorizada), `package.json`/`bun.lock` si se adopta un preset y `docs/implementation/STATUS.md`.
- **Dependencias y precondiciones:** MHB-41 completada (el cambio de `dist/` queda medido y justificado por template); MHB-45 recomendada.
- **Pasos técnicos:**
  1. **Reglas primero:** añadir reglas de `validate-email` (ERROR) para colores no HEX/`rgb(r, g, b)` en `style=""`, unidades `rem`/`em` en estilos inline, `<img>` con `.svg` y hosts de imagen fuera de una allowlist configurable; y WARNING para `href="#"` y dominios de ejemplo. Deben fallar sobre el `dist/` actual.
  2. **Corrección de causa:** configurar el pipeline de email para emitir px y colores HEX (preset de email compatible con Tailwind v3 o `corePlugins` de opacidad desactivados más conversión de unidades), sin cambiar el diseño.
  3. **Iconos:** sustituir los SVG remotos por PNG (@2x, con `width`/`height`) servidos desde un host configurable (`[[ page.assetsBaseUrl ]]` o equivalente en build), sin romper el modo oscuro existente.
  4. Regenerar `dist/`, ejecutar `update:dist-baseline` y justificar la diferencia de cada template en `STATUS.md`.
  5. Coordinar con MHB-38: la regla `modern-css-inline` prevista allí reutiliza estas reglas en lugar de duplicarlas.
- **Criterios de aceptación:**
  - `rg -c "rgb\([0-9]+ [0-9]+ [0-9]+ /|[0-9.]+rem|\.svg" dist/*.html` devuelve 0 en todos los templates.
  - Las reglas nuevas fallan sobre fixtures con cada patrón y pasan sobre el `dist/` regenerado.
  - Las variables ESP `{{ }}` de cada template son idénticas antes y después (`check:dist-baseline` solo informa diferencias de hash justificadas).
  - Sin regresión visual en el preview (modo claro y oscuro) ni de peso por encima del umbral de `check-size`.
- **Validación automática:** `bun install --frozen-lockfile`, lint, typecheck, test, `format:check`, build, `validate-email`, `check-size`, `check:dist-baseline` (tras actualizar el baseline) y `git diff --check`.
- **Validación manual:** comparar en el preview cada template antes y después (claro/oscuro, desktop/móvil); el envío a clientes reales queda en MHB-14.
- **Evidencia requerida:** conteo por patrón antes/después, diff justificado por template, salida de las reglas nuevas y capturas del preview.
- **Riesgos y reversión:** cambio visual inadvertido al convertir colores con opacidad o rem a px; hosting de imágenes sin decidir. Un commit por paso; revertir restaura el `dist/` y el baseline anteriores.
- **Exclusiones específicas:** no rediseñar templates, no cambiar variables ESP ni la CLI pública, no migrar a Tailwind v4 ni Maizzle 6 (MHB-38), no subir imágenes a un servicio externo sin aprobación del usuario.
- **Análisis de mantenibilidad:** una regla por archivo bajo la categoría existente (`structure/` o `content/`), respetando ≤ 8 archivos por carpeta; la allowlist de hosts vive en constantes compartidas.
- **Implementador:** perfil email/compatibilidad, alto.
- **Revisor independiente:** revisor de build y email.
- **Condición de escalamiento:** el preset elegido cambia el diseño visible, no hay decisión sobre dónde alojar las imágenes, o el cambio exige tocar variables ESP.

### MHB-46 — Endurecimiento de la API local del servidor Vite

- **Objetivo observable:** que ninguna web abierta en el navegador del usuario pueda escribir o invalidar datos de la herramienta mediante peticiones cross-site al servidor local.
- **Hallazgo (2026-09-23):** los endpoints de escritura (`POST /api/data`, `/api/cache/invalidate`, `/api/cache/clean`, `/api/copy-html`, `/api/render`) aceptan el cuerpo sin exigir `Content-Type: application/json` ni comprobar el origen. Un `POST` con `text/plain` es una petición simple sin preflight CORS, así que cualquier sitio visitado mientras corre `bun run dev` podría sobrescribir un `data.json` o vaciar la caché. La validación de nombres y rutas (`isValidTemplateName`, `isPathInside`) ya impide el path traversal. Severidad baja: herramienta local, sin secretos expuestos por estos endpoints.
- **Superficies autorizadas:** `scripts/vite/api/**` (helper común en `http.ts`), sus tests y `docs/implementation/STATUS.md`.
- **Dependencias y precondiciones:** MHB-44 completada (evita solapar con cambios de render); independiente del resto.
- **Pasos técnicos:**
  1. Añadir en `scripts/vite/api/http.ts` una guarda única para métodos de escritura: exigir `Content-Type: application/json` y rechazar `Sec-Fetch-Site: cross-site` u `Origin` distinto del servidor, con respuesta 403 accionable.
  2. Aplicarla a todos los endpoints de escritura y cubrir cada rechazo con tests.
  3. Confirmar que el frontend ya usa `postJSON`/`fetchJSON` con el encabezado correcto.
- **Criterios de aceptación:** un `POST` con `text/plain` o `Origin` externo recibe 403 en cada endpoint de escritura (tests); el dashboard funciona sin cambios.
- **Validación automática:** lint, typecheck, test, `format:check` y `git diff --check`.
- **Validación manual:** `bun run dev` y recorrido de guardar datos, copiar HTML e invalidar caché.
- **Evidencia requerida:** tabla de endpoints protegidos y salida de los tests de rechazo.
- **Riesgos y reversión:** bloquear una llamada legítima del propio dashboard; revertible por commit.
- **Exclusiones específicas:** no añadir autenticación ni dependencias; no cambiar rutas ni contratos de la API.
- **Análisis de mantenibilidad:** una sola guarda reutilizada por todos los endpoints (≥ 2 consumidores), sin duplicar comprobaciones.
- **Implementador:** perfil servidor Vite/seguridad, medio.
- **Revisor independiente:** revisor técnico.
- **Condición de escalamiento:** la guarda rompe un flujo del dashboard que exige cambiar un contrato de API.

### MHB-47 — Contrato de integración ESP (manifiesto de variables y perfil SendGrid)

- **Objetivo observable:** que un sistema externo (por ejemplo, la integración por API con SendGrid) sepa, sin leer el HTML, qué variables requiere cada template, y que `dist/` solo contenga sintaxis Handlebars que SendGrid Dynamic Templates soporta.
- **Hallazgo (2026-09-23):** el preview registra helpers propios (`eq`, `ne`, `gt`, `lt`, `gte`, `lte`, `and`, `or`, `not`) que SendGrid no ofrece (usa `equals`, `notEquals`, `greaterThan`, `lessThan`, `and`, `or`, `formatDate`, `insert`, `length`). Hoy `dist/` solo contiene variables simples `{{ var }}`, pero nada impide que un template futuro exporte un helper que SendGrid no conoce y que fallaría en silencio. Tampoco existe un listado de variables por template consumible por otra aplicación, aunque `scripts/esp/` ya las extrae.
- **Superficies autorizadas:** `scripts/esp/**`, un comando nuevo en `package.json` (`esp:manifest` o integrado en `build`), una regla nueva de `validate-email` con su test, el manifiesto generado (`dist/esp-manifest.json` o ruta acordada), `check:dist-baseline` (para contemplar el manifiesto), `README.md` (sección de integración) y `docs/implementation/STATUS.md`.
- **Dependencias y precondiciones:** MHB-44 completada (el HTML ya es apto para producción).
- **Pasos técnicos:**
  1. Generar en el build un manifiesto por template: nombre, variables requeridas, variables intencionales del frontmatter y un ejemplo de datos tomado de `data.json` sin datos personales.
  2. Regla de `validate-email` (ERROR): en `dist/` solo se admiten variables, bloques `#if`/`#unless`/`#each` y los helpers de una allowlist de perfil ESP (inicialmente SendGrid).
  3. Documentar en `README.md` cómo consumir `dist/<template>.html` y el manifiesto desde una integración por API, sin incluir código ni credenciales de SendGrid.
- **Criterios de aceptación:**
  - El manifiesto existe para los seis templates y sus variables coinciden con las que extrae `check:dist-baseline`.
  - Un fixture con `{{#if (eq a b)}}` en `dist/` hace fallar `validate-email`.
  - `dist/*.html` no cambia (`check:dist-baseline` verde para el HTML).
- **Validación automática:** lint, typecheck, test, `format:check`, build, `validate-email`, `check:dist-baseline` y `git diff --check`.
- **Validación manual:** el usuario consume el manifiesto desde su integración con SendGrid (fuera de este repositorio) y confirma que le sirve.
- **Evidencia requerida:** manifiesto generado, salida de la regla sobre fixtures y confirmación del usuario.
- **Riesgos y reversión:** acoplar la herramienta a un solo ESP; el perfil se modela como allowlist configurable con SendGrid como primer perfil. Revertible por commit.
- **Exclusiones específicas:** no implementar llamadas a la API de SendGrid ni guardar credenciales; no cambiar el HTML exportado ni las variables existentes.
- **Análisis de mantenibilidad:** reutiliza `scripts/esp/extractor.ts` y `frontmatter.ts`; el manifiesto es un módulo de responsabilidad única.
- **Implementador:** perfil email/ESP, medio.
- **Revisor independiente:** revisor de email y el usuario como consumidor.
- **Condición de escalamiento:** la regla detecta un helper no soportado en un template existente, o el formato del manifiesto exige una decisión del consumidor.

### MHB-42 — Spike de loaders de configuración y decisión de excepciones JS

- **Objetivo observable:** saber antes de MHB-34 qué archivos `.js`/`.mjs` pueden convertirse a `.ts` con el stack vigente y dejar por escrito una allowlist cerrada (posiblemente vacía), para que MHB-34 no se bloquee a mitad de ejecución.
- **Superficies autorizadas:** `docs/superpowers/mhb-42/` (temporal, para pruebas desechables), `docs/implementation/PLAN.md` (contratos de MHB-34 y MHB-36) y `docs/implementation/STATUS.md`. Las pruebas de conversión se hacen en una rama desechable que no se mergea.
- **Dependencias y precondiciones:** MHB-47 completada (último ID del resguardo) y MHB-41 vigente, porque su gate demuestra si una conversión altera `dist/`.
- **Pasos técnicos:**
  1. Inventariar los `.js`/`.mjs` propios: 22 al 2026-09-23, entre ellos `eslint.config.js`, `maizzle.config.js`, `postcss.config.js`, `tailwind.config.js`, `tailwind.email.config.js`, `scripts/ai/**` y `scripts/validators/lint-guards/selectors.js` (añadido en MHB-37). Clasificarlos en «propio convertible» o «cargado por herramienta de terceros».
  2. Para cada config de terceros, probar la variante `.ts` con el comando real que la consume (`bun run build`, `bun run dev`, `bun run lint`, CSS del dashboard) bajo Bun y bajo Node 24, y confirmar `check:dist-baseline` verde.
  3. Dimensionar MHB-34: contar los errores de `tsc --noEmit` con `strict`, `verbatimModuleSyntax` y `erasableSyntaxOnly` activados globalmente, sin commitear, agrupados por flag y por carpeta.
  4. Verificar el efecto de eliminar `tsconfig.strict.json` sobre el linting con tipos de MHB-39 (`parserOptions.project`).
  5. Registrar la decisión en los contratos de MHB-34 y MHB-36: allowlist por archivo con herramienta, versión y motivo, o cero excepciones. Si el conteo del paso 3 lo justifica, proponer al usuario dividir MHB-34.
- **Criterios de aceptación:**
  - Tabla con los 22 archivos (o el conteo vigente) con decisión y comando de evidencia por fila.
  - Conteo de errores estrictos por flag y por carpeta.
  - Contratos de MHB-34 y MHB-36 actualizados con la allowlist y el umbral de división acordado.
  - `git diff master...HEAD` limitado a `docs/implementation/**`.
- **Validación automática:** `bun run lint:md`, `bun run format:check` y `git diff --check`; en la rama desechable, build, lint y `check:dist-baseline` por cada conversión probada.
- **Validación manual:** el usuario aprueba la allowlist y la decisión de dividir o no MHB-34.
- **Evidencia requerida:** tabla de clasificación, salida de los comandos por conversión, conteo de errores y decisión aprobada.
- **Riesgos y reversión:** dar por buena una conversión que solo funciona bajo Bun; por eso cada prueba se repite bajo Node 24. La rama desechable no se mergea.
- **Exclusiones específicas:** no convertir ningún archivo en la rama entregable (lo hace MHB-34); no cambiar versiones de dependencias; no modificar `tsconfig*.json` en la rama entregable.
- **Análisis de mantenibilidad:** no aplica a código; el spike reduce el riesgo de que MHB-34 mezcle investigación e implementación.
- **Implementador:** perfil TypeScript/tooling, alto.
- **Revisor independiente:** orquestador, con aprobación del usuario sobre la allowlist.
- **Condición de escalamiento:** alguna herramienta exige conservar JS, o el conteo de errores estrictos justifica dividir MHB-34.

### MHB-34 — Cierre total y modo estricto TypeScript

- **Objetivo observable:** eliminar la compatibilidad JavaScript transitoria, sanear utilidades residuales y dejar el repositorio propio completamente migrado a TypeScript estricto con arquitectura de carpetas validada.
- **Superficies autorizadas:** `scripts/ai/**`, configuraciones raíz restantes, tests/imports residuales, `package.json`, `tsconfig*.json`, ESLint/lint-staged, documentación y control de inventario.
- **Dependencias y precondiciones:** MHB-37, MHB-39, MHB-40, MHB-41 y MHB-42 completadas; conteo residual limitado a esta superficie; allowlist de excepciones JS y decisión de división aprobadas en MHB-42.
- **Pasos técnicos:**
  - **Ajustes derivados de MHB-39 a MHB-42:** reapuntar `parserOptions.project` del linting con tipos (MHB-39 lo apunta a `tsconfig.strict.json`, que este ID elimina) a `tsconfig.json`; convertir `scripts/validators/lint-guards/selectors.js` (añadido en MHB-37); pasar `check:inventory` del CI de modo informe a `--require-zero` con la allowlist de MHB-42 codificada en el propio script, no en exclusiones de ESLint ni de `tsconfig`.
  - **Refactor y reorganización shared:** evaluar y mover utilidades agnósticas de `scripts/ai/common/` (`hashing.mjs`, `gitignore.mjs`) a `scripts/shared/` para unificar el tooling.
  - **Auditoría arquitectónica:** auditar y validar que todo el árbol de archivos cumpla la regla de ≤250 líneas y ≤8 archivos fuente por directorio (incluyendo `scripts/esp/`).
  - Verificar previamente la compatibilidad de loaders de configuración para herramientas que no usan Vite (`maizzle`, `postcss`, `tailwind`); migrar automatizaciones AI y configuraciones raíz restantes; actualizar todas las referencias documentales y comandos; eliminar `tsconfig.strict.json` y activar `strict: true` directamente en `tsconfig.json`; eliminar `allowJs`/`checkJs`; activar `verbatimModuleSyntax` y `erasableSyntaxOnly` para que el TypeScript propio sea ejecutable con type stripping de Node (precondición de MHB-36); conservar activos los guards de higiene de tipos de MHB-37 al modificar ESLint; actualizar las referencias `.js` de las invariantes de este plan, `AGENTS.md` y skills (`storage-keys`, `dom-helpers`, `http-helpers`, árbol de ejemplo y sufijo de tests); activar `strict`, `noImplicitAny` y `strictNullChecks` como gate global único; ejecutar `bun run check:inventory --require-zero` como gate de bloqueo obligatorio e integrarlo de forma permanente en el camino de verificación y en los checks de CI/PR; reducir el script `typecheck` de `package.json` a un único `tsc --noEmit`; al actualizar referencias `.js`/`.mjs`, conservar nombres de terceros y texto histórico del CHANGELOG; ejecutar la matriz completa desde instalación congelada.
- **Criterios de aceptación:**
  - Todo el árbol de directorios del proyecto respeta los límites de ≤250 líneas y ≤8 archivos fuente por carpeta.
  - `rg --files -g '*.js' -g '*.mjs'` no devuelve código propio dentro del alcance fuera de la allowlist aprobada en MHB-42; no existen imports rotos ni extensiones antiguas documentadas; el typecheck global estricto, suite, build, validadores y sincronización de agentes quedan verdes; `check:inventory --require-zero` finaliza con código 0.
  - `tsconfig.json` incluye `strict`, `verbatimModuleSyntax` y `erasableSyntaxOnly`; los guards de MHB-37 siguen activos en `bun run lint`.
- **Validación automática:** `bun install --frozen-lockfile`, lint, typecheck estricto, test, formato, build, `validate-email`, `lint:contrast`, `a11y-check`, `agents:check`, `check:inventory --require-zero`, `check:dist-baseline` y `git diff --check`.
- **Validación manual:** revisar comandos públicos, configuración de cada herramienta, recorridos UI de Home/Preview/Library y output transaccional/marketing.
- **Evidencia requerida:** inventario final cero (`--require-zero`), matriz completa de gates, hashes finales, lista de comandos/documentos actualizados y diff acumulado por ID.
- **Riesgos y reversión:** cerrar prematuramente con excepciones ocultas o romper tooling auxiliar; ninguna excepción fuera de la allowlist de MHB-42 cuenta como cierre y cada ID previo permanece revertible por separado.
- **Exclusiones específicas:** no introducir React, no cambiar comportamiento de producto y no publicar versión/tag/release dentro de este ID.
- **Implementador:** perfil TypeScript/tooling transversal, alto.
- **Revisor independiente:** revisor técnico final distinto de los implementadores.
- **Condición de escalamiento:** queda una excepción JavaScript fuera de la allowlist de MHB-42, falla un gate global, `check:dist-baseline` detecta un cambio en `dist/` o una herramienta exige conservar un wrapper no TypeScript no previsto por MHB-42.

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
- **Dependencias y precondiciones:** MHB-34 completada para evitar doble churn durante la migración TypeScript; MHB-43 completada (sin el CLI `maizzle` ni otras dependencias sobrantes que migrar entre managers); MHB-41 completada (baseline de `dist/` y gates de email en CI que deben sobrevivir al cambio de runtime); todos los tests ya convertidos a `.ts`; `tsconfig.json` con `verbatimModuleSyntax` y `erasableSyntaxOnly` y guard `consistent-type-imports` activo (MHB-34/MHB-37), de modo que el código propio sea ejecutable con type stripping de Node 24.
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

## Fases

### Fase C — Evidencia para la puerta de calidad

- **Hallazgos que resuelve:** integración, baseline de tipos/rendimiento, accesibilidad y clientes reales.
- **IDs incluidos:** MHB-44, MHB-47 y MHB-14 (en ese orden: primero se corrige el HTML exportado, luego se fija su contrato ESP y después se toma la evidencia en clientes reales).
- **Entregables:** integración reproducible, baseline completo de tipos, mediciones y matriz de pruebas manuales.
- **Riesgos:** afirmar evidencia de clientes sin pruebas; incluir secretos en capturas o documentación.
- **Criterio de salida:** MHB-14 está cerrada con evidencia enlazable.

### Fase D — Evolución opcional y mantenimiento

- **IDs incluidos:** MHB-23 es opcional; MHB-38 migra en bloque email y dashboard a Maizzle 6 + Tailwind v4 dentro de su ventana (2027-01-15 a 2027-06-30).
- **Nota de alcance:** no es una fase solo opcional. La validación automatizada de accesibilidad/contraste y la mantenibilidad del código web son requeridas: no añaden producto, pero sostienen un dashboard verificable y mantenible.
- **Criterio de salida:** cada opcional aprobado cumple su propia aceptación; una demo accesible permite verificación, pero no equivale a publicar el caso como destacado. Los IDs requeridos cumplen su aceptación completa, sin excepción por ser trabajo interno.

#### Fase E — Migración completa a TypeScript y compatibilidad multi-PM

- **IDs incluidos:** MHB-37, MHB-39, MHB-40, MHB-41, MHB-45, MHB-46, MHB-42, MHB-34, MHB-43 y MHB-36.
- **Resguardo intermedio:** MHB-40 (gobernanza y revisión), MHB-41 (gate del contrato de salida), MHB-45 (protección de `master`), MHB-46 (API local) y MHB-42 (spike de loaders), junto con MHB-44 y MHB-47 de la Fase C, se cierran antes de MHB-34 para que la migración estricta no mezcle investigación con implementación ni avance sin gate sobre `dist/`.
- **Entregables:** contratos server↔client, constantes tipadas y guards de higiene de tipos (MHB-37); saneamiento de deuda y arquitectura modular; cierre global estricto sin JavaScript propio residual; compatibilidad con npm, yarn, pnpm y bun (MHB-36).
- **Riesgos:** mezclar renombres con cambios funcionales, perder compatibilidad de loaders o ocultar límites runtime con tipos estáticos; incompatibilidades sutiles entre package managers.
- **Criterio de salida:** MHB-34 confirma inventario JavaScript propio en cero, límites de tamaño y carpetas cumplidos, typecheck estricto y matriz global verde; MHB-36 confirma que el proyecto funciona con los 4 managers.

### Fase F — Release y demostración

- **IDs incluidos:** MHB-15 y, si se aprueba, MHB-16.
- **Entregables:** documentación y release posterior coherentes con la migración completada; demo candidata opcional y verificable.
- **Riesgos:** publicar antes del cierre total o presentar evidencia no sustentada.
- **Criterio de salida:** MHB-15 está cerrada con el alcance congelado y el contrato de salida documentado; MHB-16 cumple su aceptación cuando sea requerida o aprobada.

## Contrato obligatorio de cierre

Cada elemento debe conservar en el contrato transferido objetivo, archivos, pasos, dependencias, aceptación, pruebas automáticas, validación manual, riesgos, exclusiones y evidencia esperada. Una skill puede añadir controles, pero no sustituir esos campos ni rebajar su aceptación.

### Estados y revisión independiente

1. `Pendiente`: dependencias o autorización todavía no satisfechas.
2. `En progreso`: implementador asignado y propiedad de archivos registrada.
3. `En revisión`: implementación terminada; se registran diff, comandos, resultados, desviaciones y riesgos. El implementador no puede marcarla `Completada`.
4. `Bloqueada`: un control obligatorio falla o falta evidencia; no se inicia la tarea dependiente.
5. `Completada`: un revisor independiente confirma aceptación, diff, pruebas, lint, typecheck/build cuando correspondan y ausencia de cambios fuera de alcance; el orquestador dicta el veredicto.

### Matriz mínima de comprobación

| IDs    | Prueba automática mínima                                                             | Validación manual                                                                      | Evidencia de cierre                                                                |
| ------ | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| MHB-14 | Validadores disponibles; no sustituyen pruebas reales.                               | Teclado/lector y Gmail/Outlook/Apple Mail con protocolo fechado.                       | Matriz por cliente/criterio, capturas sin secretos y limitaciones.                 |
| MHB-15 | Lint, suite, build y consistencia de versión.                                        | Revisar README, capturas, changelog y release antes de publicar.                       | SHA, tag, URL de release y diff final.                                             |
| MHB-16 | Smoke del build estático y enlaces.                                                  | Navegar demo solo lectura en desktop/móvil.                                            | URL candidata, SHA desplegado y checklist.                                         |
| MHB-23 | Tests y validadores aplicables por componente.                                       | Aparición y edición en `/library`.                                                     | Schema, captura y build verde.                                                     |
| MHB-37 | Lint con guards de tipos, fixtures de guards, suite, typecheck y hashes.             | Preview y Library: persistencia de modos, temas, copy/download, error de render y HMR. | Inventario antes/después, constantes con consumidores y salida de fixtures.        |
| MHB-40 | `lint:md`, `format:check`, `agents:check` y búsqueda de contradicciones en cero.     | Lectura cruzada skills ↔ plan y ensayo de `task-review` sobre MHB-39.                  | Tabla de contradicciones, reglas añadidas y salida del ensayo.                     |
| MHB-41 | Tests con fixtures de `check:dist-baseline`, build y validadores en CI.              | Commit de prueba que altera `dist/` y pone la CI en rojo (revertido).                  | URL de CI verde y roja, salida de fixtures y tiempo añadido.                       |
| MHB-45 | Lint y formato de workflows; API de protección de rama.                              | PR con checks en rojo bloqueado en GitHub.                                             | Salida de la API de protección y diff de workflows.                                |
| MHB-44 | Reglas nuevas con fixtures, build, `validate-email`, `check-size` y baseline.        | Preview antes/después en claro/oscuro y desktop/móvil.                                 | Conteo por patrón antes/después y diff justificado por template.                   |
| MHB-46 | Tests de rechazo 403 por endpoint de escritura.                                      | Guardar datos, copiar HTML e invalidar caché desde el dashboard.                       | Tabla de endpoints protegidos y salida de tests.                                   |
| MHB-47 | Fixture de helper no soportado, manifiesto generado y `check:dist-baseline`.         | Consumo del manifiesto desde la integración del usuario.                               | Manifiesto, salida de la regla y confirmación del usuario.                         |
| MHB-42 | Build, lint y `check:dist-baseline` por conversión probada (rama desechable).        | Aprobación de la allowlist y de la división de MHB-34 por el usuario.                  | Tabla de clasificación, conteo de errores estrictos y decisión registrada.         |
| MHB-34 | Gate de cero `.js`/`.mjs`, typecheck estricto y matriz global.                       | Revisar comandos, tooling, UI y outputs finales.                                       | Inventario final cero, gates completos y referencias actualizadas.                 |
| MHB-43 | Gates completos, build con `--production` y `check:dist-baseline`.                   | `dev` (Home/Preview/Library), `export:screenshot` y flujo de `cli`.                    | Tabla de dependencias antes/después y diff de `package.json`.                      |
| MHB-36 | Instalación y gates completos con npm, yarn, pnpm y bun; suite Vitest verde.         | Clonar limpio e instalar con npm y bun como extremos representativos.                  | Logs de 4 managers, diff de imports, hashes `dist/` idénticos entre managers.      |
| MHB-38 | `modern-css-inline`, suite, build, `validate-email`, `check-size` y diff de `dist/`. | Checkpoint PoC, preview, biblioteca, dashboard y Gmail/Outlook con envío autorizado.   | Auditoría por template, diff justificado de `dist/`, matriz de dependencias y ADR. |

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

1. Ejecutar MHB-37 (contratos, constantes tipadas y guards de tipos).
2. Ejecutar MHB-39 (convenciones de nombres de archivo y linting con tipos).
3. Ejecutar MHB-40 (gobernanza de agentes y skill `task-review`); desde su cierre, toda revisión usa `task-review`.
4. Ejecutar MHB-41 (gate del contrato de salida y validadores de email en CI).
5. Ejecutar MHB-45 (protección de `master` y Dependabot).
6. Ejecutar MHB-44 (compatibilidad del HTML exportado); es la única vía, junto con MHB-38, autorizada para actualizar el baseline de MHB-41.
7. MHB-14 (evidencia en clientes reales) puede ejecutarse desde el cierre de MHB-44, en paralelo con los IDs siguientes, porque su superficie es documental y manual; debe estar cerrada antes de MHB-15.
8. Ejecutar MHB-46 (API local) y MHB-47 (contrato ESP y perfil SendGrid), en ese orden.
9. Ejecutar MHB-42 (spike de loaders y allowlist de excepciones); si el usuario decide dividir MHB-34, registrar los nuevos IDs antes de continuar.
10. Cerrar la migración con MHB-34; ninguna excepción `.js`/`.mjs` fuera de la allowlist de MHB-42 permite avanzar.
11. Ejecutar MHB-43 (higiene de dependencias) tras MHB-34: eliminar el CLI `maizzle`, `fs-extra` y `glob`, y reclasificar dependencias por rol.
12. Ejecutar MHB-36 (compatibilidad multi-PM) tras MHB-43; migrar tests a Vitest y eliminar acoplamiento a Bun.
13. Preparar MHB-15 solo con todas sus dependencias completadas; congelar el alcance al iniciarla; decidir MHB-16 después de esa release candidata. MHB-23 permanece opcional y separado.
14. MHB-38 se ejecuta dentro de su ventana (no antes de 2027-01-15, límite 2027-06-30) o antes si se registra un disparador, siempre tras MHB-34 y MHB-36; hasta entonces el stack sigue en Maizzle 5 + Tailwind v3. Por cambiar `dist/`, queda fuera del alcance congelado de MHB-15.
15. Someter el producto a revisión final independiente antes de declararlo listo para presentarse como caso de portafolio.

### Política de ramas y versiones conservada

- Una tarea por rama `feature/<id-en-minusculas>` y PR directo a `master`; no se mezclan tareas ni se incrementa versión por cada una.
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

### Fase C — Calidad y evidencia

| Línea                      | Skills obligatorias                                         | Implementador y propiedad                           | Revisor                 | Controles                                           | Escalar cuando                                                            |
| -------------------------- | ----------------------------------------------------------- | --------------------------------------------------- | ----------------------- | --------------------------------------------------- | ------------------------------------------------------------------------- |
| MHB-44 compatibilidad HTML | `email-compatibility`, `email-project-stack`, `task-review` | Perfil alto; config email, iconos, reglas y `dist/` | Revisor build/email     | Reglas con fixtures, baseline justificado y preview | Cambio visual, hosting de imágenes sin decidir o variables ESP afectadas. |
| MHB-47 contrato ESP        | `email-compatibility`, `email-quality-gates`, `task-review` | Perfil medio; `scripts/esp/**`, regla y manifiesto  | Revisor email y usuario | Manifiesto, regla con fixture y `dist/` sin cambios | Helper no soportado en un template existente o formato a decidir.         |
| MHB-14 evidencia manual    | `email-compatibility`, `email-preview-dashboard`            | Perfil alto; matriz/capturas                        | Orquestador             | Protocolo fechado, clientes reales y accesibilidad  | No haya acceso a cliente/dispositivo o aparezcan datos sensibles.         |

### Fase D — Evolución y mantenimiento

| Línea              | Skills obligatorias                                                     | Implementador y propiedad                    | Revisor                  | Controles                                           | Escalar cuando                                                           |
| ------------------ | ----------------------------------------------------------------------- | -------------------------------------------- | ------------------------ | --------------------------------------------------- | ------------------------------------------------------------------------ |
| MHB-23 componentes | `email-compatibility`, `email-preview-dashboard`                        | Perfil medio; partials/schemas/library       | Revisor email/UI         | Build, schema, library y visual                     | Amplíe el alcance hacia un builder.                                      |
| MHB-38 Maizzle 6   | `email-project-stack`, `email-compatibility`, `email-preview-dashboard` | Perfil alto; email, build, preview y estilos | Revisor build/email y UI | Checkpoint PoC, auditoría, diff `dist/` y recorrido | La PoC pierda `{{ }}`/Handlebars o no exista API programática de render. |

### Fase E — Migración TypeScript

| Línea                    | Skills obligatorias                                                                | Implementador y propiedad                                               | Revisor                  | Controles                                               | Escalar cuando                                                                          |
| ------------------------ | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------ | ------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| MHB-37 contratos         | `email-refactor-type-safety`, `email-quality-gates`, `email-preview-dashboard`     | Perfil medio; contracts/web/Vite/validators                             | Revisor técnico          | Guards con fixtures, suite, hashes y recorrido          | Cambia un valor persistido, un endpoint o exige dependencia.                            |
| MHB-40 gobernanza        | `task-verification`, `task-status-management`, `email-quality-gates`               | Perfil medio; `docs/ai/**` y adaptadores                                | Orquestador              | Contradicciones cero, `agents:check` y ensayo           | Conflicto en `agents:sync` o regla que cambia un ID en curso.                           |
| MHB-41 gate salida       | `email-project-stack`, `email-compatibility`, `email-quality-gates`, `task-review` | Perfil medio; `dist-baseline`, CI y scripts                             | Revisor build/email      | Fixtures, CI verde y rojo provocado                     | Hashes no deterministas o validador no ejecutable en CI.                                |
| MHB-45 protección master | `task-verification`, `email-quality-gates`, `task-review`                          | Perfil medio; workflows y configuración de GitHub                       | Orquestador y usuario    | API de protección y PR bloqueado                        | Cualquier cambio de configuración del repositorio.                                      |
| MHB-46 API local         | `email-preview-dashboard`, `email-quality-gates`, `task-review`                    | Perfil medio; `scripts/vite/api/**`                                     | Revisor técnico          | Tests 403 y recorrido del dashboard                     | La guarda obliga a cambiar un contrato de API.                                          |
| MHB-42 spike             | `email-project-stack`, `email-refactor-type-safety`, `task-review`                 | Perfil alto; rama desechable y docs                                     | Orquestador y usuario    | Conversiones probadas bajo Bun y Node 24                | Una herramienta exige JS o conviene dividir MHB-34.                                     |
| MHB-34 cierre TS         | `email-project-stack`, `email-quality-gates`, `task-verification`, `task-review`   | Perfil alto; AI/configs/gates/docs residuales                           | Revisor técnico final    | Inventario cero, strict global y matriz completa        | Queda una excepción JS/MJS fuera de la allowlist o falla cualquier gate global.         |
| MHB-43 dependencias      | `email-project-stack`, `email-quality-gates`, `task-review`                        | Perfil medio; `package.json`, build y consumidores de `fs-extra`/`glob` | Revisor técnico de build | Build `--production`, `check:dist-baseline` y recorrido | La API de Maizzle no reproduce `dist/` o eliminar un paquete cambia un comando público. |
| MHB-36 multi-PM          | `email-project-stack`, `email-quality-gates`, `task-verification`                  | Perfil medio-alto; scripts/tests/CI/docs                                | Revisor técnico          | Gates con 4 PMs, Vitest verde, hashes idénticos         | Un PM no soporta una feature o Vitest rompe un mock.                                    |

### Fase F — Release y demo

| Línea          | Skills obligatorias                                                                           | Implementador y propiedad            | Revisor     | Controles                                                            | Escalar cuando                                                                                |
| -------------- | --------------------------------------------------------------------------------------------- | ------------------------------------ | ----------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| MHB-15 release | `task-verification`, `release-management`                                                     | Perfil medio; docs/version/changelog | Orquestador | Suite, inventario TS, `check:dist-baseline`, Go/No-Go, tag y release | Antes de publicación, tag o cambio de versión, o ante un hallazgo que rompa el congelamiento. |
| MHB-16 demo    | `email-project-stack`, `email-preview-dashboard`, skill de despliegue si se aprueba proveedor | Perfil alto; build/config de deploy  | Orquestador | Smoke, URL, SHA y ausencia de divergencia                            | Requiera proveedor, credenciales o publicación externa.                                       |

El orquestador conserva integración, decisiones transversales, cambios destructivos, versiones, releases y veredictos. Solo paraleliza líneas con archivos exclusivos y al menos dos ámbitos realmente independientes.
