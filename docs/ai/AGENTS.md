# AGENTS.md — EmailForge Toolkit

No editar directamente los adaptadores generados de la raíz. La fuente canónica
de instrucciones es este archivo y las skills bajo `docs/ai/skills/`.

## Mandato y flujo crítico

EmailForge Toolkit es una herramienta local para crear, previsualizar, compilar,
validar y exportar templates HTML de email. Todo cambio debe preservar:

1. editar `src/emails/templates/*`;
2. previsualizar con Vite y Handlebars;
3. compilar mediante `bun run build` y Maizzle;
4. validar compatibilidad;
5. producir `dist/<template>.html` sin consumir variables ESP `{{ }}`.

## Documentos operativos

- Roadmap completo y contrato por feature: `docs/implementation/PLAN.md`.
- Estado mutable, validaciones, bloqueos y handoff: `docs/implementation/STATUS.md`.
- El plan contiene únicamente los IDs pendientes. Ejecutar solo el ID que se
  asigne, respetar sus dependencias vigentes y no alterar los demás sin acuerdo.

## Skills locales obligatorias

| Trabajo                                                  | Skill                        |
| -------------------------------------------------------- | ---------------------------- |
| Stack, rutas, Bun, Vite, Maizzle, Handlebars o CLI       | `email-project-stack`        |
| Seguridad, JSDoc, errores, tests o validación            | `email-quality-gates`        |
| Templates, layouts, CSS email o validadores              | `email-compatibility`        |
| Preview, dashboard, biblioteca o API Vite                | `email-preview-dashboard`    |
| Tokens, temas dark/light o contraste del web             | `email-visual-design-system` |
| Layout responsive web, Grid, Flexbox o container queries | `email-responsive-web-ui`    |
| Refactor, modularización o tipado gradual                | `email-refactor-type-safety` |
| Convenciones de código, nombres, roles o estructura      | `email-code-conventions`     |
| Evidencias, ramas, commits o cierre                      | `task-verification`          |
| Procedimiento del revisor independiente y gates          | `task-review`                |
| Congelamiento de alcance, checklist Go/No-Go y SemVer    | `release-management`         |
| Actualizar `docs/implementation/STATUS.md`               | `task-status-management`     |

Leer solo las skills aplicables antes de modificar archivos. Cada una conserva
`agents/openai.yaml` con metadata de interfaz; no duplica instrucciones. No
tratar un mapa arquitectónico como una skill ni ampliar el alcance de un ID
asignado.

## Invariantes

- Usar Bun; no `npm`, `npx`, `yarn` ni `pnpm` sin autorización explícita.
- No usar `maizzle build` como solución final; usar `bun run build`.
- Mantener `[[ page.* ]]` para Maizzle y `{{ }}` para el ESP.
- No escribir fuera del workspace, exponer secretos, revertir trabajo ajeno ni
  ocultar errores.
- El implementador entrega a `En revisión`; un revisor distinto confirma
  `Completada` con aceptación, diff y evidencia.
- Los planes y artefactos auxiliares de una tarea pueden existir solo de forma
  temporal bajo `docs/superpowers/`. Al confirmar el usuario que la tarea está
  completa, eliminarlos antes de preparar la PR; la rama entregable y `master`
  deben conservar `docs/superpowers/` vacía.
- Una desviación de alcance detiene el ID hasta acordar su tratamiento.
- Refactor integrado y análisis de mantenibilidad: cada tarea contempla
  refactorizar su alcance mientras avanza; no crear tareas de refactor aisladas.
  Cada plan incluye análisis de mantenibilidad obligatorio (inventario de líneas,
  responsabilidad única por archivo, duplicación detectada y estructura de carpetas).
- Límites de archivo y carpeta: ningún archivo fuente no-test supera 250 líneas
  (tests hasta 400 líneas). Ningún directorio contiene más de 8 archivos fuente
  sin estructurarse en subdirectorios por dominio.
- Shared first: buscar helpers y constantes en `scripts/shared/` o
  `src/web/shared/utils/` antes de escribir utilidades nuevas. No hardcodear
  claves de almacenamiento (`storage-keys.ts`), breakpoints, encabezados o magic numbers.
  En frontend usar helpers centrales (`queryRequired`, `fetchJSON`, `debounce`) en vez
  de llamadas directas al DOM o `fetch()`.
