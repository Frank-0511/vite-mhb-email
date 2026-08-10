---
name: email-quality-gates
description: Aplicar calidad, seguridad, JSDoc, validación runtime, errores, dependencias y pruebas en EmailForge Toolkit. Usar al modificar scripts, APIs Vite, frontend, CLI, filesystem o validadores.
---

# Calidad y seguridad

- Añadir JSDoc a funciones exportadas, async, middlewares, helpers de
  filesystem/JSON/HTML y contratos compartidos. Preferir `Record<string, unknown>`
  o typedefs a `Object` y explicar cualquier `any`.
- Mantener ESLint sobre `scripts/`, `src/web/`, `vite.config.js` y
  `maizzle.config.js`. No desactivar reglas inline sin razón local.
- Validar en runtime rutas, nombres de templates, JSON, query/body y variantes.
  Resolver entradas dentro de su raíz permitida; no usar shell con datos de
  usuario.
- Capturar errores en entrypoints, CLI, middlewares y filesystem; preservar la
  causa, restaurar estado temporal y devolver códigos HTTP accionables.
- No imprimir secretos, escribir fuera del workspace, ejecutar operaciones
  destructivas ni añadir dependencias sin justificar costo y mantenimiento.
- Para cambios de scripts o frontend ejecutar como mínimo `bun run lint`,
  controles del ID y `bun run format:check`.

No convertir validación estática en prueba de compatibilidad real de clientes de
email.
