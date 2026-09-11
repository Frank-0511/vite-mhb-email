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
- Mantener build idempotente, restaurar mutaciones temporales y emitir errores
  accionables con código distinto de cero.
- Para cada MHB usar una rama `feature/<id-en-minusculas>` y PR directo a
  `master`. Antes de editar, ejecutar `bun run check:task-branch`; crear o
  cambiar a la rama requerida si falla. El hook pre-commit aplica el mismo
  guard. No mezclar tareas ni incrementar versión por tarea.
- Antes de commit, revisar diff. No versionar logs o artefactos no solicitados,
  no reescribir historial ni revertir cambios ajenos.
- Entregar el ID a `En revisión`; un revisor independiente confirma aceptación,
  diff, pruebas y ausencia de desviaciones antes de `Completada`.
- Al confirmar el usuario que la tarea quedó correcta, eliminar los planes,
  specs y demás archivos auxiliares creados solo para trabajarla (borradores,
  notas de análisis, specs temporales). No borrar documentación oficial del
  repo (`docs/implementation/PLAN.md`, `docs/implementation/STATUS.md`, etc.);
  ante la duda de si un archivo es oficial o de trabajo, confirmar antes de
  borrar. Rutas conocidas donde buscar este tipo de material por ID:
  - `docs/superpowers/plans/<fecha>-<id-en-minusculas>-*.md`
  - `docs/superpowers/specs/<fecha>-<id-en-minusculas>-*.md`
  - `.superpowers/sdd/<fecha>-<id-en-minusculas>-*/` (brief, progress, report,
    review-package.diff; conservar solo `.superpowers/sdd/.gitignore`)

Escalar tags, versiones, release, publicación, permisos CI y cualquier operación
destructiva al orquestador.