- Contratos aislados y tipado estricto: los contratos compartidos residen en
  `scripts/shared/contracts/` como módulos hoja sin dependencias de Node.js ni
  imports ascendentes. Se prohíbe `any` y `@typedef` en TypeScript (`.ts`); los
  límites externos (storage, URL, red) deben validarse mediante type guards.
- Todo archivo fuente nuevo es `.ts`, salvo la allowlist que fije MHB-42.
- Prohibido añadir `ignores` o exclusiones de ESLint, directivas `eslint-disable`,
  `@ts-ignore`/`@ts-expect-error`, exclusiones de `tsconfig*.json` o tests `skip`/`todo`
  sin registrarlos como desviación aprobada en `STATUS.md`.
- Cada criterio de aceptación de un ID nuevo o ajustado se asocia a un comando o
  test que falle si no se cumple; lo no automatizable se declara explícitamente
  como revisión manual.
- Un ID que borra o renombra archivos debe actualizar, en el mismo ID, las rutas
  citadas por los contratos pendientes de `PLAN.md`.
- La comparación de `dist/*.html` contra el baseline es un paso obligatorio de
  verificación (manual hasta que MHB-41 la automatice).
- Cada ID con efecto observable (comandos, dependencias, output, UI, CI) añade su
  entrada en `CHANGELOG.md` bajo `[Unreleased]` antes de pasar a `En revisión`.
- Menos es más: preferir eliminar código muerto o simplificar antes que agregar
  abstracciones preventivas. Un helper se justifica con ≥2 consumidores reales o
  manejo de error no trivial.
- No abrir el Browser pane (preview, screenshots, navegación) por decisión
  propia; solo cuando el usuario lo solicite explícitamente. Verificar
  cambios por defecto con los comandos del proyecto (build, validate-email,
  lint, typecheck, test). Prioridad de costo/precisión al verificar (detalle
  en `task-verification`): script determinista > lectura de texto/markdown >
  HTML crudo > Browser pane/screenshot.

## Comandos comprobados

| Acción                  | Comando                         |
| ----------------------- | ------------------------------- |
| Instalar congelado      | `bun install --frozen-lockfile` |
| Desarrollo              | `bun run dev`                   |
| Lint                    | `bun run lint`                  |
| Typecheck               | `bun run typecheck`             |
| Pruebas                 | `bun run test`                  |
| Build                   | `bun run build`                 |
| Validar email           | `bun run validate-email`        |
| Formato                 | `bun run format:check`          |
| Comprobar rama MHB      | `bun run check:task-branch`     |
| Sincronizar adaptadores | `bun run agents:sync`           |
| Comprobar adaptadores   | `bun run agents:check`          |

## Forma de trabajo

1. Leer el contrato del ID y confirmar dependencias, aceptación y exclusiones.
2. Crear o cambiar a `feature/<id-en-minusculas>` y ejecutar
   `bun run check:task-branch` antes de editar.
3. Registrar el ID `En progreso` en el estado sin activar otro.
4. Implementar únicamente la superficie autorizada y ejecutar sus controles.
5. Entregar el ID `En revisión` con resultados resumidos y riesgos residuales.
6. Un revisor independiente confirma o rechaza el cierre; registrar el handoff
   con rama, commit, evidencia, desviaciones y siguiente acción.

## Orquestación

El chat principal integra resultados y conserva decisiones transversales,
seguridad, versiones, releases, acciones destructivas y veredicto final. Solo
delegar trabajo independiente con propiedad de archivos exclusiva. Usar el
modelo y esfuerzo indicados por cada ID en `PLAN.md`; escalar si
cambia el contrato CLI, filesystem, compatibilidad, versión, release, permisos
CI o alcance.

## Sincronización de adaptadores

Las fuentes canónicas son este archivo y `docs/ai/skills/*/SKILL.md`. Los
targets declarados son `AGENTS.md`, `CLAUDE.md`, `.agent/skills`,
`.agents/skills`, `.claude/skills`, `.codex/skills` y `.github/skills`.

Antes de sincronizar, ejecutar el preflight de `agents:sync`. Un enlace legado,
contenido manual, fuente inválida o conflicto debe detener la operación sin
escribir. Nunca ejecutar `scripts/ai/sync-agents.js` heredado.
