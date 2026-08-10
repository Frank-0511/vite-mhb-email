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
  `master`. No mezclar tareas ni incrementar versión por tarea.
- Antes de commit, revisar diff. No versionar logs o artefactos no solicitados,
  no reescribir historial ni revertir cambios ajenos.
- Entregar el ID a `En revisión`; un revisor independiente confirma aceptación,
  diff, pruebas y ausencia de desviaciones antes de `Completada`.

Escalar tags, versiones, release, publicación, permisos CI y cualquier operación
destructiva al orquestador.
