# Estado de implementación

## Resumen

- Proyecto: EmailForge Toolkit
- Fase actual: Fase 0 — Estabilización mínima publicable
- Tarea actual: Ninguna
- Estado: F0-T1 completada
- Próxima tarea: F0-T2
- Última actualización: 2026-06-29

## Tareas completadas

### F0-T1 — Conectar runner de tests (`bun test`) ✅

Completada el 2026-06-29.

Criterios de aceptación satisfechos:

- [x] `bun run test` descubre y ejecuta al menos un test.
- [x] El test existente de viewport pasa (2/2 pass).
- [x] Existe una prueba en `scripts/shared/` (paths.test.js, 4 tests).
- [x] No se recolectan tests de `node_modules/` (excluido por defecto por Bun).
- [x] No se recolectan tests de `dist/` (excluido explícitamente en bunfig.toml).
- [x] La ejecución termina con código 0.
- [x] `bun run test:watch` está configurado (existía en package.json).

Archivos modificados / creados:

- `bunfig.toml` — Nuevo. Configura `pathIgnorePatterns` para excluir `dist/**`.
- `scripts/shared/paths.test.js` — Nuevo. Prueba de humo que verifica el
  descubrimiento de tests fuera de `src/web/` y ejercita `getProjectPaths`.

Archivos sin modificar (ya estaban correctos):

- `package.json` — Scripts `test` y `test:watch` ya existían correctamente.
- `src/web/features/preview/viewport-controls.test.js` — Test preexistente, pasó sin modificaciones.

## Tarea actual

Ninguna. F0-T1 completada.

## Validaciones

| Comando           | Estado    | Resultado                                      |
| ----------------- | --------- | ---------------------------------------------- |
| `bun run test`    | ✅ Pasa   | 6 pass, 0 fail; 2 archivos; código de salida 0 |
| `bun run lint:js` | ✅ Pasa   | Sin errores ni advertencias                    |
| `bun run build`   | Pendiente | No ejecutado (fuera de alcance de F0-T1)       |

Resultado completo de `bun run test`:

```text
bun test v1.3.13 (bf2e2cec)

scripts/shared/paths.test.js:
(pass) getProjectPaths > retorna distDir relativo al rootDir proporcionado [0.08ms]
(pass) getProjectPaths > retorna templatesRoot relativo al rootDir proporcionado [0.03ms]
(pass) getProjectPaths > templateHtml construye la ruta correcta para un template [0.04ms]
(pass) getProjectPaths > templateData construye la ruta correcta para un template [0.04ms]

src/web/features/preview/viewport-controls.test.js:
(pass) viewport custom width controls > keeps partial input editable while typing custom widths [0.21ms]
(pass) viewport custom width controls > normalizes custom width only when committing [0.12ms]

 6 pass
 0 fail
 11 expect() calls
Ran 6 tests across 2 files. [78.00ms]
```

## Decisiones tomadas

1. **bunfig.toml creado** para exclusión explícita de `dist/`. Bun excluye
   `node_modules` por defecto; `dist/` requiere `pathIgnorePatterns`.

2. **package.json sin modificar.** Scripts `test` y `test:watch` ya existían
   correctamente desde la sesión anterior (cf51816f).

3. **Smoke test en paths.js.** Se eligió `getProjectPaths` porque es un helper
   puro sin efectos secundarios y no depende de `.env` ni binarios externos.

## Desviaciones respecto al plan

Ninguna. El plan mencionaba `bunfig.toml` como opcional; se creó al verificar
que `dist/` no se excluye automáticamente en Bun 1.3.13.

## Problemas conocidos

- El tool `write_to_file` trunca contenido con arrays TOML en rutas WSL.
  Se resolvió usando scripts auxiliares ejecutados con Bun.

## Cambios sin commit

| Archivo                        | Tipo  |
| ------------------------------ | ----- |
| `bunfig.toml`                  | Nuevo |
| `scripts/shared/paths.test.js` | Nuevo |

No se ha hecho commit. Pendiente de autorización del usuario.

## Próxima tarea

### F0-T2 — Gate de validación de compatibilidad en build

No comenzar hasta autorización explícita del usuario.

## Instrucciones de actualización

Al finalizar F0-T2, el agente debe actualizar este archivo siguiendo el mismo
patrón: mover F0-T2 a completadas, registrar resultados reales, actualizar
validaciones y cambios sin commit.
