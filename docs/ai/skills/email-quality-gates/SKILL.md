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
- Aplicar linting con tipos sobre `tsconfig.strict.json` (reglas `@typescript-eslint`:
  `no-floating-promises`, `no-misused-promises`, `await-thenable`,
  `no-redundant-type-constituents`, `require-await`, `return-await`).
- Validar convención de nombres y estructura con `eslint-plugin-check-file` (kebab-case
  obligatorio, sin prefijo redundante de carpeta padre ni nombres genéricos) y con
  el validador de árbol `scripts/validators/lint-guards/file-tree.test.ts` (límites
  de 250 líneas no-test, 400 líneas tests y máximo 8 archivos por carpeta).
- Validar en runtime rutas, nombres de templates, JSON, query/body y variantes.
  Resolver entradas dentro de su raíz permitida; no usar shell con datos de
  usuario.
- Capturar errores en entrypoints, CLI, middlewares y filesystem; preservar la
  causa, restaurar estado temporal y devolver códigos HTTP accionables.
- No imprimir secretos, escribir fuera del workspace, ejecutar operaciones
  destructivas ni añadir dependencias sin justificar costo y mantenimiento.
- Fijar todas las dependencias (`dependencies` y `devDependencies` de
  `package.json`) a versión exacta, sin rangos (`^`, `~`, `>=`, etc.). Tras
  cualquier cambio de versión ejecutar `bun install` para mantener
  `bun.lock` sincronizado.
- Para cambios de scripts o frontend ejecutar como mínimo `bun run lint`,
  controles del ID y `bun run format:check`.

No convertir validación estática en prueba de compatibilidad real de clientes de
email.
