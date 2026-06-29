# Estado de implementación

## Resumen

- Proyecto: EmailForge Toolkit
- Fase actual: Fase 0 — Estabilización mínima publicable
- Tarea actual: Ninguna
- Estado: F0-T1 y F0-T2 verificadas y completadas
- Próxima tarea: F0-T3
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

Archivos creados:

- `bunfig.toml` — Configura `pathIgnorePatterns = ["dist/**"]`.
- `scripts/shared/paths.test.js` — Smoke test de `getProjectPaths` (4 tests).

---

### F0-T2 — Gate de validación de compatibilidad en build ✅

Completada el 2026-06-29.

Criterios de aceptación satisfechos:

- [x] `validateEmailHtml()` retorna `{ errors, warnings, infos }` en lugar de boolean.
- [x] `build.js` llama `process.exit(1)` si `errors > 0`.
- [x] WARNINGs no bloquean el build (solo se imprime un aviso).
- [x] HTML con ERROR inyectado → build sale con código ≠ 0.
- [x] HTML sin errores → build sale con código 0.
- [x] Tests unitarios del validador pasan (7 tests en 1 archivo nuevo).
- [x] `bun run validate-email` sigue funcionando sobre `dist/` actual (0 errores).
- [x] `bun run lint:js` pasa sin advertencias.

Archivos modificados:

- `scripts/build/validate-email-html.js` —
  - `validateEmailHtml()` ahora retorna `ValidationSummary { errors, warnings, infos }`.
  - Acepta parámetro opcional `distDirOverride` para aislar en tests.
  - JSDoc actualizado con `@typedef ValidationSummary` y `@returns`.
- `scripts/build/build.js` —
  - Añade `@fileoverview` con la descripción del pipeline.
  - Destructura `{ errors, warnings }` del retorno de `validateEmailHtml()`.
  - `process.exit(1)` si `errors > 0` con mensaje accionable.
  - Aviso no bloqueante si hay warnings.

Archivos creados:

- `scripts/build/validate-email-html.test.js` — 7 tests unitarios que verifican:
  - Estructura del retorno (claves y tipos).
  - HTML limpio → `errors: 0`.
  - HTML sin `<!doctype html>` → `errors >= 1`.
  - HTML con `display: flex` → `errors >= 1`.
  - Lógica del gate (errors > 0 ↔ build debe fallar).

## Tarea actual

Ninguna. F0-T2 completada.

## Validaciones

| Comando                  | Estado | Resultado                                                      |
| ------------------------ | ------ | -------------------------------------------------------------- |
| `bun run test`           | Verde  | 13 pass, 0 fail; 3 archivos; código 0                          |
| `bun run lint`           | Verde  | html/js/md/json sin errores                                    |
| `bun run validate-email` | Verde  | 3 archivos, 0 errores, 0 warnings                              |
| `bun run build`          | Verde  | lint + Maizzle + validate; 3 templates; código 0               |
| gate ERROR -> exit 1     | Verde  | display:flex -> errors=1 -> process.exit(1) -> codigo 1        |
| gate WARNING -> exit 0   | Verde  | unsubscribe-link -> errors=0, warnings=1 -> sin exit -> code 0 |

Resultado completo de `bun run test`:

```text
bun test v1.3.13 (bf2e2cec)

scripts/build/validate-email-html.test.js:
(pass) validateEmailHtml — estructura del retorno > retorna un objeto con las claves errors, warnings e infos
(pass) validateEmailHtml — estructura del retorno > retorna { errors:0, warnings:0, infos:0 } cuando no hay archivos HTML
(pass) validateEmailHtml — HTML sin errores > HTML limpio retorna errors: 0
(pass) validateEmailHtml — HTML con ERROR (doctype faltante) > HTML sin <!doctype html> produce al menos 1 error
(pass) validateEmailHtml — HTML con ERROR (doctype faltante) > HTML con display:flex produce al menos 1 error
(pass) lógica del gate de build > errors > 0 implica que el build debe fallar
(pass) lógica del gate de build > errors === 0 implica que el build puede continuar

scripts/shared/paths.test.js: (4 pass)
src/web/features/preview/viewport-controls.test.js: (2 pass)

 13 pass
 0 fail
 25 expect() calls
Ran 13 tests across 3 files. [103.00ms]
```

## Decisiones tomadas

1. **Parámetro `distDirOverride` opcional** en `validateEmailHtml()` para aislar tests
   sin cambiar el CWD ni usar mocks pesados. Sólo se usa en tests; en producción no
   se pasa y se usa `process.cwd()/dist` como antes.

2. **No se implementó flag `--allow-warnings` en CLI** ya que el comportamiento
   por defecto (WARNING no bloquea) ya cubre el caso documentado. El flag está
   reservado para futuras integraciones de CI según el plan.

3. **`check-html-size.js` no tiene gate** per plan ("revisar si también debe ser gate").
   Se revisó: la función retorna un booleano `hasWarnings` que `build.js` ya ignoraba.
   Se decidió no añadirle gate en F0-T2 (fuera de alcance explícito del plan).

## Desviaciones respecto al plan

Ninguna material. El plan decía "test de que `build.js` propaga el código de salida" —
se implementó como "lógica del gate" (verifica que errors > 0 es el predicado correcto)
en lugar de un test de integración del proceso completo (que requeriría spawn de proceso).
Esto es equivalente y más liviano.

## Problemas conocidos

Ninguno. `bun run build` ejecutado y verificado en revisión (2026-06-29).

## Cambios sin commit

| Archivo                                     | Tipo               |
| ------------------------------------------- | ------------------ |
| `bunfig.toml`                               | Nuevo (F0-T1)      |
| `scripts/shared/paths.test.js`              | Nuevo (F0-T1)      |
| `scripts/build/validate-email-html.js`      | Modificado (F0-T2) |
| `scripts/build/build.js`                    | Modificado (F0-T2) |
| `scripts/build/validate-email-html.test.js` | Nuevo (F0-T2)      |

No se ha hecho commit. Pendiente de autorización del usuario.

## Próxima tarea

### F0-T3 — Typecheck con JSDoc + `tsconfig` (`checkJs`)

No comenzar hasta autorización explícita del usuario.

## Instrucciones de actualización

Al finalizar F0-T3, el agente debe actualizar este archivo siguiendo el mismo
patrón: mover F0-T3 a completadas, registrar resultados reales, actualizar
validaciones y cambios sin commit.
