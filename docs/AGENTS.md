# AGENTS.md

Guia obligatoria para agentes que trabajen en este repositorio.

Este archivo es el contrato raiz. Mantiene solo las reglas globales y delega
los detalles operativos a skills repo-locales en `docs/agent-skills/`.

## Mandato

Este proyecto es un sistema de desarrollo, preview, validacion y exportacion de
templates HTML de email basado en Bun, Vite, Maizzle y Handlebars.

Todo cambio debe preservar el flujo principal:

1. editar templates en `src/emails/templates/*`;
2. previsualizar con Vite;
3. renderizar datos de preview con Handlebars;
4. compilar con Maizzle mediante el pipeline del proyecto;
5. validar compatibilidad de email;
6. producir HTML final plano en `dist/<template>.html`.

## Skills Repo-Locales

Antes de modificar archivos, lee la skill aplicable:

| Tarea                                                          | Skill obligatoria                                                       |
| -------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Build, Vite, Maizzle, Handlebars, Bun, CLI o rutas clave       | [project-stack.md](/docs/agent-skills/project-stack.md)                 |
| JSDoc, ESLint, errores, seguridad o dependencias               | [quality-gates.md](/docs/agent-skills/quality-gates.md)                 |
| Refactors, archivos grandes, JS embebido en HTML o type safety | [refactor-type-safety.md](/docs/agent-skills/refactor-type-safety.md)   |
| Templates, layouts, partials, CSS de email o validadores       | [email-compatibility.md](/docs/agent-skills/email-compatibility.md)     |
| Dashboard web, preview, libreria de componentes o APIs Vite UI | [web-preview-dashboard.md](/docs/agent-skills/web-preview-dashboard.md) |
| Verificacion, comandos permitidos, commits o git               | [workflow-git.md](/docs/agent-skills/workflow-git.md)                   |

Si una tarea cruza dominios, lee todas las skills aplicables. No copies todo el
contenido a contexto si no hace falta; carga solo lo necesario para ejecutar con
seguridad.

## Reglas Globales

- Usa Bun. No uses `npm`, `npx`, `yarn` ni `pnpm` salvo autorizacion explicita.
- No ejecutes `maizzle build` como solucion final; usa `bun run build`.
- Mantiene intactas las variables ESP con `{{ }}` en el output final.
- Todo JS nuevo o modificado en `scripts/`, `src/web/` y `scripts/vite/`
  debe tener JSDoc suficiente.
- ESLint debe cubrir el codigo JS tocado, incluyendo `src/web/`.
- No migres todo a TypeScript de golpe sin aprobacion explicita.
- No ocultes errores. Los scripts, APIs internas y build steps deben fallar de
  forma explicita y accionable.
- Al terminar cada tarea, aplica Prettier solo a los archivos modificados por
  esa tarea y confirma el formato con `bun run format:check`.
- No reviertas cambios que no hiciste. Respeta el working tree existente.
- No escribas fuera del workspace sin autorizacion explicita.
- No imprimas secretos ni generes archivos con credenciales.

## Comandos Oficiales

```bash
bun install
bun run dev
bun run build
bun run lint
bun run validate-email
bun run cli
bun run format
bun run format:check
bun run agents:sync
```

## Definicion de Terminado

Un cambio esta terminado solo si:

1. implementa el comportamiento solicitado;
2. mantiene compatibilidad del pipeline de email;
3. agrega JSDoc en contratos nuevos o modificados;
4. maneja errores relevantes;
5. aplica Prettier a los archivos modificados;
6. ejecuta `bun run format:check` y la verificacion adecuada;
7. no introduce artefactos no solicitados;
8. resume archivos cambiados, comandos ejecutados y riesgos residuales.

## Roadmap de implementación

Para tareas identificadas como `F0-T1`, `F1-T2` o similares, es obligatorio
leer:

1. `docs/implementation/PLAN.md`
2. `docs/implementation/STATUS.md`
3. `docs/implementation/STATUS_GUIDE.md`

Implementa únicamente la tarea solicitada y actualiza `STATUS.md` siguiendo su
guía.
