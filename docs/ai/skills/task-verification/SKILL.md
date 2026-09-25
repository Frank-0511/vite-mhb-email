---
name: task-verification
description: Verificar tareas, ejecutar comandos permitidos, preparar ramas o commits, documentar evidencia y revisar cierres en EmailForge Toolkit. Usar para cualquier cierre de ID, cambios de CI/documentación o trabajo Git.
---

# Verificación y Git

- Usar `bun run <script>`; no usar npm, npx, Yarn o pnpm sin autorización.
- Aplicar Prettier solo sobre archivos de la tarea y confirmar con
  `bun run format:check`.
- Ejecutar controles mínimos: docs → lint Markdown; JS → lint; email → build y
  validate-email; UI → lint y recorrido manual; CLI/exportación → acción o
  helper afectado. Investigar controles fallidos; no relajarlos.
- Priorizar validación por costo de tokens: script determinista (p. ej.
  `a11y-check`, `lint:contrast`, linters) antes que hacer leer/juzgar contenido
  a la IA. Si es indispensable que la IA lea contenido, preferir markdown/texto
  extraído sobre HTML crudo (menos ruido de tags/atributos por unidad de
  información), y reservar Browser pane/screenshot solo para verificación
  visual que el texto no pueda confirmar (contraste computado, layout, foco).
- Mantener build idempotente, restaurar mutaciones temporales y emitir errores
  accionables con código distinto de cero.
- La comparación de `dist/*.html` contra el baseline es un paso obligatorio de
  verificación (manual hasta que MHB-41 la automatice).
- Cada criterio de aceptación de un ID nuevo o ajustado se asocia a un comando o
  test que falle si no se cumple; lo no automatizable se declara explícitamente
  como revisión manual.
- Un ID que borra o renombra archivos debe actualizar, en el mismo ID, las rutas
  citadas por los contratos pendientes de `PLAN.md`.
- Prohibido añadir `ignores` o exclusiones de ESLint, directivas `eslint-disable`,
  `@ts-ignore`/`@ts-expect-error`, exclusiones de `tsconfig*.json` o tests `skip`/`todo`
  sin registrarlos como desviación aprobada en `STATUS.md`.
- Para cada MHB usar una rama `feature/<id-en-minusculas>` y PR directo a
  `master`. Antes de editar, ejecutar `bun run check:task-branch`; crear o
  cambiar a la rama requerida si falla. El hook pre-commit aplica el mismo
  guard. No mezclar tareas ni incrementar versión por tarea.
- Antes de commit, revisar diff. No versionar logs o artefactos no solicitados,
  no reescribir historial ni revertir cambios ajenos.
- Cada ID con efecto observable (comandos, dependencias, output, UI, CI) añade su
  entrada en `CHANGELOG.md` bajo `[Unreleased]` antes de pasar a `En revisión`.
- Entregar el ID a `En revisión`; un revisor independiente confirma aceptación,
  diff, pruebas y ausencia de desviaciones antes de `Completada`.
- Al confirmar el usuario que la tarea quedó completa, eliminar, antes de
  preparar la PR, los planes, specs y demás archivos auxiliares creados solo
  para trabajarla (borradores, notas de análisis, specs temporales). No borrar
  documentación oficial del repo (`docs/implementation/PLAN.md`,
  `docs/implementation/STATUS.md`, etc.); ante la duda de si un archivo es
  oficial o de trabajo, confirmar antes de borrar.
- `docs/superpowers/` es exclusivamente un área temporal: antes de entregar la
  PR debe quedar vacía y `master` debe permanecer vacío allí. Verificarlo de
  forma explícita antes de declarar el cierre, sin borrar artefactos de otras
  tareas que aún no hayan sido confirmadas como completas.
- Rutas conocidas donde buscar este tipo de material por ID:
  - `docs/superpowers/plans/<fecha>-<id-en-minusculas>-*.md`
  - `docs/superpowers/specs/<fecha>-<id-en-minusculas>-*.md`
  - `.superpowers/sdd/<fecha>-<id-en-minusculas>-*/` (brief, progress, report,
    review-package.diff; conservar solo `.superpowers/sdd/.gitignore`)

Escalar tags, versiones, release, publicación, permisos CI y cualquier operación
destructiva al orquestador.
