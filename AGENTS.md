# AGENTS.md

Guia obligatoria para agentes que trabajen en este repositorio.

Este archivo es el contrato raiz. Mantiene solo las reglas globales y delega
los detalles operativos a skills repo-locales en `docs/agent-skills/`.

## Mandato

Este proyecto es un sistema de desarrollo, preview, validacion y exportacion de
templates HTML de email basado en Bun, Vite, Maizzle y Handlebars.

Todo cambio debe preservar el flujo principal:

1. editar templates en `src/templates/*`;
2. previsualizar con Vite;
3. renderizar datos de preview con Handlebars;
4. compilar con Maizzle mediante el pipeline del proyecto;
5. validar compatibilidad de email;
6. producir HTML final plano en `dist/<template>.html`.

## Skills Repo-Locales

Antes de modificar archivos, lee la skill aplicable:

| Tarea                                                          | Skill obligatoria                                                    |
| -------------------------------------------------------------- | -------------------------------------------------------------------- |
| Build, Vite, Maizzle, Handlebars, Bun, CLI o rutas clave       | [project-stack.md](docs/agent-skills/project-stack.md)               |
| JSDoc, ESLint, errores, seguridad o dependencias               | [quality-gates.md](docs/agent-skills/quality-gates.md)               |
| Refactors, archivos grandes, JS embebido en HTML o type safety | [refactor-type-safety.md](docs/agent-skills/refactor-type-safety.md) |
| Templates, layouts, partials, CSS de email o validadores       | [email-compatibility.md](docs/agent-skills/email-compatibility.md)   |
| Verificacion, comandos permitidos, commits o git               | [workflow-git.md](docs/agent-skills/workflow-git.md)                 |

Si una tarea cruza dominios, lee todas las skills aplicables. No copies todo el
contenido a contexto si no hace falta; carga solo lo necesario para ejecutar con
seguridad.

## Reglas Globales

- Usa Bun. No uses `npm`, `npx`, `yarn` ni `pnpm` salvo autorizacion explicita.
- No ejecutes `maizzle build` como solucion final; usa `bun run build`.
- Mantiene intactas las variables ESP con `{{ }}` en el output final.
- Todo JS nuevo o modificado en `scripts/`, `src/js/` y
  `scripts/vite-plugins/` debe tener JSDoc suficiente.
- ESLint debe cubrir el codigo JS tocado, incluyendo `src/js/`.
- No migres todo a TypeScript de golpe sin aprobacion explicita.
- No ocultes errores. Los scripts, APIs internas y build steps deben fallar de
  forma explicita y accionable.
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
```

## Definicion de Terminado

Un cambio esta terminado solo si:

1. implementa el comportamiento solicitado;
2. mantiene compatibilidad del pipeline de email;
3. agrega JSDoc en contratos nuevos o modificados;
4. maneja errores relevantes;
5. ejecuta la verificacion adecuada;
6. no introduce artefactos no solicitados;
7. resume archivos cambiados, comandos ejecutados y riesgos residuales.
