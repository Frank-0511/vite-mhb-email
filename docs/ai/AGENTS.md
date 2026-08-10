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
- El plan contiene todas las features MHB-01 a MHB-23. Ejecutar solo el ID que
  se asigne, respetar sus dependencias y no alterar los demás sin acuerdo.

## Skills locales obligatorias

| Trabajo                                            | Skill                        |
| -------------------------------------------------- | ---------------------------- |
| Stack, rutas, Bun, Vite, Maizzle, Handlebars o CLI | `email-project-stack`        |
| Seguridad, JSDoc, errores, tests o validación      | `email-quality-gates`        |
| Templates, layouts, CSS email o validadores        | `email-compatibility`        |
| Preview, dashboard, biblioteca o API Vite          | `email-preview-dashboard`    |
| Refactor, modularización o tipado gradual          | `email-refactor-type-safety` |
| Evidencias, ramas, commits o cierre                | `task-verification`          |
| Actualizar `docs/implementation/STATUS.md`         | `task-status-management`     |

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
- Una desviación de alcance detiene el ID hasta acordar su tratamiento.

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
| Sincronizar adaptadores | `bun run agents:sync`           |
| Comprobar adaptadores   | `bun run agents:check`          |

## Forma de trabajo

1. Leer el contrato del ID y confirmar dependencias, aceptación y exclusiones.
2. Registrar el ID `En progreso` en el estado sin activar otro.
3. Implementar únicamente la superficie autorizada y ejecutar sus controles.
4. Entregar el ID `En revisión` con resultados resumidos y riesgos residuales.
5. Un revisor independiente confirma o rechaza el cierre; registrar el handoff
   con rama, commit, evidencia, desviaciones y siguiente acción.

## Orquestación

El chat principal integra resultados y conserva decisiones transversales,
seguridad, versiones, releases, acciones destructivas y veredicto final. Solo
delegar trabajo independiente con propiedad de archivos exclusiva. Usar el
modelo y esfuerzo indicados por cada ID en `IMPLEMENTATION-PLAN.md`; escalar si
cambia el contrato CLI, filesystem, compatibilidad, versión, release, permisos
CI o alcance.

## Sincronización de adaptadores

Las fuentes canónicas son este archivo y `docs/ai/skills/*/SKILL.md`. Los
targets declarados son `AGENTS.md`, `CLAUDE.md`, `.agent/skills`,
`.agents/skills`, `.claude/skills`, `.codex/skills` y `.github/skills`.

Antes de sincronizar, ejecutar el preflight de `agents:sync`. Un enlace legado,
contenido manual, fuente inválida o conflicto debe detener la operación sin
escribir. Nunca ejecutar `scripts/ai/sync-agents.js` heredado.
