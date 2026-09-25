---
name: task-review
description: Procedimiento de revisión técnica independiente de tareas completadas. Usar para evaluar entregas en revisión mediante checkout limpio, re-ejecución de gates, auditoría de diff y contraste de criterios.
---

# Revisión técnica independiente

## Mandato del revisor independiente

- La revisión técnica la realiza un agente o revisor distinto del implementador
  (típicamente el orquestador en el chat principal).
- Lo declarado por el implementador en `STATUS.md` no se asume como válido por
  sí solo; el revisor debe reproducir los controles y verificar la evidencia
  directamente en el árbol de trabajo.

## Procedimiento de revisión paso a paso

1. **Checkout limpio y re-ejecución de gates:**
   - Realizar checkout en la rama de la tarea (`git checkout feature/<id-en-minusculas>`).
   - Ejecutar la suite completa de gates del proyecto:
     `bun run check:task-branch`, `bun run lint`, `bun run typecheck`,
     `bun run test`, `bun run format:check`, `bun run build`,
     `bun run validate-email`, `bun run check:dist-baseline`,
     `bun run check-size`, `bun run agents:check` y `git diff --check`.
   - Si algún control falla, la entrega no puede aprobarse.
   - Confirmar que los jobs requeridos en CI para MHB-45 coincidan con `CI Pipeline` (`ci.yml`) y `Accessibility & Contrast Audit` (`audit.yml`).

2. **Auditoría profunda del diff (`git diff master...HEAD`):**
   - Buscar exclusiones o supresiones no autorizadas:
     - Directivas `eslint-disable` o modificaciones a `ignores` en `eslint.config.js`.
     - Directivas `@ts-ignore` o `@ts-expect-error`.
     - Modificaciones o exclusiones en `tsconfig*.json`.
     - Tests marcados como `skip` o `todo`.
     - Nuevas excepciones o exclusiones relajantes añadidas a
       `scripts/validators/lint-guards/file-tree.test.ts`.
     - Archivos `.js` o `.mjs` nuevos (salvo allowlist de MHB-42).
   - Cualquier supresión o exclusión debe figurar aprobada y documentada en
     `STATUS.md` como desviación; en caso contrario, se rechaza la entrega.
   - Los límites de 250 líneas no-test, 400 líneas tests y máximo 8 archivos
     por carpeta ya los valida `file-tree.test.ts`; verificar que el test corra
     y pase sin exclusiones artificiosas.

3. **Verificación del contrato de salida y variables ESP:**
   - Inspeccionar `git diff master...HEAD -- dist/`.
   - Comprobar que ninguna variable ESP `{{ }}` ni bloque Handlebars haya sido
     consumido o alterado sin autorización explícita del ID.
   - Comparar hashes de `dist/*.html` y variables ESP contra el baseline registrado
     mediante `bun run check:dist-baseline`.

4. **Integridad de rutas y contratos en PLAN.md:**
   - Si la tarea eliminó o renombró archivos, comprobar que todas las rutas
     referenciadas en contratos pendientes de `docs/implementation/PLAN.md`
     hayan sido actualizadas correspondientemente en la misma entrega.

5. **Contraste de criterios de aceptación:**
   - Contrastar cada criterio de aceptación del ID en `PLAN.md` contra su
     comando o prueba automatizada asociada.
   - Para criterios no automatizables, verificar la evidencia manual registrada.

6. **Emisión de veredicto y handoff:**
   - Emitir veredicto formal: `Aprobado` o `Rechazado`.
   - Si es **Rechazado**: detallar los hallazgos accionables para que el
     implementador los resuelva y mantener el estado en `En revisión` o `Bloqueada`.
   - Si es **Aprobado**: registrar la sección `## Revisión de cierre` en
     `docs/implementation/STATUS.md` con criterios, controles, evidencia,
     rama y commit, actualizar `## Últimas entregas` y cambiar el estado a
     `Completada`.
