# Estado de implementación

## Resumen

- Proyecto: EmailForge Toolkit
- Fase actual: Fase 0 — Estabilización mínima publicable
- Tarea actual: F0-T3 — Typecheck con JSDoc + `tsconfig` (`checkJs`)
- Estado: En revisión
- Última actualización: 2026-06-30

## Tareas completadas

### F0-T1 — Conectar runner de tests (`bun test`) ✅

Completada el 2026-06-29.

- `bun run test` descubre tests en `scripts/` y `src/web/`.
- `dist/` queda excluido mediante `bunfig.toml`.
- Se añadió un smoke test para `getProjectPaths`.

### F0-T2 — Gate de validación de compatibilidad en build ✅

Completada el 2026-06-29.

- El validador devuelve conteos por severidad.
- Los errores bloquean el build; las advertencias no lo bloquean.
- El comportamiento quedó cubierto por tests unitarios.

## Tarea actual

### F0-T3 — Typecheck con JSDoc + `tsconfig` (`checkJs`)

- Estado: En revisión.
- Cambios realizados:
  1. Instalado `typescript@6.0.3` y `@types/node@26.0.1` como devDependencies.
  2. Creado `tsconfig.json` con `allowJs`, `checkJs`, `noEmit`, `module: nodenext`,
     `types: ["node"]`, `skipLibCheck: true`, `include` acotado a
     `scripts/shared/**` y `scripts/build/**` (excluye `*.test.js`).
  3. Añadido script `"typecheck": "tsc --noEmit"` en `package.json`.
  4. `bun run typecheck` pasa en verde sin errores (R3 mitigado).

## Validaciones

| Comando                  | Estado | Resultado resumido                                 |
| ------------------------ | ------ | -------------------------------------------------- |
| `bun run test`           | Verde  | 13 tests aprobados el 2026-06-30                   |
| `bun run lint`           | Verde  | Sin errores el 2026-06-30                          |
| `bun run validate-email` | Verde  | 3 archivos sin issues el 2026-06-29                |
| `bun run build`          | Verde  | 3 templates compilados el 2026-06-29               |
| `bun run typecheck`      | Verde  | 0 errores; alcance: scripts/shared + scripts/build |

## Decisiones persistentes

- El proyecto mantiene JavaScript ESM con JSDoc; no se hará una migración global
  a TypeScript.
- El typecheck inicial se limita a `scripts/shared/**` y `scripts/build/**`;
  se ampliará en F2-T1.
- `typescript@6.0.3` y `@types/node@26.0.1` son devDependencies; `skipLibCheck: true`
  evita ruido de tipos en dependencias de terceros.
- `tsconfig.json` excluye `*.test.js` (evaluados por `bun test`) y `dist/`.
- `dist/` permanece excluido del descubrimiento de tests.
- Los errores de compatibilidad bloquean el build; las advertencias no.
- `validateEmailHtml()` admite `distDirOverride` para aislar tests.

## Desviaciones

- F0-T2 validó el predicado del gate mediante tests unitarios en lugar de un
  test de integración que ejecute el proceso completo.
- El flag `--allow-warnings` previsto en F0-T2 no se implementó porque las
  advertencias ya son no bloqueantes por defecto.
- F0-T3 requirió instalar `@types/node` (además de `typescript`) para resolver
  `process`, `console` y módulos `node:*`; no era una dependencia bloqueante
  conocida, pero es correcta y mínima.

## Bloqueos

- F0-T3 no tiene bloqueos conocidos.
- F0-T4 debe permanecer pendiente hasta que F0-T3 sea revisada y marcada como
  `Completada`.

## Handoff

- F0-T3 queda en `En revisión`. Revisar criterios de aceptación, diff y validaciones.
- Si la revisión es exitosa, marcar F0-T3 como `Completada` y proceder con F0-T4.
- Archivos cambiados: `tsconfig.json` (nuevo), `package.json` (script `typecheck`,
  devDeps `typescript` y `@types/node`), `docs/implementation/STATUS.md`.
- Worktree con cambios pendientes (sin commit).
