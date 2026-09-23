---
name: email-code-conventions
description: Convenciones de nombres, estructura de archivos y tipado estricto en EmailForge Toolkit. Usar al crear, renombrar o mover archivos y módulos.
---

# Convenciones de código y estructura

## Nombres y estructura de archivos

- Todo archivo y directorio debe usar `kebab-case`.
- Sufijos por rol: `.contract.ts` (contratos puros), `.view.ts` (componentes/vistas DOM),
  `.parser.ts` (análisis/transformación), `.store.ts` (estado reactivo/storage),
  `.types.ts` (tipos e interfaces), `.utils.ts` (helpers con dominio), `.test.ts` (pruebas).
- Prohibido nombres genéricos: `helpers.ts`, `utils.ts`, `*-helper.ts` (singular).
- No repetir el nombre de la carpeta contenedora como prefijo del archivo cuando la
  carpeta ya provee el contexto (ej: en `scripts/esp/` usar `validator.ts`, no `esp-validator.ts`).
- Límites: máximo 250 líneas en producción, 400 líneas en tests, y máximo 8 archivos
  fuente de producción por directorio. Verificado por `scripts/validators/lint-guards/file-tree.test.ts`.

## Convenciones de casing de identificadores

- Funciones y variables: `camelCase`.
- Constantes de configuración, códigos y enums: `UPPER_SNAKE_CASE`.
- Tipos, interfaces, clases y componentes: `PascalCase`.

## Tipado estricto y manejo de promesas

- El proyecto aplica linting con tipos sobre `tsconfig.strict.json` mediante
  `@typescript-eslint` (`no-floating-promises`, `no-misused-promises`, `await-thenable`,
  `no-redundant-type-constituents`, `require-await`, `return-await`).
- Prohibidas las promesas flotantes (`no-floating-promises`): todo valor devuelto
  por una función `async` debe esperarse con `await`, capturarse con `.catch(...)`
  o marcarse explícitamente con `void` documentado.
- Middlewares asíncronos en `scripts/vite/api/`: envolver con `asyncHandler`
  de `scripts/vite/api/http.ts` para devolver middleware síncrono que capture
  errores no manejados y responda JSON 500.
